import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Trash2, Save, AlertCircle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminSession } from "@/lib/admin/use-admin-session";
import { supabase } from "@/integrations/supabase/client";
import {
  listMediaAssets, createMediaUploadUrl, registerUploadedMedia,
  updateMediaAsset, deleteMediaAsset, getMediaSignedUrls,
  type MediaAsset,
} from "@/lib/admin/media.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/media")({
  head: () => ({
    meta: [
      { title: "Медиатека — Админ-панель" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: AdminMediaPage,
});

function isImage(mime: string) { return mime.startsWith("image/"); }

async function probeImage(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return {};
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const out = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({}); };
    img.src = url;
  });
}

function AdminMediaPage() {
  const session = useAdminSession();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const canWrite = useMemo(
    () => session.status === "authenticated" && session.admin.permissions.includes("admin.media.write"),
    [session]
  );
  const canDelete = useMemo(
    () => session.status === "authenticated" && session.admin.permissions.includes("admin.media.delete"),
    [session]
  );

  async function reload() {
    setLoading(true);
    try {
      const r = await listMediaAssets({ data: { search: search || undefined } });
      setItems(r.items);
      if (r.items.length > 0) {
        const signed = await getMediaSignedUrls({ data: { ids: r.items.map((i) => i.id), expires_in: 60 * 60 } });
        setUrls(signed);
      } else {
        setUrls({});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить медиатеку.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (session.status !== "authenticated") return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status]);

  if (session.status !== "authenticated") return null;

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !canWrite) return;
    setBusy(true); setError(null);
    try {
      const probe = await probeImage(file);
      const upload = await createMediaUploadUrl({ data: {
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      } });
      const { error: upErr } = await supabase.storage.from(upload.bucket)
        .uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type || undefined });
      if (upErr) throw upErr;
      await registerUploadedMedia({ data: {
        storage_path: upload.storage_path,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        width: probe.width ?? null,
        height: probe.height ?? null,
        title: file.name,
      } });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки.");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function onSaveMeta(item: MediaAsset, alt: string, title: string) {
    if (!canWrite) return;
    setBusy(true); setError(null);
    try {
      await updateMediaAsset({ data: { id: item.id, alt_text: alt, title } });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить.");
    } finally { setBusy(false); }
  }

  async function onDelete(id: string) {
    if (!canDelete) return;
    if (!confirm("Удалить файл?")) return;
    setBusy(true); setError(null);
    try {
      await deleteMediaAsset({ data: { id } });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить.");
    } finally { setBusy(false); }
  }

  return (
    <AdminLayout
      admin={session.admin}
      title="Медиатека"
      breadcrumbs={[{ label: "Админ-панель", to: "/admin" }, { label: "Медиатека" }]}
    >
      {error ? (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="mb-6 rounded-lg border border-dashed border-border p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Загрузить файл</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              JPG / PNG / WEBP / AVIF / GIF / SVG / MP4 / WEBM / PDF. До 25 МБ.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input ref={fileInput} type="file" onChange={onPickFile} disabled={!canWrite || busy} className="max-w-xs" />
            <Upload aria-hidden className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          type="search" placeholder="Поиск по названию / alt / пути"
          value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") reload(); }}
          className="max-w-sm"
        />
        <Button type="button" variant="outline" onClick={reload}>Найти</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Медиатека пуста.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((it) => (
            <MediaCard
              key={it.id} item={it} url={urls[it.id]}
              canWrite={canWrite} canDelete={canDelete}
              onSave={onSaveMeta} onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </AdminLayout>
  );
}

function MediaCard({
  item, url, canWrite, canDelete, onSave, onDelete,
}: {
  item: MediaAsset;
  url: string | undefined;
  canWrite: boolean;
  canDelete: boolean;
  onSave: (item: MediaAsset, alt: string, title: string) => void;
  onDelete: (id: string) => void;
}) {
  const [alt, setAlt] = useState(item.alt_text);
  const [title, setTitle] = useState(item.title);

  return (
    <li className="rounded-lg border border-border bg-card p-3">
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded bg-muted">
        {isImage(item.mime_type) && url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={item.alt_text || item.title} className="h-full w-full object-cover" />
        ) : url ? (
          <a href={url} target="_blank" rel="noreferrer" className="text-sm underline">
            Открыть {item.mime_type}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">Предпросмотр недоступен</span>
        )}
      </div>
      <div className="mt-3 space-y-2 text-sm">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название" disabled={!canWrite} />
        <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Alt-текст" disabled={!canWrite} />
        <p className="truncate text-xs text-muted-foreground">{item.storage_path}</p>
        <p className="text-xs text-muted-foreground">
          {item.mime_type} · {(item.size_bytes / 1024).toFixed(0)} КБ
          {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
        </p>
        <div className="flex justify-between gap-2 pt-1">
          <Button type="button" size="sm" variant="outline" onClick={() => onSave(item, alt, title)} disabled={!canWrite}>
            <Save aria-hidden className="mr-1 h-3.5 w-3.5" /> Сохранить
          </Button>
          <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(item.id)} disabled={!canDelete}>
            <Trash2 aria-hidden className="mr-1 h-3.5 w-3.5" /> Удалить
          </Button>
        </div>
      </div>
    </li>
  );
}