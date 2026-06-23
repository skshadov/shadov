import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAdminSession, hasPermission } from "@/lib/admin/use-admin-session";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  listDailyReports, upsertDailyReport, deleteDailyReport,
  type DailyReportItem,
} from "@/lib/admin/documents.functions";

export const Route = createFileRoute("/admin/projects/$id/reports")({
  head: () => ({ meta: [{ title: "Ежедневные отчёты — Админ-панель" }, { name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  component: ProjectReportsPage,
});

function ProjectReportsPage() {
  const session = useAdminSession();
  const { id } = useParams({ from: "/admin/projects/$id/reports" });
  const [items, setItems] = useState<DailyReportItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<DailyReportItem> | null>(null);

  const reload = useCallback(() => {
    listDailyReports({ data: { project_id: id } })
      .then(setItems)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, [id]);
  useEffect(() => { if (session.status === "authenticated") reload(); }, [session.status, reload]);

  if (session.status !== "authenticated") return null;
  if (!hasPermission(session, "admin.reports.read")) {
    return <AdminLayout admin={session.admin} title="Отчёты" breadcrumbs={[{ label: "Админ-панель", to: "/admin" }]}><p>Нет доступа.</p></AdminLayout>;
  }
  const canWrite = hasPermission(session, "admin.reports.write");

  return (
    <AdminLayout admin={session.admin} title="Ежедневные отчёты"
      breadcrumbs={[
        { label: "Админ-панель", to: "/admin" },
        { label: "Проекты", to: "/admin/projects" },
        { label: "Проект", to: `/admin/projects/${id}` },
        { label: "Отчёты" },
      ]}>
      {error ? <div role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}

      {canWrite ? (
        <div className="mb-4">
          {editing ? (
            <ReportForm projectId={id} initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
          ) : (
            <Button size="sm" onClick={() => setEditing({ report_date: new Date().toISOString().slice(0, 10), title: "", summary: "" })}>
              Новый отчёт
            </Button>
          )}
        </div>
      ) : null}

      {items === null ? <p className="text-sm text-muted-foreground">Загрузка…</p>
        : items.length === 0 ? <p className="text-sm text-muted-foreground">Отчётов пока нет.</p>
        : (
          <ul className="space-y-3">
            {items.map((r) => (
              <li key={r.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{r.report_date}</div>
                    <div className="font-semibold">{r.title}</div>
                    <p className="mt-1 text-sm">{r.summary}</p>
                    {r.work_completed.length > 0 ? (
                      <div className="mt-2 text-xs"><span className="font-medium">Выполнено:</span> {r.work_completed.join(", ")}</div>
                    ) : null}
                    {r.next_steps.length > 0 ? (
                      <div className="text-xs"><span className="font-medium">Дальше:</span> {r.next_steps.join(", ")}</div>
                    ) : null}
                    {r.issues.length > 0 ? (
                      <div className="text-xs text-destructive"><span className="font-medium">Проблемы:</span> {r.issues.join(", ")}</div>
                    ) : null}
                    <div className="mt-2 text-xs text-muted-foreground">
                      {r.published_at ? `Опубликован ${new Date(r.published_at).toLocaleString("ru-RU")}` : "Черновик"}
                      {" · файлов: "}{r.documents_count}
                    </div>
                  </div>
                  {canWrite ? (
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="outline" onClick={() => setEditing(r)}>Изм.</Button>
                      <Button size="sm" variant="ghost" onClick={async () => {
                        if (!confirm("Удалить отчёт?")) return;
                        try { await deleteDailyReport({ data: { id: r.id } }); reload(); }
                        catch (e) { alert(e instanceof Error ? e.message : "Ошибка"); }
                      }}>×</Button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      <p className="mt-4 text-xs"><Link to="/admin/projects/$id" params={{ id }} className="underline">← К проекту</Link></p>
    </AdminLayout>
  );
}

function ReportForm({ projectId, initial, onClose, onSaved }: {
  projectId: string; initial: Partial<DailyReportItem>;
  onClose: () => void; onSaved: () => void;
}) {
  const [date, setDate] = useState(initial.report_date ?? new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState(initial.title ?? "");
  const [summary, setSummary] = useState(initial.summary ?? "");
  const [done, setDone] = useState((initial.work_completed ?? []).join("\n"));
  const [next, setNext] = useState((initial.next_steps ?? []).join("\n"));
  const [issues, setIssues] = useState((initial.issues ?? []).join("\n"));
  const [publish, setPublish] = useState(!!initial.published_at);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form className="space-y-3 rounded-lg border border-border p-4"
      onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr(null);
        try {
          await upsertDailyReport({ data: {
            id: initial.id, project_id: projectId, report_date: date,
            title, summary,
            work_completed: done.split("\n"),
            next_steps: next.split("\n"),
            issues: issues.split("\n"),
            publish,
          } });
          onSaved();
        } catch (e) { setErr(e instanceof Error ? e.message : "Ошибка"); }
        finally { setBusy(false); }
      }}>
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <div>
          <label htmlFor="d" className="mb-1 block text-xs text-muted-foreground">Дата</label>
          <Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="t" className="mb-1 block text-xs text-muted-foreground">Заголовок</label>
          <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
      </div>
      <div>
        <label htmlFor="s" className="mb-1 block text-xs text-muted-foreground">Краткое описание</label>
        <Textarea id="s" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="w" className="mb-1 block text-xs text-muted-foreground">Выполнено (по строкам)</label>
          <Textarea id="w" rows={4} value={done} onChange={(e) => setDone(e.target.value)} />
        </div>
        <div>
          <label htmlFor="n" className="mb-1 block text-xs text-muted-foreground">Дальше (по строкам)</label>
          <Textarea id="n" rows={4} value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div>
          <label htmlFor="i" className="mb-1 block text-xs text-muted-foreground">Проблемы (по строкам)</label>
          <Textarea id="i" rows={4} value={issues} onChange={(e) => setIssues(e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
        Опубликовать клиенту
      </label>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>{busy ? "Сохранение…" : "Сохранить"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>Отмена</Button>
      </div>
    </form>
  );
}