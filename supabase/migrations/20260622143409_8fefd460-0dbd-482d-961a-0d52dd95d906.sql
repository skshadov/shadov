
-- 1. Tighten client read on project_documents: hidden rows must be invisible to clients.
DROP POLICY IF EXISTS "members read documents" ON public.project_documents;

CREATE POLICY "members read visible documents"
  ON public.project_documents
  FOR SELECT
  TO authenticated
  USING (
    is_visible_to_client = true
    AND public.is_project_member(project_id, auth.uid())
  );

-- Admin policy "admins manage documents" already covers ALL (incl. hidden) — unchanged.

-- 2. Membership-scoped projects RPC: never returns admin-visible projects unless caller is a member.
CREATE OR REPLACE FUNCTION public.get_my_projects()
RETURNS TABLE (
  id uuid,
  title text,
  status text,
  description text,
  is_demo boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.title, p.status, p.description, p.is_demo, p.created_at
  FROM public.projects p
  JOIN public.project_members pm ON pm.project_id = p.id
  WHERE pm.user_id = auth.uid()
  ORDER BY p.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_my_projects() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_projects() TO authenticated, service_role;
