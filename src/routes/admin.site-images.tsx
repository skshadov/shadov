import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, RotateCcw, AlertCircle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminSession } from "@/lib/admin/use-admin-session";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { IMAGE_SLOTS } from "@/lib/site-content/image-slots";
import { siteImageUrl } from "@/lib/site-content/store";
import { createMediaUploadUrl } from "@/lib/admin/media.functions";
import { listSiteImages, saveSiteImage, resetSiteImage, type SiteImageRow } from "@/lib/admin/site-content.functions";

export const Route = createFileRoute("/admin/site-images")({
  head: () => ({
    meta: [
      { title: "Фото сайта — Админ-панель" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: AdminSiteImagesPage,
});

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
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };
    img.src = url;
  });
}

function AdminSiteImagesPage() {
  const session = useAdminSession();
  const [rows, setRows] = useState<Record<string, SiteImageRow>>({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const canWrite = useMemo(
    () => session.status === "authenticated" && session.admin.permissions.includes("admin.media.write"),
    [session],
  );

  async function reload() {
    const list = await listSiteImages();
    const map: Record<string, SiteImageRow> = {};
    for (const r of list) map[r.key] = r;
    setRows(map);
  }

  useEffect(() => {
    (async () => {
      try {
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось загрузить фотографии");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleUpload(key: string, file: File) {
    setBusyKey(key);
    setError(null);
    try {
      const dims = await probeImage(file);
      const up = await createMediaUploadUrl({
        data: { file_name: file.name, mime_type: file.type, size_bytes: file.size },
      });
      const { error: upErr } = await supabase.storage.from(up.bucket).uploadToSignedUrl(up.path, up.token, file);
      if (upErr) throw new Error(upErr.message);
      await saveSiteImage({
        data: { key, storage_path: up.storage_path, width: dims.width ?? null, height: dims.height ?? null },
      });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить файл");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleReset(key: string) {
    if (!window.confirm("Вернуть исходную фотографию?")) return;
    setBusyKey(key);
    try {
      await resetSiteImage({ data: { key } });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сбросить");
    } finally {
      setBusyKey(null);
    }
  }

  const groups = Array.from(new Set(IMAGE_SLOTS.map((s) => s.group)));

  return (
    <AdminLayout
      admin={session.status === "authenticated" ? session.admin : null!}
      title="Фото сайта"
      breadcrumbs={[{ label: "Админ", to: "/admin/dashboard" }, { label: "Фото сайта" }]}
    >
      <p className="max-w-3xl text-sm text-muted-foreground">
        Замена фотографий в ключевых блоках сайта. Формат JPG или WebP, до 25 МБ. Для каждого слота указан
        рекомендуемый размер — при других пропорциях фото будет обрезано по центру.
      </p>

      {error ? (
        <p className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        groups.map((group) => (
          <section key={group} className="mt-8">
            <h2 className="font-display text-lg font-semibold">{group}</h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {IMAGE_SLOTS.filter((s) => s.group === group).map((slot) => {
                const row = rows[slot.key];
                return (
                  <li key={slot.key} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                    <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {row ? (
                        <img
                          src={siteImageUrl(slot.key, row.updated_at)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          исходное
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{slot.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{slot.hint}</p>
                      <p className="mt-1 text-xs font-medium text-primary">
                        Рекомендуемый размер: {slot.width}×{slot.height} px ({slot.aspect})
                      </p>
                      {row?.width ? (
                        <p className="text-xs text-muted-foreground">
                          Загружено: {row.width}×{row.height} px
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input
                          ref={(el) => {
                            inputs.current[slot.key] = el;
                          }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (f) void handleUpload(slot.key, f);
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={!canWrite || busyKey === slot.key}
                          onClick={() => inputs.current[slot.key]?.click()}
                        >
                          <Upload className="mr-1.5 h-4 w-4" />
                          {busyKey === slot.key ? "Загрузка…" : "Заменить фото"}
                        </Button>
                        {row ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!canWrite || busyKey === slot.key}
                            onClick={() => void handleReset(slot.key)}
                          >
                            <RotateCcw className="mr-1.5 h-4 w-4" /> Исходное
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </AdminLayout>
  );
}