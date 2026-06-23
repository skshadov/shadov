CREATE TABLE public.portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  location text,
  summary text NOT NULL,
  description text,
  area_m2 numeric,
  duration_months integer,
  year_completed integer,
  cover_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.portfolio_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_projects TO authenticated;
GRANT ALL ON public.portfolio_projects TO service_role;
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portfolio_projects_public_read" ON public.portfolio_projects FOR SELECT USING (is_published = true);
CREATE POLICY "portfolio_projects_admin_read" ON public.portfolio_projects FOR SELECT TO authenticated USING (public.has_admin_permission('portfolio.manage'));
CREATE POLICY "portfolio_projects_admin_write" ON public.portfolio_projects FOR ALL TO authenticated USING (public.has_admin_permission('portfolio.manage')) WITH CHECK (public.has_admin_permission('portfolio.manage'));
CREATE TRIGGER trg_portfolio_projects_updated_at BEFORE UPDATE ON public.portfolio_projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_portfolio_projects_published ON public.portfolio_projects (is_published, sort_order DESC, published_at DESC);

CREATE TABLE public.portfolio_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_role text,
  project_id uuid REFERENCES public.portfolio_projects(id) ON DELETE SET NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL,
  source text,
  source_url text,
  verified_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.portfolio_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_reviews TO authenticated;
GRANT ALL ON public.portfolio_reviews TO service_role;
ALTER TABLE public.portfolio_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portfolio_reviews_public_read" ON public.portfolio_reviews FOR SELECT USING (is_published = true);
CREATE POLICY "portfolio_reviews_admin_read" ON public.portfolio_reviews FOR SELECT TO authenticated USING (public.has_admin_permission('reviews.manage'));
CREATE POLICY "portfolio_reviews_admin_write" ON public.portfolio_reviews FOR ALL TO authenticated USING (public.has_admin_permission('reviews.manage')) WITH CHECK (public.has_admin_permission('reviews.manage'));
CREATE TRIGGER trg_portfolio_reviews_updated_at BEFORE UPDATE ON public.portfolio_reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_portfolio_reviews_published ON public.portfolio_reviews (is_published, sort_order DESC, published_at DESC);

INSERT INTO public.admin_permissions (key, section, description)
VALUES
  ('portfolio.manage', 'content', 'Создание, редактирование и публикация объектов в разделе «Наши работы»'),
  ('reviews.manage', 'content', 'Модерация и публикация отзывов заказчиков')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_role_permissions (role, permission_key)
SELECT r::public.app_role, p
FROM (VALUES ('super_admin'), ('admin'), ('content_manager')) AS roles(r),
     (VALUES ('portfolio.manage'), ('reviews.manage')) AS perms(p)
ON CONFLICT DO NOTHING;