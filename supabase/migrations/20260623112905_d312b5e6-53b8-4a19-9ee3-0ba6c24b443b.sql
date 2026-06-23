
-- =====================================================================
-- 1. PERMISSIONS CATALOG
-- =====================================================================
CREATE TABLE public.admin_permissions (
  key          text PRIMARY KEY,
  section      text NOT NULL,
  description  text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_permissions TO authenticated;
GRANT ALL ON public.admin_permissions TO service_role;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 2. ROLE -> PERMISSIONS MATRIX
-- =====================================================================
CREATE TABLE public.admin_role_permissions (
  role            public.app_role NOT NULL,
  permission_key  text NOT NULL REFERENCES public.admin_permissions(key) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (role, permission_key)
);

CREATE INDEX idx_admin_role_permissions_role ON public.admin_role_permissions(role);

GRANT SELECT ON public.admin_role_permissions TO authenticated;
GRANT ALL ON public.admin_role_permissions TO service_role;
ALTER TABLE public.admin_role_permissions ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 3. ADMIN AUDIT LOG
-- =====================================================================
CREATE TABLE public.admin_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role      public.app_role,
  action          text NOT NULL,
  entity_type     text,
  entity_id       text,
  old_value       jsonb,
  new_value       jsonb,
  ip_hash         text,
  user_agent      text,
  result          text NOT NULL DEFAULT 'success' CHECK (result IN ('success','denied','error')),
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_actor ON public.admin_audit_log(actor_user_id);
CREATE INDEX idx_admin_audit_log_entity ON public.admin_audit_log(entity_type, entity_id);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log(action);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 4. SECURE HELPER FUNCTIONS
-- =====================================================================

-- Checks if the CURRENT user (auth.uid()) has a specific permission via any of their roles.
CREATE OR REPLACE FUNCTION public.has_admin_permission(_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.admin_role_permissions arp ON arp.role = ur.role
    WHERE ur.user_id = auth.uid()
      AND arp.permission_key = _permission
  );
$$;

REVOKE ALL ON FUNCTION public.has_admin_permission(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(text) TO authenticated, service_role;

-- Returns the flat list of all permission keys for the CURRENT user.
CREATE OR REPLACE FUNCTION public.get_my_admin_permissions()
RETURNS TABLE(permission_key text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT arp.permission_key
  FROM public.user_roles ur
  JOIN public.admin_role_permissions arp ON arp.role = ur.role
  WHERE ur.user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_admin_permissions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_admin_permissions() TO authenticated, service_role;

-- Returns true if the CURRENT user has any administrative role (not client).
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin','admin','project_manager','content_manager','accountant','support','viewer')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated, service_role;

-- Returns the highest-privilege role of the CURRENT user (for display).
CREATE OR REPLACE FUNCTION public.get_my_primary_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'project_manager' THEN 3
    WHEN 'content_manager' THEN 4
    WHEN 'accountant' THEN 5
    WHEN 'support' THEN 6
    WHEN 'viewer' THEN 7
    WHEN 'client' THEN 8
  END
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_primary_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_primary_role() TO authenticated, service_role;

-- =====================================================================
-- 5. RLS POLICIES
-- =====================================================================

-- admin_permissions: any administrative user can read; only super_admin can manage.
CREATE POLICY "admin_permissions_read_any_admin"
  ON public.admin_permissions FOR SELECT TO authenticated
  USING (public.is_admin_user());

CREATE POLICY "admin_permissions_write_super_admin"
  ON public.admin_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- admin_role_permissions: any admin can read; only super_admin can mutate.
CREATE POLICY "admin_role_permissions_read_any_admin"
  ON public.admin_role_permissions FOR SELECT TO authenticated
  USING (public.is_admin_user());

CREATE POLICY "admin_role_permissions_write_super_admin"
  ON public.admin_role_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- admin_audit_log: read requires admin.audit.read; no client-side writes/updates/deletes ever.
CREATE POLICY "admin_audit_log_read_with_permission"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_admin_permission('admin.audit.read'));

-- Explicit denial: no INSERT/UPDATE/DELETE policy = no access for authenticated/anon.
-- service_role bypasses RLS and is the only writer.

-- =====================================================================
-- 6. SEED PERMISSIONS CATALOG
-- =====================================================================
INSERT INTO public.admin_permissions (key, section, description) VALUES
  -- Dashboard & system
  ('admin.dashboard.read',     'dashboard',     'View admin dashboard'),
  ('admin.system.read',        'system',        'View system health and configuration status'),
  ('admin.audit.read',         'audit',         'View administrative audit log'),
  -- Applications (estimate requests)
  ('admin.applications.read',  'applications',  'View incoming applications'),
  ('admin.applications.write', 'applications',  'Edit applications, change status, convert'),
  ('admin.applications.delete','applications',  'Archive/soft-delete applications'),
  -- Clients
  ('admin.clients.read',       'clients',       'View clients list and details'),
  ('admin.clients.write',      'clients',       'Create/edit clients, invite to portal'),
  ('admin.clients.delete',     'clients',       'Block/soft-delete clients'),
  ('admin.clients.pii',        'clients',       'View personally identifiable information'),
  -- Projects
  ('admin.projects.read',      'projects',      'View projects'),
  ('admin.projects.write',     'projects',      'Create/edit projects, assign members'),
  ('admin.projects.delete',    'projects',      'Archive/soft-delete projects'),
  -- Stages
  ('admin.stages.read',        'stages',        'View project stages'),
  ('admin.stages.write',       'stages',        'Create/edit stages, change status'),
  -- Daily reports
  ('admin.reports.read',       'reports',       'View daily reports'),
  ('admin.reports.write',      'reports',       'Create/edit daily reports'),
  ('admin.reports.publish',    'reports',       'Publish reports to client'),
  -- Documents
  ('admin.documents.read',     'documents',     'View project documents'),
  ('admin.documents.write',    'documents',     'Upload/edit project documents'),
  ('admin.documents.delete',   'documents',     'Archive project documents'),
  -- Cameras
  ('admin.cameras.read',       'cameras',       'View cameras list and status'),
  ('admin.cameras.write',      'cameras',       'Enable/disable client access'),
  ('admin.cameras.configure',  'cameras',       'Configure camera sources and secrets'),
  -- Messages
  ('admin.messages.read',      'messages',      'View messages'),
  ('admin.messages.write',     'messages',      'Send admin messages'),
  -- Payments
  ('admin.payments.read',      'payments',      'View payments'),
  ('admin.payments.write',     'payments',      'Create/edit payments, mark paid'),
  ('admin.payments.delete',    'payments',      'Cancel payments'),
  -- Acceptances
  ('admin.acceptances.read',   'acceptances',   'View stage acceptance requests'),
  ('admin.acceptances.write',  'acceptances',   'Send stages to acceptance, resubmit'),
  -- Services
  ('admin.services.read',      'services',      'View services'),
  ('admin.services.write',     'services',      'Edit services as drafts'),
  ('admin.services.publish',   'services',      'Publish/unpublish services'),
  -- Prices
  ('admin.prices.read',        'prices',        'View prices'),
  ('admin.prices.write',       'prices',        'Edit prices as drafts'),
  ('admin.prices.publish',     'prices',        'Publish price changes'),
  -- Calculator
  ('admin.calculator.read',    'calculator',    'View calculator configuration'),
  ('admin.calculator.write',   'calculator',    'Edit calculator configuration'),
  ('admin.calculator.publish', 'calculator',    'Publish calculator changes'),
  -- Pages
  ('admin.pages.read',         'pages',         'View site pages'),
  ('admin.pages.write',        'pages',         'Edit pages as drafts'),
  ('admin.pages.publish',      'pages',         'Publish pages'),
  -- Portfolio
  ('admin.portfolio.read',     'portfolio',     'View portfolio'),
  ('admin.portfolio.write',    'portfolio',     'Edit portfolio items'),
  ('admin.portfolio.publish',  'portfolio',     'Publish portfolio items'),
  -- Reviews
  ('admin.reviews.read',       'reviews',       'View reviews'),
  ('admin.reviews.write',      'reviews',       'Moderate reviews'),
  ('admin.reviews.publish',    'reviews',       'Publish reviews'),
  -- FAQ
  ('admin.faq.read',           'faq',           'View FAQ'),
  ('admin.faq.write',          'faq',           'Edit FAQ entries'),
  ('admin.faq.publish',        'faq',           'Publish FAQ entries'),
  -- SEO
  ('admin.seo.read',           'seo',           'View SEO settings'),
  ('admin.seo.write',          'seo',           'Edit SEO overrides'),
  ('admin.seo.publish',        'seo',           'Publish SEO overrides'),
  -- Legal
  ('admin.legal.read',         'legal',         'View legal documents'),
  ('admin.legal.write',        'legal',         'Edit legal documents as drafts'),
  ('admin.legal.publish',      'legal',         'Publish legal documents'),
  -- Employees & roles
  ('admin.employees.read',     'employees',     'View employees list'),
  ('admin.employees.write',    'employees',     'Create/edit employees, block/unblock'),
  ('admin.employees.roles',    'employees',     'Assign roles to employees'),
  ('admin.employees.super',    'employees',     'Assign super_admin role'),
  -- Notifications
  ('admin.notifications.read', 'notifications', 'View admin notifications'),
  ('admin.notifications.write','notifications', 'Mark notifications as read'),
  -- Settings & requisites
  ('admin.settings.read',      'settings',      'View site settings'),
  ('admin.settings.write',     'settings',      'Edit site settings'),
  ('admin.requisites.read',    'settings',      'View company requisites'),
  ('admin.requisites.write',   'settings',      'Edit company requisites');

-- =====================================================================
-- 7. SEED ROLE -> PERMISSIONS MATRIX
-- =====================================================================

-- super_admin: ALL permissions
INSERT INTO public.admin_role_permissions (role, permission_key)
SELECT 'super_admin'::public.app_role, key FROM public.admin_permissions;

-- admin: ALL permissions EXCEPT admin.employees.super
INSERT INTO public.admin_role_permissions (role, permission_key)
SELECT 'admin'::public.app_role, key
FROM public.admin_permissions
WHERE key <> 'admin.employees.super';

-- project_manager: dashboard + clients (read/write, no pii/delete) + projects (read/write) + stages + reports + documents + cameras (read/write, NOT configure) + messages + acceptances + notifications + applications.read
INSERT INTO public.admin_role_permissions (role, permission_key) VALUES
  ('project_manager','admin.dashboard.read'),
  ('project_manager','admin.applications.read'),
  ('project_manager','admin.applications.write'),
  ('project_manager','admin.clients.read'),
  ('project_manager','admin.clients.write'),
  ('project_manager','admin.projects.read'),
  ('project_manager','admin.projects.write'),
  ('project_manager','admin.stages.read'),
  ('project_manager','admin.stages.write'),
  ('project_manager','admin.reports.read'),
  ('project_manager','admin.reports.write'),
  ('project_manager','admin.reports.publish'),
  ('project_manager','admin.documents.read'),
  ('project_manager','admin.documents.write'),
  ('project_manager','admin.cameras.read'),
  ('project_manager','admin.cameras.write'),
  ('project_manager','admin.messages.read'),
  ('project_manager','admin.messages.write'),
  ('project_manager','admin.acceptances.read'),
  ('project_manager','admin.acceptances.write'),
  ('project_manager','admin.notifications.read'),
  ('project_manager','admin.notifications.write');

-- content_manager: dashboard + services + prices (read/write, NOT publish without explicit grant — give publish for marketing) + calculator + pages + portfolio + reviews + faq + seo + legal (read/write, NOT publish) + notifications
INSERT INTO public.admin_role_permissions (role, permission_key) VALUES
  ('content_manager','admin.dashboard.read'),
  ('content_manager','admin.services.read'),
  ('content_manager','admin.services.write'),
  ('content_manager','admin.services.publish'),
  ('content_manager','admin.prices.read'),
  ('content_manager','admin.prices.write'),
  ('content_manager','admin.calculator.read'),
  ('content_manager','admin.calculator.write'),
  ('content_manager','admin.pages.read'),
  ('content_manager','admin.pages.write'),
  ('content_manager','admin.pages.publish'),
  ('content_manager','admin.portfolio.read'),
  ('content_manager','admin.portfolio.write'),
  ('content_manager','admin.portfolio.publish'),
  ('content_manager','admin.reviews.read'),
  ('content_manager','admin.reviews.write'),
  ('content_manager','admin.reviews.publish'),
  ('content_manager','admin.faq.read'),
  ('content_manager','admin.faq.write'),
  ('content_manager','admin.faq.publish'),
  ('content_manager','admin.seo.read'),
  ('content_manager','admin.seo.write'),
  ('content_manager','admin.seo.publish'),
  ('content_manager','admin.legal.read'),
  ('content_manager','admin.legal.write'),
  ('content_manager','admin.notifications.read');

-- accountant: dashboard + projects.read + payments.read/write (NOT delete) + reports.read + notifications
INSERT INTO public.admin_role_permissions (role, permission_key) VALUES
  ('accountant','admin.dashboard.read'),
  ('accountant','admin.projects.read'),
  ('accountant','admin.stages.read'),
  ('accountant','admin.payments.read'),
  ('accountant','admin.payments.write'),
  ('accountant','admin.reports.read'),
  ('accountant','admin.documents.read'),
  ('accountant','admin.notifications.read'),
  ('accountant','admin.requisites.read');

-- support: dashboard + applications + clients.read + projects.read + messages + notifications
INSERT INTO public.admin_role_permissions (role, permission_key) VALUES
  ('support','admin.dashboard.read'),
  ('support','admin.applications.read'),
  ('support','admin.applications.write'),
  ('support','admin.clients.read'),
  ('support','admin.projects.read'),
  ('support','admin.messages.read'),
  ('support','admin.messages.write'),
  ('support','admin.notifications.read'),
  ('support','admin.notifications.write');

-- viewer: read-only across most sections
INSERT INTO public.admin_role_permissions (role, permission_key) VALUES
  ('viewer','admin.dashboard.read'),
  ('viewer','admin.applications.read'),
  ('viewer','admin.clients.read'),
  ('viewer','admin.projects.read'),
  ('viewer','admin.stages.read'),
  ('viewer','admin.reports.read'),
  ('viewer','admin.documents.read'),
  ('viewer','admin.cameras.read'),
  ('viewer','admin.messages.read'),
  ('viewer','admin.payments.read'),
  ('viewer','admin.acceptances.read'),
  ('viewer','admin.services.read'),
  ('viewer','admin.prices.read'),
  ('viewer','admin.calculator.read'),
  ('viewer','admin.pages.read'),
  ('viewer','admin.portfolio.read'),
  ('viewer','admin.reviews.read'),
  ('viewer','admin.faq.read'),
  ('viewer','admin.seo.read'),
  ('viewer','admin.legal.read'),
  ('viewer','admin.notifications.read'),
  ('viewer','admin.settings.read'),
  ('viewer','admin.requisites.read');

-- client: NO admin permissions (intentionally empty)
