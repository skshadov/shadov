CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.role() = 'service_role' THEN EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
    )
    WHEN auth.role() = 'authenticated' AND _user_id = auth.uid() THEN EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
    )
    ELSE false
  END;
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_project_member(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.role() = 'service_role' THEN EXISTS (
      SELECT 1 FROM public.project_members WHERE project_id = _project_id AND user_id = _user_id
    )
    WHEN auth.role() = 'authenticated' AND _user_id = auth.uid() THEN EXISTS (
      SELECT 1 FROM public.project_members WHERE project_id = _project_id AND user_id = _user_id
    )
    ELSE false
  END;
$$;
REVOKE ALL ON FUNCTION public.is_project_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_estimate_request_transaction(
  _payload jsonb
) RETURNS TABLE(request_number text, created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission_id uuid := (_payload->>'submission_id')::uuid;
  v_request_num   text := _payload->>'request_number';
  v_consent_ver   text := _payload->>'consent_version';
  v_user_id       uuid := NULLIF(_payload->>'user_id','')::uuid;
  v_consent_at    timestamptz := COALESCE((_payload->>'consent_accepted_at')::timestamptz, now());
  v_request_id    uuid;
BEGIN
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
  ON CONFLICT (submission_id) DO NOTHING
  RETURNING id, public.estimate_requests.request_number INTO v_request_id, request_number;

  IF v_request_id IS NOT NULL THEN
    INSERT INTO public.consent_records (request_id, user_id, document_slug, document_version, accepted_at)
    VALUES
      (v_request_id, v_user_id, 'privacy', v_consent_ver, v_consent_at),
      (v_request_id, v_user_id, 'personal-data-consent', v_consent_ver, v_consent_at);
    created := true;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT er.id, er.request_number INTO v_request_id, request_number
  FROM public.estimate_requests er
  WHERE er.submission_id = v_submission_id
  LIMIT 1;

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'idempotency_lookup_failed';
  END IF;

  created := false;
  RETURN NEXT;
END;
$$;
REVOKE ALL ON FUNCTION public.create_estimate_request_transaction(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_estimate_request_transaction(jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.stage3c_fault_injection_submission(_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission_id uuid := (_payload->>'submission_id')::uuid;
  v_request_num text := _payload->>'request_number';
  v_user_id uuid := NULLIF(_payload->>'user_id','')::uuid;
  v_request_id uuid;
BEGIN
  INSERT INTO public.estimate_requests (
    request_number, submission_id, user_id, source_path, contact_name, email,
    consent_version, consent_accepted_at, status
  ) VALUES (
    v_request_num, v_submission_id, v_user_id, '/stage3c-fault', 'Stage3C Fault', 'stage3c-fault@example.invalid',
    'stage3c-test', now(), 'new'
  ) RETURNING id INTO v_request_id;

  RAISE EXCEPTION 'stage3c_fault_after_request_before_consents';
END;
$$;
REVOKE ALL ON FUNCTION public.stage3c_fault_injection_submission(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.stage3c_fault_injection_submission(jsonb) TO service_role;