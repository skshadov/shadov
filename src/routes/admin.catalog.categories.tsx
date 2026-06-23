import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminSession } from "@/lib/admin/use-admin-session";
import {
  listServiceCategories, upsertServiceCategory, deleteServiceCategory,
  type ServiceCategory, type CatalogStatus, type UpsertCategoryInput,
} from "@/lib/admin/catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/catalog/categories")({
  head: () => ({
    meta: [
      { title: "Категории каталога — Админ-панель" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: CategoriesPage,
});

type Draft = Required<Omit<UpsertCategoryInput, "id" | "parent_id" | "hero_media_id">> & {
  id?: string;
  parent_id: string | "";
  hero_media_id: string | "";
};
const EMPTY: Draft = {
  slug: "", parent_id: "", title: "", summary: "", sort_order: 0,
  status: "draft", hero_media_id: "", seo_title: "", seo_description: "",
};

function CategoriesPage() {
  const session = useAdminSession();
  const [items, setItems] = useState<ServiceCategory[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canWrite = useMemo(
    () => session.status === "authenticated" && session.admin.permissions.includes("admin.catalog.write"),
    [session]
  );

  async function reload() {
    setLoading(true);
    try {
      const rows = await listServiceCategories();
      setItems(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить категории.");
    } finally { setLoading(false); }
  }
  useEffect(() => { if (session.status === "authenticated") reload(); }, [session.status]);
  if (session.status !== "authenticated") return null;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const saved = await upsertServiceCategory({ data: {
        id: draft.id, slug: draft.slug, parent_id: draft.parent_id || null,
        title: draft.title, summary: draft.summary, sort_order: draft.sort_order,
        status: draft.status, hero_media_id: draft.hero_media_id || null,
        seo_title: draft.seo_title, seo_description: draft.seo_description,
      } });
      setDraft({
        ...draft, id: saved.id, slug: saved.slug,
        parent_id: saved.parent_id ?? "", title: saved.title,
        summary: saved.summary, sort_order: saved.sort_order,
        status: saved.status as CatalogStatus,
        hero_media_id: saved.hero_media_id ?? "",
        seo_title: saved.seo_title, seo_description: saved.seo_description,
      });
      setSuccess("Сохранено");
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setBusy(false); }
  }

  async function onDelete(id: string) {
    if (!canWrite || !confirm("Удалить категорию?")) return;
    setBusy(true);
    try {
      await deleteServiceCategory({ data: { id } });
      if (draft.id === id) setDraft(EMPTY);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setBusy(false); }
  }

  return (
    <AdminLayout
      admin={session.admin}
      title="Категории каталога"
      breadcrumbs={[
        { label: "Админ-панель", to: "/admin" },
        { label: "Каталог" },
        { label: "Категории" },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-3">
          <Button type="button" variant="outline" className="w-full"
            onClick={() => { setDraft(EMPTY); setSuccess(null); setError(null); }}
            disabled={!canWrite}
          >
            <Plus aria-hidden className="mr-1 h-4 w-4" /> Новая категория
          </Button>
          {loading ? <p className="text-sm text-muted-foreground">Загрузка…</p>
            : items.length === 0 ? <p className="text-sm text-muted-foreground">Категорий пока нет.</p>
            : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {items.map((it) => {
                  const active = draft.id === it.id;
                  return (
                    <li key={it.id}>
                      <button type="button" onClick={() => setDraft({
                        id: it.id, slug: it.slug, parent_id: it.parent_id ?? "",
                        title: it.title, summary: it.summary, sort_order: it.sort_order,
                        status: it.status as CatalogStatus,
                        hero_media_id: it.hero_media_id ?? "",
                        seo_title: it.seo_title, seo_description: it.seo_description,
                      })}
                        className={["block w-full px-3 py-2 text-left text-sm",
                          active ? "bg-primary/10" : "hover:bg-muted"].join(" ")}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium">{it.title}</span>
                          <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                            {it.status}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">{it.slug}</div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
        </aside>

        <form onSubmit={onSave} className="space-y-4">
          {error ? (
            <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />{error}
            </div>
          ) : null}
          {success ? (
            <div role="status" className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
              <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{success}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
            <div>
              <Label htmlFor="cat-slug">Slug</Label>
              <Input id="cat-slug" value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                placeholder="remont" disabled={!canWrite}/>
            </div>
            <div>
              <Label htmlFor="cat-sort">Порядок</Label>
              <Input id="cat-sort" type="number" value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
                disabled={!canWrite}/>
            </div>
            <div>
              <Label htmlFor="cat-status">Статус</Label>
              <select id="cat-status"
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as CatalogStatus })}
                disabled={!canWrite}>
                <option value="draft">Черновик</option>
                <option value="published">Опубликовано</option>
                <option value="archived">В архиве</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="cat-title">Название</Label>
            <Input id="cat-title" value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              disabled={!canWrite}/>
          </div>

          <div>
            <Label htmlFor="cat-parent">Родительская категория</Label>
            <select id="cat-parent"
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.parent_id}
              onChange={(e) => setDraft({ ...draft, parent_id: e.target.value })}
              disabled={!canWrite}>
              <option value="">— Корневая —</option>
              {items.filter((it) => it.id !== draft.id).map((it) =>
                <option key={it.id} value={it.id}>{it.title} ({it.slug})</option>
              )}
            </select>
          </div>

          <div>
            <Label htmlFor="cat-summary">Краткое описание</Label>
            <Textarea id="cat-summary" rows={3} value={draft.summary}
              onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
              disabled={!canWrite}/>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="cat-seo-title">SEO title</Label>
              <Input id="cat-seo-title" value={draft.seo_title}
                onChange={(e) => setDraft({ ...draft, seo_title: e.target.value })}
                disabled={!canWrite}/>
            </div>
            <div>
              <Label htmlFor="cat-seo-desc">SEO description</Label>
              <Input id="cat-seo-desc" value={draft.seo_description}
                onChange={(e) => setDraft({ ...draft, seo_description: e.target.value })}
                disabled={!canWrite}/>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">
              {draft.id ? `ID: ${draft.id}` : "Новая категория"}
            </span>
            <div className="flex gap-2">
              {draft.id ? (
                <Button type="button" variant="destructive" onClick={() => onDelete(draft.id!)} disabled={!canWrite || busy}>
                  <Trash2 aria-hidden className="mr-1 h-4 w-4" /> Удалить
                </Button>
              ) : null}
              <Button type="submit" disabled={!canWrite || busy}>
                <Save aria-hidden className="mr-1 h-4 w-4" /> {busy ? "Сохранение…" : "Сохранить"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}