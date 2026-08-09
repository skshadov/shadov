CREATE TABLE public.site_pricing (
  slug text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
GRANT SELECT ON public.site_pricing TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_pricing TO authenticated;
GRANT ALL ON public.site_pricing TO service_role;
ALTER TABLE public.site_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_pricing public read" ON public.site_pricing FOR SELECT USING (true);
CREATE POLICY "site_pricing admin write" ON public.site_pricing FOR ALL TO authenticated
  USING (public.has_admin_permission('admin.catalog.write'))
  WITH CHECK (public.has_admin_permission('admin.catalog.write'));
CREATE TRIGGER site_pricing_set_updated_at BEFORE UPDATE ON public.site_pricing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.site_images (
  key text PRIMARY KEY,
  url text NOT NULL,
  width integer,
  height integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
GRANT SELECT ON public.site_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_images TO authenticated;
GRANT ALL ON public.site_images TO service_role;
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_images public read" ON public.site_images FOR SELECT USING (true);
CREATE POLICY "site_images admin write" ON public.site_images FOR ALL TO authenticated
  USING (public.has_admin_permission('admin.media.write'))
  WITH CHECK (public.has_admin_permission('admin.media.write'));
CREATE TRIGGER site_images_set_updated_at BEFORE UPDATE ON public.site_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();