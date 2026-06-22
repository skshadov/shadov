
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS document_date date,
  ADD COLUMN IF NOT EXISTS is_visible_to_client boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.project_daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  report_date date NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  work_completed text[] NOT NULL DEFAULT '{}',
  next_steps text[] NOT NULL DEFAULT '{}',
  issues text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pdr_title_len CHECK (length(title) BETWEEN 1 AND 200),
  CONSTRAINT pdr_summary_len CHECK (length(summary) BETWEEN 1 AND 5000),
  CONSTRAINT pdr_unique UNIQUE (project_id, report_date, title)
);
GRANT SELECT ON public.project_daily_reports TO authenticated;
GRANT ALL ON public.project_daily_reports TO service_role;
ALTER TABLE public.project_daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pdr_client_select" ON public.project_daily_reports FOR SELECT TO authenticated
USING (published_at IS NOT NULL AND public.is_project_member(project_id, auth.uid()));
CREATE POLICY "pdr_admin_all" ON public.project_daily_reports FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger: enforce per-item length on text[] columns (replaces CHECK subqueries)
CREATE OR REPLACE FUNCTION public.check_pdr_array_items()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE x text;
BEGIN
  FOREACH x IN ARRAY NEW.work_completed LOOP
    IF length(x) > 1000 THEN RAISE EXCEPTION 'work_completed item too long'; END IF;
  END LOOP;
  FOREACH x IN ARRAY NEW.next_steps LOOP
    IF length(x) > 1000 THEN RAISE EXCEPTION 'next_steps item too long'; END IF;
  END LOOP;
  FOREACH x IN ARRAY NEW.issues LOOP
    IF length(x) > 1000 THEN RAISE EXCEPTION 'issues item too long'; END IF;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER pdr_check_array_items BEFORE INSERT OR UPDATE ON public.project_daily_reports
FOR EACH ROW EXECUTE FUNCTION public.check_pdr_array_items();

CREATE TABLE IF NOT EXISTS public.project_daily_report_documents (
  report_id uuid NOT NULL REFERENCES public.project_daily_reports(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.project_documents(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (report_id, document_id)
);
GRANT SELECT ON public.project_daily_report_documents TO authenticated;
GRANT ALL ON public.project_daily_report_documents TO service_role;
ALTER TABLE public.project_daily_report_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pdrd_client_select" ON public.project_daily_report_documents FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.project_daily_reports r
  WHERE r.id = report_id AND r.published_at IS NOT NULL AND public.is_project_member(r.project_id, auth.uid())
));
CREATE POLICY "pdrd_admin_all" ON public.project_daily_report_documents FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.check_daily_report_document_project()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r_pid uuid; d_pid uuid;
BEGIN
  SELECT project_id INTO r_pid FROM public.project_daily_reports WHERE id = NEW.report_id;
  SELECT project_id INTO d_pid FROM public.project_documents WHERE id = NEW.document_id;
  IF r_pid IS NULL OR d_pid IS NULL OR r_pid <> d_pid THEN
    RAISE EXCEPTION 'report and document must belong to the same project';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER pdrd_check_same_project BEFORE INSERT OR UPDATE ON public.project_daily_report_documents
FOR EACH ROW EXECUTE FUNCTION public.check_daily_report_document_project();

