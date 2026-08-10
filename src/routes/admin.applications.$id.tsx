import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAdminSession, hasPermission } from "@/lib/admin/use-admin-session";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getApplication, updateApplicationStatus,
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
  const [app, setApp] = useState<ApplicationDetail | null | "loading">("loading");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusDraft, setStatusDraft] = useState<ApplicationStatus | null>(null);
  const [note, setNote] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (session.status !== "authenticated") return;
    let active = true;
    getApplication({ data: { id } })
      .then((r) => { if (active) { setApp(r); setStatusDraft(r?.status ?? null); setAdminNote(r?.admin_note ?? ""); } })
      .catch((e: unknown) => { if (active) { setApp(null); setError(e instanceof Error ? e.message : "Ошибка"); } });
    return () => { active = false; };
  }, [session.status, id]);

  if (session.status !== "authenticated") return null;
  if (!hasPermission(session, "admin.applications.read")) {
    return <AdminLayout admin={session.admin} title="Заявка" breadcrumbs={[{ label: "Админ-панель", to: "/admin" }, { label: "Заявки", to: "/admin/applications" }, { label: id }]}><p>Нет доступа.</p></AdminLayout>;
  }

  const canWrite = hasPermission(session, "admin.applications.write");

  async function onSave() {
    if (!statusDraft || app === "loading" || !app) return;
    setSaving(true); setError(null); setSavedMsg(null);
    try {
      await updateApplicationStatus({ data: { id, status: statusDraft, note: note || undefined, adminNote } });
      const fresh = await getApplication({ data: { id } });
      setApp(fresh); setNote(""); setAdminNote(fresh?.admin_note ?? ""); setSavedMsg("Сохранено");
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setSaving(false); }
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

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Описание / комментарий менеджера</h3>
              <Textarea
                className="mt-2 min-h-32"
                placeholder="Опишите договорённости, детали объекта, итоги звонка…"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value.slice(0, 4000))}
                disabled={!canWrite || saving}
              />
              <p className="mt-1 text-xs text-muted-foreground">{adminNote.length}/4000</p>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Статус и сохранение</h3>
              <select
                className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                value={statusDraft ?? app.status}
                onChange={(e) => setStatusDraft(e.target.value as ApplicationStatus)}
                disabled={!canWrite || saving}
              >
                {STATUS_OPTS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
              <Textarea
                className="mt-2" placeholder="Причина изменения (в журнал, до 500 символов)"
                value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))}
                disabled={!canWrite || saving}
              />
              <Button className="mt-3 w-full" disabled={!canWrite || saving} onClick={onSave}>
                {saving ? "Сохранение…" : "Сохранить"}
              </Button>
              {savedMsg ? <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{savedMsg}</p> : null}
              {!canWrite ? <p className="mt-2 text-xs text-muted-foreground">Требуется право admin.applications.write</p> : null}
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