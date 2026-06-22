import { useEffect, useRef, useState } from "react";
import type { MessageRow } from "@/lib/client-portal/api";
import { listMessages, sendMessage } from "@/lib/client-portal/api";
import { supabase } from "@/integrations/supabase/client";

const DRAFT_PREFIX = "shadov:project-message-draft:";

export function MessagesTab({ projectId, userId }: { projectId: string; userId: string }) {
  const [items, setItems] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    try { setDraft(localStorage.getItem(DRAFT_PREFIX + projectId) ?? ""); } catch { /* ignore */ }
    listMessages(projectId).then(setItems).catch(() => setItems([]));
    const ch = supabase
      .channel(`pm:${projectId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "project_messages", filter: `project_id=eq.${projectId}` },
        (payload) => setItems((cur) => [...cur, payload.new as MessageRow]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [projectId]);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [items.length]);

  function setDraftPersist(v: string) {
    setDraft(v);
    try { localStorage.setItem(DRAFT_PREFIX + projectId, v); } catch { /* ignore */ }
  }

  async function onSend() {
    if (busy) return;
    const body = draft.trim();
    if (!body) return;
    if (body.length > 4000) { setError("Сообщение слишком длинное."); return; }
    setBusy(true); setError(null);
    try { await sendMessage(projectId, body, userId); setDraftPersist(""); }
    catch { setError("Не удалось отправить сообщение."); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">Сообщения в кабинете не предназначены для экстренных обращений.</p>
      <ul ref={listRef} aria-live="polite" className="grid max-h-[480px] gap-2 overflow-y-auto rounded-lg border border-border bg-card p-3">
        {items.length === 0 ? <li className="text-sm text-muted-foreground">Сообщений пока нет.</li> : null}
        {items.map((m) => (
          <li key={m.id} className="rounded-md bg-muted/40 p-3 text-sm">
            <p className="text-xs text-muted-foreground">
              {m.message_type === "system" ? "Системное сообщение" : m.sender_id === userId ? "Вы" : "Представитель компании"}
              {" · "}{new Date(m.created_at).toLocaleString("ru-RU")}
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words">{m.body}</p>
          </li>
        ))}
      </ul>
      <div>
        <label htmlFor="msg-body" className="text-sm font-medium">Новое сообщение</label>
        <textarea id="msg-body" value={draft} maxLength={4000}
          onChange={(e) => setDraftPersist(e.target.value)}
          className="mt-1 min-h-24 w-full rounded-md border border-border bg-background p-2 text-sm" />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{draft.length} / 4000</span>
          <button type="button" onClick={onSend} disabled={busy || !draft.trim()} className="min-h-11 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50">
            {busy ? "Отправляем…" : "Отправить"}
          </button>
        </div>
        {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}