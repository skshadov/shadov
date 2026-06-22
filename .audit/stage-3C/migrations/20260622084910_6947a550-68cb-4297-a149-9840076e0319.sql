
-- RLS policies call these functions in USING clauses; the caller's role
-- must have EXECUTE or the policy expression errors out. SECURITY DEFINER
-- means the function body executes as its owner, so this does NOT grant
-- elevation — calling has_role just returns a boolean.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) TO authenticated;
