import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAdminSession, hasPermission } from "@/lib/admin/use-admin-session";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listClients, type ClientListItem } from "@/lib/admin/clients.functions";

export const Route = createFileRoute("/admin/clients")({
  head: () => ({ meta: [{ title: "Клиенты — Админ-панель" }, { name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  component: ClientsListPage,
});

const PAGE_SIZE = 25;

function ClientsListPage() {
  const session = useAdminSession();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<ClientListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => { setDebounced(search); setPage(0); }, 300); return () => clearTimeout(t); }, [search]);

  useEffect(() => {
    if (session.status !== "authenticated") return;
    let active = true; setError(null);
    listClients({ data: { search: debounced || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE } })
      .then((r) => { if (active) { setItems(r.items); setTotal(r.total); } })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Ошибка"); });
    return () => { active = false; };
  }, [session.status, debounced, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
  if (session.status !== "authenticated") return null;
  if (!hasPermission(session, "admin.clients.read")) {
    return <AdminLayout admin={session.admin} title="Клиенты" breadcrumbs={[{ label: "Админ-панель", to: "/admin" }, { label: "Клиенты" }]}><p>Нет доступа.</p></AdminLayout>;
  }
  const canPii = hasPermission(session, "admin.clients.pii");

  return (
    <AdminLayout admin={session.admin} title="Клиенты" breadcrumbs={[{ label: "Админ-панель", to: "/admin" }, { label: "Клиенты" }]}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[260px] flex-1">
          <label htmlFor="search" className="mb-1 block text-xs text-muted-foreground">Поиск</label>
          <Input id="search" placeholder="Имя или телефон" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {!canPii ? <p className="text-xs text-muted-foreground">PII скрыты — нет права admin.clients.pii</p> : null}
      </div>

      {error ? <div role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Клиент</th>
              <th className="px-3 py-2">Контакты</th>
              <th className="px-3 py-2">Роли</th>
              <th className="px-3 py-2">Проекты</th>
              <th className="px-3 py-2">Заявки</th>
              <th className="px-3 py-2">Регистрация</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items === null ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Загрузка…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Ничего не найдено.</td></tr>
            ) : items.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2">
                  <div className="font-medium">{c.display_name || "—"}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{c.id.slice(0, 8)}</div>
                </td>
                <td className="px-3 py-2 text-xs">
                  <div>{c.phone || "—"}</div>
                  <div className="text-muted-foreground">{c.email || (canPii ? "—" : "скрыт")}</div>
                </td>
                <td className="px-3 py-2 text-xs">{c.roles.length ? c.roles.join(", ") : "—"}</td>
                <td className="px-3 py-2 tabular-nums">{c.projects_count}</td>
                <td className="px-3 py-2 tabular-nums">{c.applications_count}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("ru-RU")}</td>
                <td className="px-3 py-2 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/clients/$id" params={{ id: c.id }}>Открыть</Link>
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