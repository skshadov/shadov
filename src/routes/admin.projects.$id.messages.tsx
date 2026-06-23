import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminSession, hasPermission } from "@/lib/admin/use-admin-session";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  listMessages, sendMessage, deleteMessage, type MessageItem,
} from "@/lib/admin/communications.functions";

export const Route = createFileRoute("/admin/projects/$id/messages")({
  head: () => ({ meta: [{ title: "Сообщения проекта — Админ-панель" }, { name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  component: ProjectMessagesPage,
});

function ProjectMessagesPage() {
  const session = useAdminSession();
  const { id } = useParams({ from: "/admin/projects/$id/messages" });
  const [items, setItems] = useState<MessageItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const reloadRef = useRef<() => void>(() => {});

  const reload = useCallback(() => {
    listMessages({ data: { project_id: id } })
      .then(setItems)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, [id]);
  reloadRef.current = reload;

  useEffect(() => { if (session.status === "authenticated") reload(); }, [session.status, reload]);

  // Realtime: подписка на новые сообщения проекта.
  useEffect(() => {
    if (session.status !== "authenticated") return;
    const ch = supabase
      .channel(`admin-messages-${id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "project_messages", filter: `project_id=eq.${id}` },
        () => reloadRef.current(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session.status, id]);

  if (session.status !== "authenticated") return null;
  if (!hasPermission(session, "admin.messages.read")) {
    return <AdminLayout admin={session.admin} title="Сообщения" breadcrumbs={[{ label: "Админ-панель", to: "/admin" }]}><p>Нет доступа.</p></AdminLayout>;
  }
  const canWrite = hasPermission(session, "admin.messages.write");

  return (
    <AdminLayout admin={session.admin} title="Сообщения проекта"
      breadcrumbs={[
        { label: "Админ-панель", to: "/admin" },
        { label: "Проекты", to: "/admin/projects" },
        { label: "Проект", to: `/admin/projects/${id}` },
        { label: "Сообщения" },
      ]}>
      {error ? <div role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}

      {canWrite ? (
        <form className="mb-4 space-y-2" onSubmit={async (e) => {
          e.preventDefault(); if (!body.trim()) return;
          setSending(true);
          try { await sendMessage({ data: { project_id: id, body } }); setBody(""); reload(); }
          catch (err) { alert(err instanceof Error ? err.message : "Ошибка"); }
          finally { setSending(false); }
        }}>
          <Textarea rows={3} placeholder="Сообщение клиенту…" value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={sending || !body.trim()}>{sending ? "Отправка…" : "Отправить"}</Button>
            <span className="text-xs text-muted-foreground">До 4000 символов. Видно всем участникам проекта.</span>
          </div>
        </form>
      ) : null}

      {items === null ? <p className="text-sm text-muted-foreground">Загрузка…</p>
        : items.length === 0 ? <p className="text-sm text-muted-foreground">Сообщений нет.</p>
        : (
          <ul className="space-y-2">
            {items.map((m) => (
              <li key={m.id} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">
                      {m.sender_name || (m.sender_id ? m.sender_id.slice(0, 8) : "Система")}
                      {" · "}{new Date(m.created_at).toLocaleString("ru-RU")}
                      {m.message_type !== "text" ? <> · <span className="font-mono">{m.message_type}</span></> : null}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{m.body}</p>
                  </div>
                  {canWrite ? (
                    <Button size="sm" variant="ghost" onClick={async () => {
                      if (!confirm("Удалить сообщение?")) return;
                      try { await deleteMessage({ data: { id: m.id } }); reload(); }
                      catch (err) { alert(err instanceof Error ? err.message : "Ошибка"); }
                    }}>×</Button>
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