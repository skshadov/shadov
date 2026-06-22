import { useEffect, useState } from "react";
import type { CameraRow } from "@/lib/client-portal/api";
import { listCameras, requestCameraSession } from "@/lib/client-portal/api";

function labelStatus(s: CameraRow["status"]) {
  if (s === "not_configured") return "Камера пока не подключена";
  if (s === "online") return "В сети";
  if (s === "offline") return "Камера временно недоступна";
  return "Обслуживание";
}

export function CamerasTab({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<CameraRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});
  useEffect(() => { listCameras(projectId).then(setItems).catch(() => setItems([])); }, [projectId]);
  if (items === null) return <p className="text-sm text-muted-foreground">Загружаем камеры…</p>;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">К проекту пока не подключено ни одной камеры.</p>;
  async function open(id: string) {
    setBusy(id);
    try {
      const r = await requestCameraSession(id);
      if (!r.success) setMsg((s) => ({ ...s, [id]: "Камера пока не подключена." }));
      else setMsg((s) => ({ ...s, [id]: "Сессия просмотра создана." }));
    } catch { setMsg((s) => ({ ...s, [id]: "Не удалось подключиться." })); }
    finally { setBusy(null); }
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((c) => (
        <li key={c.id} className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-display text-base font-semibold">{c.name}</h3>
          {c.description ? <p className="mt-1 text-sm text-muted-foreground">{c.description}</p> : null}
          <p className="mt-2 text-xs text-muted-foreground">Статус: {labelStatus(c.status)}</p>
          {c.last_checked_at ? <p className="text-xs text-muted-foreground">Последняя проверка: {new Date(c.last_checked_at).toLocaleString("ru-RU")}</p> : null}
          {c.status === "online" ? (
            <button type="button" disabled={busy === c.id} onClick={() => open(c.id)} className="mt-3 min-h-11 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50">
              {busy === c.id ? "Подключаемся…" : "Открыть просмотр"}
            </button>
          ) : null}
          {msg[c.id] ? <p className="mt-2 text-xs">{msg[c.id]}</p> : null}
        </li>
      ))}
    </ul>
  );
}