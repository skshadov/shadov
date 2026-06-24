
-- 1) company_settings: remove bank + legal-ID columns from anon's column SELECT grant
REVOKE SELECT ON public.company_settings FROM anon;
GRANT SELECT (
  id, singleton, legal_name, brand_name, brand_full, domain,
  office_address,
  phone, phone_e164, email, telegram, whatsapp, working_hours,
  sro_name, sro_number, sro_registry_url,
  years_on_market, staff_count, projects_count, warranty_years,
  published, created_at, updated_at
) ON public.company_settings TO anon;

-- 2) SECURITY DEFINER functions that must never be called directly by signed-in users
--    (server/edge-function only; called via service_role).
REVOKE EXECUTE ON FUNCTION public.consume_submission_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_estimate_request_transaction(jsonb) FROM PUBLIC, anon, authenticated;

-- 3) project_camera_sources: explicit deny of table-level reads for anon/authenticated.
--    Admin-only access continues via RLS policy pcs_admin_all + service_role grants.
REVOKE ALL ON public.project_camera_sources FROM anon, authenticated;
