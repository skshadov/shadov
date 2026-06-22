CREATE OR REPLACE FUNCTION public.stage3e_fault_injection_submission(_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
  v_user_id uuid := NULLIF(_payload->>'user_id','')::uuid;
  v_consent_at timestamptz := COALESCE((_payload->>'consent_accepted_at')::timestamptz, now());
BEGIN
  INSERT INTO public.estimate_requests (
    request_number, submission_id, user_id, source_path,
    contact_name, email, consent_version, consent_accepted_at, status
  ) VALUES (
    _payload->>'request_number',
    (_payload->>'submission_id')::uuid,
    v_user_id,
    _payload->>'source_path',
    _payload->>'contact_name',
    _payload->>'email',
    _payload->>'consent_version',
    v_consent_at,
    'new'
  ) RETURNING id INTO v_request_id;

  INSERT INTO public.consent_records (request_id, user_id, document_slug, document_version, accepted_at)
  VALUES (v_request_id, v_user_id, 'privacy', _payload->>'consent_version', v_consent_at);

  RAISE EXCEPTION 'stage3e_fault_injection' USING ERRCODE = 'P0001';
END;
$$;

REVOKE ALL ON FUNCTION public.stage3e_fault_injection_submission(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.stage3e_fault_injection_submission(jsonb) TO service_role;