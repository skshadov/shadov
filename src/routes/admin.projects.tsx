import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAdminSession, hasPermission } from "@/lib/admin/use-admin-session";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listProjects, type ProjectListItem, type ProjectStatus } from "@/lib/admin/projects.functions";

export const Route = createFileRoute("/admin/projects")({
  head: () => ({ meta: [{ title: "Проекты — Админ-панель" }, { name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  component: ProjectsListPage,
});

const LABELS: Record<ProjectStatus | "all", string> = {
  all: "Все",
  draft: "Черновик",
  planning: "Планирование",
  in_progress: "В работе",
  on_hold: "Пауза",
  completed: "Завершён",
  cancelled: "Отменён",
};
const STATUSES: Array<ProjectStatus | "all"> = ["all", "draft", "planning", "in_progress", "on_hold", "completed", "cancelled"];
const PAGE_SIZE = 25;

function ProjectsListPage() {
  const session = useAdminSession();
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<ProjectListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => { setDebounced(search); setPage(0); }, 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => {
    if (session.status !== "authenticated") return;
    let active = true; setError(null);
    listProjects({ data: { status, search: debounced || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE } })
      .then((r) => { if (active) { setItems(r.items); setTotal(r.total); } })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Ошибка загрузки"); });
    return () => { active = false; };
  }, [session.status, status, debounced, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
  if (session.status !== "authenticated") return null;
  if (!hasPermission(session, "admin.projects.read")) {
    return (
      <AdminLayout admin={session.admin} title="Проекты" breadcrumbs={[{ label: "Админ-панель", to: "/admin" }, { label: "Проекты" }]}>
        <p className="text-sm text-muted-foreground">У вашей роли нет доступа к проектам.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout admin={session.admin} title="Проекты" breadcrumbs={[{ label: "Админ-панель", to: "/admin" }, { label: "Проекты" }]}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-xs text-muted-foreground" htmlFor="search">Поиск по названию</label>
          <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground" htmlFor="status">Статус</label>
          <select id="status" value={status}
            onChange={(e) => { setStatus(e.target.value as ProjectStatus | "all"); setPage(0); }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            {STATUSES.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      {error ? <div role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Название</th>
              <th className="px-3 py-2">Статус</th>
              <th className="px-3 py-2">Участники</th>
              <th className="px-3 py-2">Этапы</th>
              <th className="px-3 py-2">Создан</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items === null ? <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Загрузка…</td></tr>
              : items.length === 0 ? <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Проектов не найдено.</td></tr>
              : items.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2">
                    <div className="font-medium">{p.title}</div>
                    {p.is_demo ? <span className="text-xs text-amber-700 dark:text-amber-300">demo</span> : null}
                  </td>
                  <td className="px-3 py-2"><StatusPill status={p.status} /></td>
                  <td className="px-3 py-2 text-xs">{p.members_count}</td>
                  <td className="px-3 py-2 text-xs">{p.stages_count}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("ru-RU")}</td>
                  <td className="px-3 py-2 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/projects/$id" params={{ id: p.id }}>Открыть</Link>
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Всего: {total}</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Назад</Button>
          <span>{page + 1} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Вперёд</Button>
        </div>
      </div>
    </AdminLayout>
  );
}

export function StatusPill({ status }: { status: ProjectStatus }) {
  const cls: Record<ProjectStatus, string> = {
    draft: "bg-muted text-muted-foreground",
    planning: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    in_progress: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    on_hold: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
    completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    cancelled: "bg-destructive/10 text-destructive",
  };
  return <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${cls[status]}`}>{LABELS[status]}</span>;
}