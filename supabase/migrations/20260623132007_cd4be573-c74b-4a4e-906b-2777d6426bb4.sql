
-- ───────────────────────────────────────────────────────────────────
-- service_categories
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  hero_media_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_categories_status_check CHECK (status IN ('draft','published','archived')),
  CONSTRAINT service_categories_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9\-]{0,80}$'),
  CONSTRAINT service_categories_title_len CHECK (char_length(title) BETWEEN 1 AND 200),
  CONSTRAINT service_categories_summary_len CHECK (char_length(summary) <= 2000),
  CONSTRAINT service_categories_seo_title_len CHECK (char_length(seo_title) <= 200),
  CONSTRAINT service_categories_seo_desc_len CHECK (char_length(seo_description) <= 400)
);
CREATE INDEX service_categories_parent_idx ON public.service_categories (parent_id);
CREATE INDEX service_categories_status_idx ON public.service_categories (status);

GRANT SELECT ON public.service_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;
GRANT ALL ON public.service_categories TO service_role;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_categories_read_public"
  ON public.service_categories FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "service_categories_read_admin"
  ON public.service_categories FOR SELECT TO authenticated
  USING (public.has_admin_permission('admin.catalog.read'));

CREATE POLICY "service_categories_write_admin"
  ON public.service_categories FOR ALL TO authenticated
  USING (public.has_admin_permission('admin.catalog.write'))
  WITH CHECK (public.has_admin_permission('admin.catalog.write'));

CREATE TRIGGER service_categories_set_updated_at
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ───────────────────────────────────────────────────────────────────
-- services
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  body_md text NOT NULL DEFAULT '',
  base_price numeric(12,2),
  price_unit text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'RUB',
  status text NOT NULL DEFAULT 'draft',
  sort_order integer NOT NULL DEFAULT 0,
  hero_media_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT services_status_check CHECK (status IN ('draft','published','archived')),
  CONSTRAINT services_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9\-]{0,120}$'),
  CONSTRAINT services_title_len CHECK (char_length(title) BETWEEN 1 AND 300),
  CONSTRAINT services_summary_len CHECK (char_length(summary) <= 2000),
  CONSTRAINT services_body_len CHECK (char_length(body_md) <= 200000),
  CONSTRAINT services_unit_len CHECK (char_length(price_unit) <= 60),
  CONSTRAINT services_currency_format CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT services_base_price_nonneg CHECK (base_price IS NULL OR base_price >= 0),
  CONSTRAINT services_seo_title_len CHECK (char_length(seo_title) <= 200),
  CONSTRAINT services_seo_desc_len CHECK (char_length(seo_description) <= 400)
);
CREATE INDEX services_category_idx ON public.services (category_id);
CREATE INDEX services_status_idx ON public.services (status);

GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_read_public"
  ON public.services FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "services_read_admin"
  ON public.services FOR SELECT TO authenticated
  USING (public.has_admin_permission('admin.catalog.read'));

CREATE POLICY "services_write_admin"
  ON public.services FOR ALL TO authenticated
  USING (public.has_admin_permission('admin.catalog.write'))
  WITH CHECK (public.has_admin_permission('admin.catalog.write'));

CREATE TRIGGER services_set_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ───────────────────────────────────────────────────────────────────
-- price_items
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE public.price_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_slug text NOT NULL,
  subgroup_slug text NOT NULL DEFAULT '',
  title text NOT NULL,
  unit text NOT NULL DEFAULT '',
  price_min numeric(12,2),
  price_max numeric(12,2),
  currency text NOT NULL DEFAULT 'RUB',
  status text NOT NULL DEFAULT 'draft',
  sort_order integer NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT price_items_status_check CHECK (status IN ('draft','published','archived')),
  CONSTRAINT price_items_group_format CHECK (group_slug ~ '^[a-z0-9][a-z0-9\-_]{0,80}$'),
  CONSTRAINT price_items_subgroup_format CHECK (subgroup_slug = '' OR subgroup_slug ~ '^[a-z0-9][a-z0-9\-_]{0,80}$'),
  CONSTRAINT price_items_title_len CHECK (char_length(title) BETWEEN 1 AND 300),
  CONSTRAINT price_items_unit_len CHECK (char_length(unit) <= 60),
  CONSTRAINT price_items_currency_format CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT price_items_notes_len CHECK (char_length(notes) <= 2000),
  CONSTRAINT price_items_prices_nonneg CHECK (
    (price_min IS NULL OR price_min >= 0) AND
    (price_max IS NULL OR price_max >= 0) AND
    (price_min IS NULL OR price_max IS NULL OR price_max >= price_min)
  )
);
CREATE INDEX price_items_group_idx ON public.price_items (group_slug, subgroup_slug, sort_order);
CREATE INDEX price_items_status_idx ON public.price_items (status);

GRANT SELECT ON public.price_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_items TO authenticated;
GRANT ALL ON public.price_items TO service_role;
ALTER TABLE public.price_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_items_read_public"
  ON public.price_items FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "price_items_read_admin"
  ON public.price_items FOR SELECT TO authenticated
  USING (public.has_admin_permission('admin.catalog.read'));

CREATE POLICY "price_items_write_admin"
  ON public.price_items FOR ALL TO authenticated
  USING (public.has_admin_permission('admin.catalog.write'))
  WITH CHECK (public.has_admin_permission('admin.catalog.write'));

CREATE TRIGGER price_items_set_updated_at
  BEFORE UPDATE ON public.price_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ───────────────────────────────────────────────────────────────────
-- Permissions & role grants
-- ───────────────────────────────────────────────────────────────────
INSERT INTO public.admin_permissions (key, section, description) VALUES
  ('admin.catalog.read',  'catalog', 'Просмотр каталога услуг, категорий и прайса (в т.ч. черновиков)'),
  ('admin.catalog.write', 'catalog', 'Редактирование услуг, категорий и прайс-листа')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_role_permissions (role, permission_key) VALUES
  ('super_admin',     'admin.catalog.read'),
  ('super_admin',     'admin.catalog.write'),
  ('admin',           'admin.catalog.read'),
  ('admin',           'admin.catalog.write'),
  ('content_manager', 'admin.catalog.read'),
  ('content_manager', 'admin.catalog.write')
ON CONFLICT DO NOTHING;
