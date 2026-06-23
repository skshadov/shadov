
-- ───────────────────────────────────────────────────────────────────
-- content_blocks
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE public.content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  locale text NOT NULL DEFAULT 'ru',
  title text NOT NULL DEFAULT '',
  body_md text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_blocks_status_check CHECK (status IN ('draft','published','archived')),
  CONSTRAINT content_blocks_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9\-_./]{0,150}$'),
  CONSTRAINT content_blocks_locale_format CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  CONSTRAINT content_blocks_title_len CHECK (char_length(title) <= 300),
  CONSTRAINT content_blocks_body_md_len CHECK (char_length(body_md) <= 200000),
  CONSTRAINT content_blocks_body_html_len CHECK (char_length(body_html) <= 400000)
);
CREATE UNIQUE INDEX content_blocks_slug_locale_key ON public.content_blocks (slug, locale);
CREATE INDEX content_blocks_status_idx ON public.content_blocks (status);

GRANT SELECT ON public.content_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_blocks TO authenticated;
GRANT ALL ON public.content_blocks TO service_role;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_blocks_read_public_published"
  ON public.content_blocks FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "content_blocks_read_admin"
  ON public.content_blocks FOR SELECT TO authenticated
  USING (public.has_admin_permission('admin.content.read'));

CREATE POLICY "content_blocks_write_admin"
  ON public.content_blocks FOR ALL TO authenticated
  USING (public.has_admin_permission('admin.content.write'))
  WITH CHECK (public.has_admin_permission('admin.content.write'));

CREATE TRIGGER content_blocks_set_updated_at
  BEFORE UPDATE ON public.content_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ───────────────────────────────────────────────────────────────────
-- media_assets
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  width integer,
  height integer,
  alt_text text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_assets_size_pos CHECK (size_bytes > 0 AND size_bytes <= 25 * 1024 * 1024),
  CONSTRAINT media_assets_mime_check CHECK (
    mime_type IN (
      'image/jpeg','image/png','image/webp','image/avif','image/gif','image/svg+xml',
      'video/mp4','video/webm',
      'application/pdf'
    )
  ),
  CONSTRAINT media_assets_alt_len CHECK (char_length(alt_text) <= 500),
  CONSTRAINT media_assets_title_len CHECK (char_length(title) <= 300),
  CONSTRAINT media_assets_storage_path_prefix CHECK (storage_path LIKE 'site-media/%')
);
CREATE INDEX media_assets_created_at_idx ON public.media_assets (created_at DESC);

GRANT SELECT ON public.media_assets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_assets_read_public"
  ON public.media_assets FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "media_assets_write_admin"
  ON public.media_assets FOR INSERT TO authenticated
  WITH CHECK (public.has_admin_permission('admin.media.write'));

CREATE POLICY "media_assets_update_admin"
  ON public.media_assets FOR UPDATE TO authenticated
  USING (public.has_admin_permission('admin.media.write'))
  WITH CHECK (public.has_admin_permission('admin.media.write'));

CREATE POLICY "media_assets_delete_admin"
  ON public.media_assets FOR DELETE TO authenticated
  USING (public.has_admin_permission('admin.media.delete'));

CREATE TRIGGER media_assets_set_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ───────────────────────────────────────────────────────────────────
-- Storage policies for the private site-media bucket
-- ───────────────────────────────────────────────────────────────────
CREATE POLICY "site_media_admin_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'site-media' AND public.has_admin_permission('admin.media.read'));

CREATE POLICY "site_media_admin_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-media' AND public.has_admin_permission('admin.media.write'));

CREATE POLICY "site_media_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-media' AND public.has_admin_permission('admin.media.write'))
  WITH CHECK (bucket_id = 'site-media' AND public.has_admin_permission('admin.media.write'));

CREATE POLICY "site_media_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-media' AND public.has_admin_permission('admin.media.delete'));

-- ───────────────────────────────────────────────────────────────────
-- Permissions & role grants
-- ───────────────────────────────────────────────────────────────────
INSERT INTO public.admin_permissions (key, section, description) VALUES
  ('admin.content.read',  'content', 'Просмотр контентных блоков сайта (в т.ч. черновиков)'),
  ('admin.content.write', 'content', 'Создание и редактирование контентных блоков'),
  ('admin.media.read',    'media',   'Просмотр медиатеки'),
  ('admin.media.write',   'media',   'Загрузка и редактирование медиафайлов'),
  ('admin.media.delete',  'media',   'Удаление медиафайлов и записей')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_role_permissions (role, permission_key) VALUES
  ('super_admin',     'admin.content.read'),
  ('super_admin',     'admin.content.write'),
  ('super_admin',     'admin.media.read'),
  ('super_admin',     'admin.media.write'),
  ('super_admin',     'admin.media.delete'),
  ('admin',           'admin.content.read'),
  ('admin',           'admin.content.write'),
  ('admin',           'admin.media.read'),
  ('admin',           'admin.media.write'),
  ('admin',           'admin.media.delete'),
  ('content_manager', 'admin.content.read'),
  ('content_manager', 'admin.content.write'),
  ('content_manager', 'admin.media.read'),
  ('content_manager', 'admin.media.write')
ON CONFLICT DO NOTHING;
