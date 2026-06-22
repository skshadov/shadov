CREATE OR REPLACE FUNCTION public.stage3d_fault_injection_submission(_submission_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'stage3d_fault_injection: forced rollback for %', _submission_id;
END;
$$;
REVOKE ALL ON FUNCTION public.stage3d_fault_injection_submission(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.stage3d_fault_injection_submission(uuid) TO service_role;