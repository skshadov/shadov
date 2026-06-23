import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAdminSession, hasPermission } from "@/lib/admin/use-admin-session";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getClient, updateClientProfile, type ClientDetail } from "@/lib/admin/clients.functions";

export const Route = createFileRoute("/admin/clients/$id")({
  head: () => ({ meta: [{ title: "Клиент — Админ-панель" }, { name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  component: ClientDetailPage,
});

function ClientDetailPage() {
  const { id } = Route.useParams();
  const session = useAdminSession();
  const [client, setClient] = useState<ClientDetail | null | "loading">("loading");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (session.status !== "authenticated") return;
    let active = true;
    getClient({ data: { id } })
      .then((r) => { if (active) { setClient(r); setDisplayName(r?.display_name ?? ""); setPhone(r?.phone ?? ""); setDirty(false); } })
      .catch((e: unknown) => { if (active) { setClient(null); setError(e instanceof Error ? e.message : "Ошибка"); } });
    return () => { active = false; };
  }, [session.status, id]);

  if (session.status !== "authenticated") return null;
  if (!hasPermission(session, "admin.clients.read")) {
    return <AdminLayout admin={session.admin} title="Клиент" breadcrumbs={[{ label: "Админ-панель", to: "/admin" }, { label: "Клиенты", to: "/admin/clients" }, { label: id }]}><p>Нет доступа.</p></AdminLayout>;
  }
  const canWrite = hasPermission(session, "admin.clients.write");
  const canPii = hasPermission(session, "admin.clients.pii");

  async function onSave() {
    setSaving(true); setError(null);
    try {
      await updateClientProfile({ data: { id, display_name: displayName, phone: canPii ? phone : undefined } });
      const fresh = await getClient({ data: { id } });
      setClient(fresh); setDirty(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setSaving(false); }
  }

  const bc = [
    { label: "Админ-панель", to: "/admin" },
    { label: "Клиенты", to: "/admin/clients" },
    { label: client && client !== "loading" ? (client.display_name || id.slice(0, 8)) : id.slice(0, 8) },
  ];

  return (
    <AdminLayout admin={session.admin} title="Карточка клиента" breadcrumbs={bc}>
      {error ? <div role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}
      {client === "loading" ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : !client ? (
        <p className="text-sm text-muted-foreground">Клиент не найден.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-display text-lg font-semibold">Профиль</h2>
              <div className="mt-4 space-y-3">
                <Field label="Имя">
                  <Input value={displayName} onChange={(e) => { setDisplayName(e.target.value); setDirty(true); }} disabled={!canWrite} />
                </Field>
                <Field label={`Телефон${canPii ? "" : " (скрыт)"}`}>
                  <Input value={phone} onChange={(e) => { setPhone(e.target.value); setDirty(true); }} disabled={!canWrite || !canPii} />
                </Field>
                <Field label="Email">
                  <div className="text-sm">{client.email || (canPii ? "—" : "скрыт")}</div>
                </Field>
                <Field label="Роли">
                  <div className="text-sm">{client.roles.length ? client.roles.join(", ") : "—"}</div>
                </Field>
                <Field label="Зарегистрирован">
                  <div className="text-sm">{new Date(client.created_at).toLocaleString("ru-RU")}</div>
                </Field>
              </div>
              {canWrite ? (
                <div className="mt-4 flex justify-end">
                  <Button onClick={onSave} disabled={!dirty || saving}>{saving ? "Сохранение…" : "Сохранить"}</Button>
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Проекты ({client.projects.length})</h3>
              <ul className="mt-2 divide-y divide-border">
                {client.projects.length === 0 ? <li className="py-3 text-sm text-muted-foreground">Нет проектов.</li>
                  : client.projects.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground">{p.status} · {new Date(p.created_at).toLocaleDateString("ru-RU")}</div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Заявки ({client.applications.length})</h3>
              <ul className="mt-2 divide-y divide-border">
                {client.applications.length === 0 ? <li className="py-3 text-sm text-muted-foreground">Нет заявок.</li>
                  : client.applications.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <div className="font-mono text-xs">{a.request_number}</div>
                        <div className="text-xs text-muted-foreground">{a.status} · {new Date(a.created_at).toLocaleDateString("ru-RU")}</div>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/admin/applications/$id" params={{ id: a.id }}>Открыть</Link>
                      </Button>
                    </li>
                  ))}
              </ul>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              <h3 className="text-sm font-semibold">Информация</h3>
              <p className="mt-2 text-muted-foreground">
                ID: <span className="font-mono text-xs">{client.id}</span>
              </p>
              <p className="mt-2 text-muted-foreground">
                Управление ролями выполняется в разделе «Сотрудники» (Stage 5.3).
              </p>
            </div>
          </aside>
        </div>
      )}
    </AdminLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}