
-- Singleton table for company / operator settings
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true,
  legal_name text NOT NULL DEFAULT '',
  brand_name text NOT NULL DEFAULT '',
  brand_full text NOT NULL DEFAULT '',
  domain text NOT NULL DEFAULT '',
  inn text NOT NULL DEFAULT '',
  kpp text NOT NULL DEFAULT '',
  ogrn text NOT NULL DEFAULT '',
  legal_address text NOT NULL DEFAULT '',
  office_address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  phone_e164 text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  telegram text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  working_hours text NOT NULL DEFAULT '',
  sro_name text NOT NULL DEFAULT '',
  sro_number text NOT NULL DEFAULT '',
  sro_registry_url text NOT NULL DEFAULT '',
  years_on_market text NOT NULL DEFAULT '',
  staff_count text NOT NULL DEFAULT '',
  projects_count text NOT NULL DEFAULT '',
  warranty_years text NOT NULL DEFAULT '',
  bank_name text NOT NULL DEFAULT '',
  bank_bik text NOT NULL DEFAULT '',
  bank_account text NOT NULL DEFAULT '',
  bank_corr_account text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enforce exactly one row
CREATE UNIQUE INDEX company_settings_singleton_idx ON public.company_settings ((singleton));
ALTER TABLE public.company_settings ADD CONSTRAINT company_settings_singleton_true CHECK (singleton = true);

-- Length sanity
ALTER TABLE public.company_settings
  ADD CONSTRAINT company_settings_legal_name_len CHECK (char_length(legal_name) <= 300),
  ADD CONSTRAINT company_settings_brand_name_len CHECK (char_length(brand_name) <= 200),
  ADD CONSTRAINT company_settings_email_len CHECK (char_length(email) <= 200),
  ADD CONSTRAINT company_settings_phone_len CHECK (char_length(phone) <= 60),
  ADD CONSTRAINT company_settings_phone_e164_format CHECK (phone_e164 = '' OR phone_e164 ~ '^\+[1-9][0-9]{6,18}$'),
  ADD CONSTRAINT company_settings_inn_format CHECK (inn = '' OR inn ~ '^[0-9]{10}([0-9]{2})?$'),
  ADD CONSTRAINT company_settings_ogrn_format CHECK (ogrn = '' OR ogrn ~ '^[0-9]{13}([0-9]{2})?$'),
  ADD CONSTRAINT company_settings_kpp_format CHECK (kpp = '' OR kpp ~ '^[0-9]{9}$'),
  ADD CONSTRAINT company_settings_sro_registry_url_format CHECK (sro_registry_url = '' OR sro_registry_url ~ '^https?://');

GRANT SELECT ON public.company_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.company_settings TO authenticated;
GRANT ALL ON public.company_settings TO service_role;

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Public read only when published
CREATE POLICY "company_settings_read_public_published"
  ON public.company_settings FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- Admins with settings.read can always read (including drafts)
CREATE POLICY "company_settings_read_admin"
  ON public.company_settings FOR SELECT
  TO authenticated
  USING (public.has_admin_permission('admin.settings.read'));

-- Only admins with settings.write can modify
CREATE POLICY "company_settings_write_admin"
  ON public.company_settings FOR ALL
  TO authenticated
  USING (public.has_admin_permission('admin.settings.write'))
  WITH CHECK (public.has_admin_permission('admin.settings.write'));

-- updated_at trigger reuse existing helper
CREATE TRIGGER company_settings_set_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed singleton row (empty placeholders, unpublished)
INSERT INTO public.company_settings (brand_name, brand_full, domain)
VALUES ('Шадов и партнёры', 'Строительная компания «Шадов и партнёры»', 'shadov.pro');

-- Permissions
INSERT INTO public.admin_permissions (key, section, description) VALUES
  ('admin.settings.read',  'settings', 'Просмотр настроек оператора и реквизитов компании'),
  ('admin.settings.write', 'settings', 'Изменение настроек оператора и реквизитов компании')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_role_permissions (role, permission_key) VALUES
  ('super_admin', 'admin.settings.read'),
  ('super_admin', 'admin.settings.write'),
  ('admin',       'admin.settings.read'),
  ('admin',       'admin.settings.write')
ON CONFLICT DO NOTHING;
