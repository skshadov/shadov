import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAdminSession, hasPermission } from "@/lib/admin/use-admin-session";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getApplication, updateApplicationStatus, convertApplicationToProject,
  type ApplicationDetail, type ApplicationStatus,
} from "@/lib/admin/applications.functions";
import { StatusBadge } from "./admin.applications";

export const Route = createFileRoute("/admin/applications/$id")({
  head: () => ({ meta: [{ title: "Заявка — Админ-панель" }, { name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  component: ApplicationDetailPage,
});

const STATUS_OPTS: ApplicationStatus[] = ["new", "in_review", "contacted", "quoted", "closed", "spam"];
const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: "Новая", in_review: "В работе", contacted: "Связались", quoted: "Просчитано", closed: "Закрыто", spam: "Спам",
};

function ApplicationDetailPage() {
  const { id } = Route.useParams();
  const session = useAdminSession();
  const navigate = useNavigate();
  const [app, setApp] = useState<ApplicationDetail | null | "loading">("loading");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusDraft, setStatusDraft] = useState<ApplicationStatus | null>(null);
  const [note, setNote] = useState("");
  const [convertOpen, setConvertOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");

  useEffect(() => {
    if (session.status !== "authenticated") return;
    let active = true;
    getApplication({ data: { id } })
      .then((r) => { if (active) { setApp(r); setStatusDraft(r?.status ?? null); setProjectTitle(r ? `Проект по заявке ${r.request_number}` : ""); } })
      .catch((e: unknown) => { if (active) { setApp(null); setError(e instanceof Error ? e.message : "Ошибка"); } });
    return () => { active = false; };
  }, [session.status, id]);

  if (session.status !== "authenticated") return null;
  if (!hasPermission(session, "admin.applications.read")) {
    return <AdminLayout admin={session.admin} title="Заявка" breadcrumbs={[{ label: "Админ-панель", to: "/admin" }, { label: "Заявки", to: "/admin/applications" }, { label: id }]}><p>Нет доступа.</p></AdminLayout>;
  }

  const canWrite = hasPermission(session, "admin.applications.write");
  const canConvert = canWrite && hasPermission(session, "admin.projects.write");

  async function onSaveStatus() {
    if (!statusDraft || app === "loading" || !app) return;
    setSaving(true); setError(null);
    try {
      await updateApplicationStatus({ data: { id, status: statusDraft, note: note || undefined } });
      const fresh = await getApplication({ data: { id } });
      setApp(fresh); setNote("");
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setSaving(false); }
  }

  async function onConvert() {
    setSaving(true); setError(null);
    try {
      const r = await convertApplicationToProject({ data: { id, title: projectTitle, description: projectDesc || undefined } });
      navigate({ to: "/admin/projects" as never, search: { highlight: r.projectId } as never });
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); setSaving(false); }
  }

  const breadcrumbs = [
    { label: "Админ-панель", to: "/admin" },
    { label: "Заявки", to: "/admin/applications" },
    { label: app && app !== "loading" ? app.request_number : id },
  ];

  return (
    <AdminLayout admin={session.admin} title="Заявка" breadcrumbs={breadcrumbs}>
      {error ? <div role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}
      {app === "loading" ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : !app ? (
        <p className="text-sm text-muted-foreground">Заявка не найдена.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">{app.contact_name}</h2>
                  <p className="text-xs font-mono text-muted-foreground">{app.request_number}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                <Item label="Телефон" value={app.phone} />
                <Item label="Email" value={app.email} />
                <Item label="Услуга" value={app.service_slug} />
                <Item label="Режим калькулятора" value={app.calculator_mode} />
                <Item label="Источник" value={app.source_path} />
                <Item label="Версия цен" value={app.price_version} />
                <Item label="Согласие" value={`v${app.consent_version} · ${new Date(app.consent_accepted_at).toLocaleString("ru-RU")}`} />
                <Item label="Создана" value={new Date(app.created_at).toLocaleString("ru-RU")} />
              </dl>
            </div>

            {app.message ? (
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold">Сообщение клиента</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm">{app.message}</p>
              </div>
            ) : null}

            {app.calculator_snapshot ? (
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold">Снимок калькулятора</h3>
                <pre className="mt-2 max-h-72 overflow-auto rounded bg-muted/50 p-3 text-xs">
                  {JSON.stringify(app.calculator_snapshot, null, 2)}
                </pre>
              </div>
            ) : null}
          </section>

          <aside className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Смена статуса</h3>
              <select
                className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                value={statusDraft ?? app.status}
                onChange={(e) => setStatusDraft(e.target.value as ApplicationStatus)}
                disabled={!canWrite || saving}
              >
                {STATUS_OPTS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
              <Textarea
                className="mt-2" placeholder="Комментарий (необязательно, до 500 символов)"
                value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))}
                disabled={!canWrite || saving}
              />
              <Button className="mt-3 w-full" disabled={!canWrite || saving || statusDraft === app.status} onClick={onSaveStatus}>
                {saving ? "Сохранение…" : "Сохранить статус"}
              </Button>
              {!canWrite ? <p className="mt-2 text-xs text-muted-foreground">Требуется право admin.applications.write</p> : null}
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Конвертация в проект</h3>
              {!canConvert ? (
                <p className="mt-2 text-xs text-muted-foreground">Нужны права admin.applications.write и admin.projects.write.</p>
              ) : !convertOpen ? (
                <Button className="mt-2 w-full" variant="outline" onClick={() => setConvertOpen(true)}>Создать проект</Button>
              ) : (
                <div className="mt-2 space-y-2">
                  <Input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Название проекта" />
                  <Textarea value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} placeholder="Описание (необязательно)" />
                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={saving || projectTitle.trim().length < 3} onClick={onConvert}>
                      {saving ? "Создание…" : "Создать"}
                    </Button>
                    <Button variant="outline" onClick={() => setConvertOpen(false)}>Отмена</Button>
                  </div>
                  {app.user_id ? (
                    <p className="text-xs text-muted-foreground">Клиент будет автоматически добавлен в проект.</p>
                  ) : (
                    <p className="text-xs text-amber-700 dark:text-amber-300">У заявки нет привязанного пользователя — клиента добавите вручную.</p>
                  )}
                </div>
              )}
            </div>

            {app.user_id ? (
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/clients/$id" params={{ id: app.user_id }}>Открыть карточку клиента</Link>
              </Button>
            ) : null}
          </aside>
        </div>
      )}
    </AdminLayout>
  );
}

function Item({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words">{value || "—"}</dd>
    </div>
  );
}