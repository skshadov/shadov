-- 1) Remove world-readable metadata for media library
DROP POLICY IF EXISTS "media_assets_read_public" ON public.media_assets;
REVOKE SELECT ON public.media_assets FROM anon;

-- 2) Remove unrestricted public read on the private site-media bucket
DROP POLICY IF EXISTS "site_media_public_read" ON storage.objects;

-- 3) Revoke EXECUTE on unused SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.get_my_projects() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.respond_to_stage_acceptance(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_projects() TO service_role;
GRANT EXECUTE ON FUNCTION public.respond_to_stage_acceptance(uuid, text, text) TO service_role;