CREATE TABLE IF NOT EXISTS public.project_cameras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'not_configured',
  sort_order integer NOT NULL DEFAULT 0,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pc_name_len CHECK (length(name) BETWEEN 1 AND 200),
  CONSTRAINT pc_status_chk CHECK (status IN ('not_configured','online','offline','maintenance'))
);
GRANT SELECT ON public.project_cameras TO authenticated;
GRANT ALL ON public.project_cameras TO service_role;
ALTER TABLE public.project_cameras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pc_client_select" ON public.project_cameras FOR SELECT TO authenticated
USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "pc_admin_all" ON public.project_cameras FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.project_camera_sources (
  camera_id uuid PRIMARY KEY REFERENCES public.project_cameras(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_camera_id text NOT NULL,
  configuration_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pcs_provider_len CHECK (length(provider) BETWEEN 1 AND 100),
  CONSTRAINT pcs_provider_camera_id_len CHECK (length(provider_camera_id) BETWEEN 1 AND 200),
  CONSTRAINT pcs_config_ref_safe CHECK (
    configuration_reference IS NULL OR (
      length(configuration_reference) <= 200
      AND configuration_reference !~* '(rtsp|rtmp|://|password|secret|token|@)'
    )
  )
);
GRANT ALL ON public.project_camera_sources TO service_role;
ALTER TABLE public.project_camera_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pcs_admin_all" ON public.project_camera_sources FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.project_stage_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  responded_at timestamptz,
  responded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  client_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT psa_attempt_pos CHECK (attempt_number > 0),
  CONSTRAINT psa_status_chk CHECK (status IN ('pending','accepted','changes_requested','cancelled')),
  CONSTRAINT psa_comment_len CHECK (client_comment IS NULL OR length(client_comment) <= 4000),
  CONSTRAINT psa_unique_attempt UNIQUE (stage_id, attempt_number)
);
GRANT SELECT ON public.project_stage_acceptances TO authenticated;
GRANT ALL ON public.project_stage_acceptances TO service_role;
ALTER TABLE public.project_stage_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psa_client_select" ON public.project_stage_acceptances FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.project_stages s
  WHERE s.id = stage_id AND public.is_project_member(s.project_id, auth.uid())
));
CREATE POLICY "psa_admin_all" ON public.project_stage_acceptances FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.project_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message_type text NOT NULL DEFAULT 'user',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pm_body_len CHECK (length(body) BETWEEN 1 AND 4000),
  CONSTRAINT pm_type_chk CHECK (message_type IN ('user','system'))
);
GRANT SELECT, INSERT ON public.project_messages TO authenticated;
GRANT ALL ON public.project_messages TO service_role;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_client_select" ON public.project_messages FOR SELECT TO authenticated
USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "pm_client_insert" ON public.project_messages FOR INSERT TO authenticated
WITH CHECK (
  message_type = 'user' AND sender_id = auth.uid()
  AND public.is_project_member(project_id, auth.uid())
);
CREATE POLICY "pm_admin_all" ON public.project_messages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.project_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.project_stages(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  amount numeric(14,2),
  currency text NOT NULL DEFAULT 'RUB',
  status text NOT NULL DEFAULT 'planned',
  due_date date,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pp_title_len CHECK (length(title) BETWEEN 1 AND 200),
  CONSTRAINT pp_amount_nonneg CHECK (amount IS NULL OR amount >= 0),
  CONSTRAINT pp_currency_chk CHECK (currency = 'RUB'),
  CONSTRAINT pp_status_chk CHECK (status IN ('planned','invoiced','paid','cancelled'))
);
GRANT SELECT ON public.project_payments TO authenticated;
GRANT ALL ON public.project_payments TO service_role;
ALTER TABLE public.project_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pp_client_select" ON public.project_payments FOR SELECT TO authenticated
USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "pp_admin_all" ON public.project_payments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER pdr_set_updated_at BEFORE UPDATE ON public.project_daily_reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER pc_set_updated_at BEFORE UPDATE ON public.project_cameras FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER pcs_set_updated_at BEFORE UPDATE ON public.project_camera_sources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER psa_set_updated_at BEFORE UPDATE ON public.project_stage_acceptances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER pp_set_updated_at BEFORE UPDATE ON public.project_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_pdr_project_date ON public.project_daily_reports(project_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_pdr_project_published ON public.project_daily_reports(project_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_pdrd_report_sort ON public.project_daily_report_documents(report_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_pc_project_sort ON public.project_cameras(project_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_psa_stage_attempt ON public.project_stage_acceptances(stage_id, attempt_number DESC);
CREATE INDEX IF NOT EXISTS idx_psa_status_requested ON public.project_stage_acceptances(status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_pm_project_created ON public.project_messages(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pp_project_created ON public.project_payments(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pp_project_status_due ON public.project_payments(project_id, status, due_date);

CREATE OR REPLACE FUNCTION public.respond_to_stage_acceptance(
  acceptance_id uuid, decision text, comment text
) RETURNS TABLE(acceptance_id_out uuid, stage_id_out uuid, status_out text, stage_status_out text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_stage_id uuid; v_project_id uuid; v_current_status text; v_new_stage_status text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF decision NOT IN ('accepted','changes_requested') THEN RAISE EXCEPTION 'invalid_decision'; END IF;
  IF decision = 'changes_requested' AND (comment IS NULL OR length(trim(comment)) < 10) THEN
    RAISE EXCEPTION 'comment_required'; END IF;
  IF comment IS NOT NULL AND length(comment) > 4000 THEN RAISE EXCEPTION 'comment_too_long'; END IF;

  SELECT a.stage_id, a.status, s.project_id
    INTO v_stage_id, v_current_status, v_project_id
  FROM public.project_stage_acceptances a
  JOIN public.project_stages s ON s.id = a.stage_id
  WHERE a.id = acceptance_id FOR UPDATE;

  IF v_stage_id IS NULL THEN RAISE EXCEPTION 'not_found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.project_members WHERE project_id = v_project_id AND user_id = v_uid) THEN
    RAISE EXCEPTION 'forbidden'; END IF;
  IF v_current_status <> 'pending' THEN RAISE EXCEPTION 'already_resolved'; END IF;

  UPDATE public.project_stage_acceptances
  SET status = decision, responded_at = now(), responded_by = v_uid,
      client_comment = comment, updated_at = now()
  WHERE id = acceptance_id;

  v_new_stage_status := CASE WHEN decision = 'accepted' THEN 'accepted' ELSE 'in_progress' END;
  UPDATE public.project_stages SET status = v_new_stage_status, updated_at = now() WHERE id = v_stage_id;

  RETURN QUERY SELECT acceptance_id, v_stage_id, decision, v_new_stage_status;
END $$;
REVOKE ALL ON FUNCTION public.respond_to_stage_acceptance(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_stage_acceptance(uuid, text, text) TO authenticated;

ALTER TABLE public.project_messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='project_messages') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages';
  END IF;
END $$;

DO $$
DECLARE
  v_pid uuid; v_stage_ids uuid[];
BEGIN
  SELECT id INTO v_pid FROM public.projects WHERE is_demo = true AND title = 'DEMO — строительство частного дома' LIMIT 1;
  IF v_pid IS NULL THEN
    INSERT INTO public.projects (title, status, description, is_demo) VALUES (
      'DEMO — строительство частного дома', 'active',
      'DEMO. Демонстрационный проект для проверки личного кабинета. Не является реальным объектом и не относится к портфолио компании. Все данные условные.',
      true
    ) RETURNING id INTO v_pid;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.project_stages WHERE project_id = v_pid) THEN
    INSERT INTO public.project_stages (project_id, sort_order, title, description, status, planned_start, planned_end, actual_start, actual_end) VALUES
      (v_pid, 1, 'DEMO. Подготовка проекта', 'Демонстрация: проектная документация.', 'completed', '2026-01-10', '2026-01-25', '2026-01-10', '2026-01-24'),
      (v_pid, 2, 'DEMO. Подготовка площадки', 'Демонстрация: расчистка и геодезия.', 'accepted', '2026-01-26', '2026-02-10', '2026-01-26', '2026-02-09'),
      (v_pid, 3, 'DEMO. Фундамент', 'Демонстрация: устройство фундамента.', 'waiting_acceptance', '2026-02-11', '2026-03-15', '2026-02-12', '2026-03-14'),
      (v_pid, 4, 'DEMO. Несущие конструкции', 'Демонстрация: стены и перекрытия.', 'in_progress', '2026-03-16', '2026-05-20', '2026-03-18', NULL),
      (v_pid, 5, 'DEMO. Кровля и закрытие контура', 'Демонстрация: кровля и окна.', 'planned', '2026-05-21', '2026-07-10', NULL, NULL),
      (v_pid, 6, 'DEMO. Инженерные системы', 'Демонстрация: инженерия.', 'planned', '2026-07-11', '2026-09-10', NULL, NULL),
      (v_pid, 7, 'DEMO. Отделка и сдача', 'Демонстрация: отделка и приёмка.', 'planned', '2026-09-11', '2026-12-01', NULL, NULL);
  END IF;

  SELECT array_agg(id ORDER BY sort_order) INTO v_stage_ids FROM public.project_stages WHERE project_id = v_pid;

  IF NOT EXISTS (SELECT 1 FROM public.project_daily_reports WHERE project_id = v_pid) THEN
    INSERT INTO public.project_daily_reports (project_id, report_date, title, summary, work_completed, next_steps, issues, published_at) VALUES
      (v_pid, '2026-02-15', 'DEMO. Армирование подушки', 'Демонстрация. Завершено армирование подушки.',
        ARRAY['Установка арматурного каркаса','Контроль защитного слоя'], ARRAY['Заливка бетонной смеси','Уход за бетоном'], ARRAY['Уточнить график подачи бетона'], '2026-02-15 18:00+00'),
      (v_pid, '2026-02-20', 'DEMO. Бетонирование плиты', 'Демонстрация. Выполнено бетонирование плиты.',
        ARRAY['Заливка','Виброуплотнение'], ARRAY['Уход за бетоном'], ARRAY[]::text[], '2026-02-20 19:30+00'),
      (v_pid, '2026-03-12', 'DEMO. Готовность к приёмке', 'Демонстрация. Этап направлен на приёмку.',
        ARRAY['Снятие опалубки','Уборка площадки'], ARRAY['Ожидание решения'], ARRAY[]::text[], '2026-03-12 17:00+00');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.project_stage_acceptances WHERE stage_id = v_stage_ids[2]) THEN
    INSERT INTO public.project_stage_acceptances (stage_id, attempt_number, status, requested_at, responded_at, client_comment)
    VALUES (v_stage_ids[2], 1, 'accepted', '2026-02-10 10:00+00', '2026-02-10 15:00+00', 'DEMO. Принято в рамках демонстрации.');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.project_stage_acceptances WHERE stage_id = v_stage_ids[3]) THEN
    INSERT INTO public.project_stage_acceptances (stage_id, attempt_number, status, requested_at)
    VALUES (v_stage_ids[3], 1, 'pending', '2026-03-15 12:00+00');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.project_messages WHERE project_id = v_pid) THEN
    INSERT INTO public.project_messages (project_id, sender_id, message_type, body, created_at) VALUES
      (v_pid, NULL, 'system', 'DEMO. Проект создан в демонстрационном режиме.', '2026-01-10 09:00+00'),
      (v_pid, NULL, 'system', 'DEMO. Этап «Подготовка площадки» принят.', '2026-02-10 15:05+00'),
      (v_pid, NULL, 'system', 'DEMO. Опубликован ежедневный отчёт от 20.02.2026.', '2026-02-20 19:35+00'),
      (v_pid, NULL, 'system', 'DEMO. Этап «Фундамент» направлен на приёмку.', '2026-03-15 12:00+00'),
      (v_pid, NULL, 'system', 'DEMO. Сообщения в кабинете носят демонстрационный характер.', '2026-03-15 12:05+00');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.project_payments WHERE project_id = v_pid) THEN
    INSERT INTO public.project_payments (project_id, stage_id, title, description, amount, status, due_date, paid_at) VALUES
      (v_pid, v_stage_ids[1], 'DEMO. Аванс по договору', 'Информационная запись.', 500000, 'paid', '2026-01-15', '2026-01-14 12:00+00'),
      (v_pid, v_stage_ids[2], 'DEMO. Этап подготовки площадки', 'Информационная запись.', 350000, 'paid', '2026-02-12', '2026-02-12 10:00+00'),
      (v_pid, v_stage_ids[3], 'DEMO. Этап фундамента', 'Информационная запись.', 1200000, 'invoiced', '2026-03-20', NULL),
      (v_pid, v_stage_ids[4], 'DEMO. Этап несущих конструкций', 'Информационная запись.', 2400000, 'planned', '2026-05-25', NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.project_cameras WHERE project_id = v_pid) THEN
    INSERT INTO public.project_cameras (project_id, name, description, status, sort_order) VALUES
      (v_pid, 'DEMO. Камера №1 — общий план', 'Демонстрационная камера. Подключение не выполнено.', 'not_configured', 1),
      (v_pid, 'DEMO. Камера №2 — стройплощадка', 'Демонстрационная камера. Подключение не выполнено.', 'not_configured', 2);
  END IF;
END $$;
