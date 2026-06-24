-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Revoke EXECUTE from anon on SECURITY DEFINER helper/RPC functions.
--    These all rely on auth.uid() and are only meaningful for signed-in users.
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_admin_permission(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_primary_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_projects() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_admin_permissions() FROM anon;
REVOKE EXECUTE ON FUNCTION public.respond_to_stage_acceptance(uuid, text, text) FROM anon;

-- Also revoke from PUBLIC just in case any future default leaks through.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_admin_permission(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_primary_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_projects() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_admin_permissions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.respond_to_stage_acceptance(uuid, text, text) FROM PUBLIC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. company_settings: hide banking & legal_address from anonymous visitors
--    via column-level SELECT privileges. The published=true RLS policy stays,
--    but anon's table-level SELECT is narrowed to non-sensitive columns only.
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE SELECT ON public.company_settings FROM anon;
GRANT SELECT (
  id, singleton, legal_name, brand_name, brand_full, domain,
  inn, kpp, ogrn,
  office_address,
  phone, phone_e164, email, telegram, whatsapp, working_hours,
  sro_name, sro_number, sro_registry_url,
  years_on_market, staff_count, projects_count, warranty_years,
  published, created_at, updated_at
) ON public.company_settings TO anon;

-- Authenticated keeps full SELECT (admin paths rely on it; RLS still gates rows).
GRANT SELECT ON public.company_settings TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. site-media bucket: allow public website visitors to read files.
--    Existing admin-only INSERT/UPDATE/DELETE policies remain unchanged.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS site_media_public_read ON storage.objects;
CREATE POLICY site_media_public_read
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'site-media');