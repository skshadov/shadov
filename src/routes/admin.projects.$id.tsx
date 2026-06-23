import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAdminSession, hasPermission } from "@/lib/admin/use-admin-session";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getProject, updateProject, upsertStage, deleteStage, requestStageAcceptance,
  type ProjectDetail, type ProjectStatus, type StageStatus,
} from "@/lib/admin/projects.functions";
import { StatusPill } from "./admin.projects";

export const Route = createFileRoute("/admin/projects/$id")({
  head: () => ({ meta: [{ title: "Проект — Админ-панель" }, { name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  component: ProjectDetailPage,
});

const PROJECT_STATUSES: ProjectStatus[] = ["draft", "planning", "in_progress", "on_hold", "completed", "cancelled"];
const STAGE_STATUSES: StageStatus[] = ["pending", "in_progress", "review", "accepted", "blocked"];

function ProjectDetailPage() {
  const session = useAdminSession();
  const { id } = useParams({ from: "/admin/projects/$id" });
  const [project, setProject] = useState<ProjectDetail | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    getProject({ data: { id } })
      .then((r) => setProject(r))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, [id]);

  useEffect(() => { if (session.status === "authenticated") reload(); }, [session.status, reload]);

  if (session.status !== "authenticated") return null;
  if (!hasPermission(session, "admin.projects.read")) {
    return <AdminLayout admin={session.admin} title="Проект"><p>Нет доступа.</p></AdminLayout>;
  }

  const canWrite = hasPermission(session, "admin.projects.write");

  return (
    <AdminLayout admin={session.admin} title={project?.title ?? "Проект"}
      breadcrumbs={[{ label: "Админ-панель", to: "/admin" }, { label: "Проекты", to: "/admin/projects" }, { label: project?.title ?? "…" }]}>
      {error ? <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}
      {project === undefined ? <p className="text-sm text-muted-foreground">Загрузка…</p>
        : project === null ? <p className="text-sm text-muted-foreground">Проект не найден.</p>
        : (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <ProjectMeta project={project} canWrite={canWrite} onSaved={reload} />
              <StagesSection project={project} canWrite={canWrite} onChanged={reload} />
            </div>
            <aside className="space-y-6">
              <MembersSection project={project} />
              <AcceptancesSection project={project} />
            </aside>
          </div>
        )}
    </AdminLayout>
  );
}

function ProjectMeta({ project, canWrite, onSaved }: { project: ProjectDetail; canWrite: boolean; onSaved: () => void }) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <section className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Основное</h2>
        <StatusPill status={project.status} />
      </div>
      <div className="space-y-3">
        <div>
          <label htmlFor="t" className="mb-1 block text-xs text-muted-foreground">Название</label>
          <Input id="t" disabled={!canWrite} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlFor="d" className="mb-1 block text-xs text-muted-foreground">Описание</label>
          <Textarea id="d" disabled={!canWrite} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label htmlFor="s" className="mb-1 block text-xs text-muted-foreground">Статус</label>
          <select id="s" disabled={!canWrite} value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {canWrite ? (
          <div className="flex items-center gap-3">
            <Button size="sm" disabled={saving} onClick={async () => {
              setSaving(true); setMsg(null);
              try {
                await updateProject({ data: { id: project.id, title, description: description || null, status } });
                setMsg("Сохранено"); onSaved();
              } catch (e) { setMsg(e instanceof Error ? e.message : "Ошибка"); }
              finally { setSaving(false); }
            }}>{saving ? "Сохранение…" : "Сохранить"}</Button>
            {msg ? <span className="text-xs text-muted-foreground">{msg}</span> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StagesSection({ project, canWrite, onChanged }: { project: ProjectDetail; canWrite: boolean; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <section className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Этапы</h2>
        {canWrite ? <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>{adding ? "Отмена" : "Добавить этап"}</Button> : null}
      </div>
      {adding ? (
        <div className="mb-3 flex gap-2">
          <Input placeholder="Название этапа" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <Button size="sm" disabled={!newTitle.trim()} onClick={async () => {
            try {
              await upsertStage({ data: {
                project_id: project.id, title: newTitle,
                sort_order: (project.stages.at(-1)?.sort_order ?? -1) + 1,
              } });
              setNewTitle(""); setAdding(false); onChanged();
            } catch (e) { alert(e instanceof Error ? e.message : "Ошибка"); }
          }}>Создать</Button>
        </div>
      ) : null}
      {project.stages.length === 0 ? (
        <p className="text-sm text-muted-foreground">Этапы ещё не добавлены.</p>
      ) : (
        <ul className="space-y-2">
          {project.stages.map((s) => (
            <li key={s.id} className="rounded-md border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium">{s.sort_order + 1}. {s.title}</div>
                  {s.description ? <p className="mt-1 text-sm text-muted-foreground">{s.description}</p> : null}
                  <div className="mt-1 text-xs text-muted-foreground">
                    Статус: <span className="font-mono">{s.status}</span>
                    {s.planned_start ? <> · план: {s.planned_start} — {s.planned_end ?? "?"}</> : null}
                  </div>
                </div>
                {canWrite ? (
                  <div className="flex shrink-0 flex-wrap gap-1">
                    <select value={s.status} disabled={busy === s.id}
                      onChange={async (e) => {
                        setBusy(s.id);
                        try { await upsertStage({ data: { id: s.id, project_id: project.id, title: s.title, status: e.target.value as StageStatus, sort_order: s.sort_order } }); onChanged(); }
                        finally { setBusy(null); }
                      }}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                      {STAGE_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                    <Button size="sm" variant="outline" disabled={busy === s.id}
                      onClick={async () => {
                        setBusy(s.id);
                        try { await requestStageAcceptance({ data: { stage_id: s.id } }); onChanged(); }
                        catch (e) { alert(e instanceof Error ? e.message : "Ошибка"); }
                        finally { setBusy(null); }
                      }}>На приёмку</Button>
                    <Button size="sm" variant="ghost" disabled={busy === s.id}
                      onClick={async () => {
                        if (!confirm(`Удалить этап «${s.title}»?`)) return;
                        setBusy(s.id);
                        try { await deleteStage({ data: { id: s.id } }); onChanged(); }
                        finally { setBusy(null); }
                      }}>Удалить</Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MembersSection({ project }: { project: ProjectDetail }) {
  return (
    <section className="rounded-lg border border-border p-4">
      <h2 className="mb-3 text-base font-semibold">Участники</h2>
      {project.members.length === 0 ? <p className="text-sm text-muted-foreground">Участников нет.</p> : (
        <ul className="space-y-1 text-sm">
          {project.members.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between">
              <Link to="/admin/clients/$id" params={{ id: m.user_id }} className="hover:underline">
                {m.display_name || m.user_id.slice(0, 8)}
              </Link>
              <span className="text-xs text-muted-foreground">{m.member_role}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AcceptancesSection({ project }: { project: ProjectDetail }) {
  if (project.acceptances.length === 0) return null;
  return (
    <section className="rounded-lg border border-border p-4">
      <h2 className="mb-3 text-base font-semibold">Запросы на приёмку</h2>
      <ul className="space-y-2 text-sm">
        {project.acceptances.map((a) => (
          <li key={a.id} className="rounded border border-border p-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono">#{a.attempt_number}</span>
              <span className="text-muted-foreground">{a.status}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{new Date(a.requested_at).toLocaleString("ru-RU")}</div>
            {a.client_comment ? <p className="mt-1 text-xs">{a.client_comment}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}