import { useEffect, useState } from "react";
import type { DocumentRow } from "@/lib/client-portal/api";
import { listDocuments, requestDocumentSignedUrl } from "@/lib/client-portal/api";

const SAFE_MIMES = new Set([
  "application/pdf", "image/jpeg", "image/png", "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword", "application/vnd.ms-excel", "text/plain",
]);

export function DocumentsTab({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<DocumentRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  useEffect(() => { listDocuments(projectId).then(setItems).catch(() => setItems([])); }, [projectId]);
  if (items === null) return <p className="text-sm text-muted-foreground">Загружаем…</p>;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Документов пока нет.</p>;
  async function open(d: DocumentRow) {
    if (!SAFE_MIMES.has(d.mime_type)) { setErr((s) => ({ ...s, [d.id]: "Тип файла не поддерживается для прямого открытия." })); return; }
    setBusy(d.id);
    try {
      const r = await requestDocumentSignedUrl(d.id);
      window.open(r.url, "_blank", "noopener,noreferrer");
    } catch { setErr((s) => ({ ...s, [d.id]: "Не удалось получить ссылку." })); }
    finally { setBusy(null); }
  }
  return (
    <ul className="grid gap-2">
      {items.map((d) => (
        <li key={d.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{d.title ?? d.file_name}</p>
              {d.description ? <p className="mt-1 text-sm text-muted-foreground">{d.description}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {d.document_category ?? "Документ"} · {d.document_date ?? new Date(d.created_at).toLocaleDateString("ru-RU")} · {Math.round(d.size_bytes / 1024)} КБ · {d.mime_type}
              </p>
            </div>
            <button type="button" onClick={() => open(d)} disabled={busy === d.id} className="min-h-11 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50">
              {busy === d.id ? "Получаем…" : "Скачать"}
            </button>
          </div>
          {err[d.id] ? <p role="alert" className="mt-2 text-sm text-destructive">{err[d.id]}</p> : null}
        </li>
      ))}
    </ul>
  );
}