
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
  SELECT er.id, er.request_number INTO v_existing_id, v_existing_num
    FROM public.estimate_requests er WHERE er.submission_id = v_submission_id LIMIT 1;
  IF v_existing_id IS NOT NULL THEN
    request_number := v_existing_num;
    created := false;
    RETURN NEXT;
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

  INSERT INTO public.consent_records (request_id, user_id, document_slug, document_version, accepted_at)
  VALUES
    (v_new_id, v_user_id, 'privacy', v_consent_ver, v_consent_at),
    (v_new_id, v_user_id, 'personal-data-consent', v_consent_ver, v_consent_at);

  request_number := v_request_num;
  created := true;
  RETURN NEXT;
END;
$$;
REVOKE ALL ON FUNCTION public.create_estimate_request_transaction(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_estimate_request_transaction(jsonb) TO service_role;
