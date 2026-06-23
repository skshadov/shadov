import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAdminSession, hasPermission } from "@/lib/admin/use-admin-session";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listApplications, type ApplicationListItem, type ApplicationStatus } from "@/lib/admin/applications.functions";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({ meta: [{ title: "Заявки — Админ-панель" }, { name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  component: ApplicationsListPage,
});

const STATUS_LABELS: Record<ApplicationStatus | "all", string> = {
  all: "Все",
  new: "Новые",
  in_review: "В работе",
  contacted: "Связались",
  quoted: "Просчитано",
  closed: "Закрыто",
  spam: "Спам",
};
const STATUSES: Array<ApplicationStatus | "all"> = ["all", "new", "in_review", "contacted", "quoted", "closed", "spam"];
const PAGE_SIZE = 25;

function ApplicationsListPage() {
  const session = useAdminSession();
  const [status, setStatus] = useState<ApplicationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<ApplicationListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (session.status !== "authenticated") return;
    let active = true;
    setError(null);
    listApplications({ data: { status, search: debounced || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE } })
      .then((r) => { if (active) { setItems(r.items); setTotal(r.total); } })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Ошибка загрузки"); });
    return () => { active = false; };
  }, [session.status, status, debounced, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
  if (session.status !== "authenticated") return null;
  if (!hasPermission(session, "admin.applications.read")) {
    return (
      <AdminLayout admin={session.admin} title="Заявки" breadcrumbs={[{ label: "Админ-панель", to: "/admin" }, { label: "Заявки" }]}>
        <p className="text-sm text-muted-foreground">У вашей роли нет доступа к заявкам.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout admin={session.admin} title="Заявки" breadcrumbs={[{ label: "Админ-панель", to: "/admin" }, { label: "Заявки" }]}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-xs text-muted-foreground" htmlFor="search">Поиск</label>
          <Input id="search" placeholder="Номер, имя, телефон, email" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground" htmlFor="status">Статус</label>
          <select
            id="status" value={status}
            onChange={(e) => { setStatus(e.target.value as ApplicationStatus | "all"); setPage(0); }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      {error ? <div role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">№</th>
              <th className="px-3 py-2">Контакт</th>
              <th className="px-3 py-2">Услуга / источник</th>
              <th className="px-3 py-2">Статус</th>
              <th className="px-3 py-2">Создана</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items === null ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Загрузка…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Ничего не найдено.</td></tr>
            ) : items.map((a) => (
              <tr key={a.id}>
                <td className="px-3 py-2 font-mono text-xs">{a.request_number}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{a.contact_name}</div>
                  <div className="text-xs text-muted-foreground">{a.phone || a.email || "—"}</div>
                </td>
                <td className="px-3 py-2 text-xs">
                  {a.service_slug ?? "—"}
                  <div className="text-muted-foreground">{a.source_path}</div>
                </td>
                <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("ru-RU")}</td>
                <td className="px-3 py-2 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/applications/$id" params={{ id: a.id }}>Открыть</Link>
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

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cls: Record<ApplicationStatus, string> = {
    new: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    in_review: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    contacted: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
    quoted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    closed: "bg-muted text-muted-foreground",
    spam: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${cls[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}