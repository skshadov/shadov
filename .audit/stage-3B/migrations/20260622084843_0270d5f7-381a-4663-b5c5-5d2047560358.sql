
-- Lock down SECURITY DEFINER helpers to least privilege
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
-- has_role is also called inside RLS policies; SECURITY DEFINER + service_role still works
-- because the function executes as its owner (postgres) regardless of caller's grants.

REVOKE ALL ON FUNCTION public.is_project_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- Trigger runs as table owner via SECURITY DEFINER; no grants to roles needed.

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
-- Same: trigger function.

REVOKE ALL ON FUNCTION public.consume_submission_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_submission_rate_limit(text, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.cleanup_expired_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_rate_limits() TO service_role;

REVOKE ALL ON FUNCTION public.create_estimate_request_transaction(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_estimate_request_transaction(jsonb) TO service_role;
