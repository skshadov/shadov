
-- Stage 3B: atomic rate limit, transactional submission, profile column grants, cleanup

-- 1. Restrict profiles UPDATE to (display_name, phone) only
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT SELECT, INSERT ON public.profiles TO authenticated;
GRANT UPDATE (display_name, phone) ON public.profiles TO authenticated;

-- 2. Atomic rate-limit consume function (service_role only)
CREATE OR REPLACE FUNCTION public.consume_submission_rate_limit(
  _key_hash text,
  _window_ms integer,
  _max_attempts integer
) RETURNS TABLE(allowed boolean, attempt_count integer, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_window_end   timestamptz;
  v_count        integer;
  v_now          timestamptz := now();
BEGIN
  v_window_start := to_timestamp(floor(extract(epoch from v_now) * 1000 / _window_ms) * _window_ms / 1000.0);
  v_window_end   := v_window_start + (_window_ms || ' milliseconds')::interval;

  -- Cleanup expired rows opportunistically
  DELETE FROM public.submission_rate_limits WHERE expires_at < v_now;

  INSERT INTO public.submission_rate_limits (key_hash, window_started_at, attempt_count, expires_at)
  VALUES (_key_hash, v_window_start, 1, LEAST(v_window_end + interval '1 hour', v_now + interval '24 hours'))
  ON CONFLICT (key_hash, window_started_at)
  DO UPDATE SET attempt_count = public.submission_rate_limits.attempt_count + 1
  RETURNING public.submission_rate_limits.attempt_count INTO v_count;

  IF v_count > _max_attempts THEN
    RETURN QUERY SELECT false, v_count, GREATEST(1, ceil(extract(epoch from (v_window_end - v_now)))::integer);
  ELSE
    RETURN QUERY SELECT true, v_count, 0;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_submission_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_submission_rate_limit(text, integer, integer) TO service_role;

-- Make sure (key_hash, window_started_at) is unique for ON CONFLICT
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='submission_rate_limits_key_window_uniq') THEN
    CREATE UNIQUE INDEX submission_rate_limits_key_window_uniq
      ON public.submission_rate_limits(key_hash, window_started_at);
  END IF;
END $$;

-- 3. Cleanup function for expired rate-limit rows
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_deleted integer;
BEGIN
  DELETE FROM public.submission_rate_limits WHERE expires_at < now();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
REVOKE ALL ON FUNCTION public.cleanup_expired_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_rate_limits() TO service_role;

-- 4. Transactional submission RPC: create-or-fetch request + 2 consents in single transaction
CREATE OR REPLACE FUNCTION public.create_estimate_request_transaction(
  _payload jsonb
) RETURNS TABLE(request_number text, created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission_id uuid := (_payload->>'submission_id')::uuid;
  v_existing_id   uuid;
  v_existing_num  text;
  v_new_id        uuid;
  v_request_num   text := _payload->>'request_number';
  v_consent_ver   text := _payload->>'consent_version';
  v_user_id       uuid := NULLIF(_payload->>'user_id','')::uuid;
  v_consent_at    timestamptz := COALESCE((_payload->>'consent_accepted_at')::timestamptz, now());
BEGIN
  -- Idempotency
  SELECT id, request_number INTO v_existing_id, v_existing_num
    FROM public.estimate_requests WHERE submission_id = v_submission_id LIMIT 1;
  IF v_existing_id IS NOT NULL THEN
    RETURN QUERY SELECT v_existing_num, false;
    RETURN;
  END IF;

  INSERT INTO public.estimate_requests (
    request_number, submission_id, user_id, source_path, service_slug, calculator_mode,
    contact_name, phone, email, message, calculator_snapshot, price_version,
    consent_version, consent_accepted_at, status
  ) VALUES (
    v_request_num, v_submission_id, v_user_id,
    _payload->>'source_path', NULLIF(_payload->>'service_slug',''),
    NULLIF(_payload->>'calculator_mode',''),
    _payload->>'contact_name', NULLIF(_payload->>'phone',''), NULLIF(_payload->>'email',''),
    NULLIF(_payload->>'message',''),
    CASE WHEN _payload ? 'calculator_snapshot' AND _payload->'calculator_snapshot' <> 'null'::jsonb
         THEN _payload->'calculator_snapshot' ELSE NULL END,
    NULLIF(_payload->>'price_version',''),
    v_consent_ver, v_consent_at, 'new'
  )
  RETURNING id INTO v_new_id;

  -- Two consent records in same transaction; failure rolls back the request
  INSERT INTO public.consent_records (request_id, user_id, document_slug, document_version, accepted_at)
  VALUES
    (v_new_id, v_user_id, 'privacy', v_consent_ver, v_consent_at),
    (v_new_id, v_user_id, 'personal-data-consent', v_consent_ver, v_consent_at);

  RETURN QUERY SELECT v_request_num, true;
END;
$$;
REVOKE ALL ON FUNCTION public.create_estimate_request_transaction(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_estimate_request_transaction(jsonb) TO service_role;

-- 5. Storage path safety: replace previous policy with safer one that validates UUID format
DROP POLICY IF EXISTS "project docs members read" ON storage.objects;
CREATE POLICY "project docs members read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND (string_to_array(name, '/'))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.is_project_member(
      ((string_to_array(name, '/'))[1])::uuid,
      auth.uid()
    )
  );
