import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminSession } from "@/lib/admin/use-admin-session";
import {
  listServices, upsertService, deleteService, listServiceCategories,
  type Service, type ServiceCategory, type CatalogStatus,
} from "@/lib/admin/catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/catalog/services")({
  head: () => ({
    meta: [
      { title: "Услуги — Админ-панель" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: ServicesPage,
});

interface Draft {
  id?: string;
  slug: string;
  category_id: string;
  title: string;
  summary: string;
  body_md: string;
  base_price: string;
  price_unit: string;
  currency: string;
  status: CatalogStatus;
  sort_order: number;
  seo_title: string;
  seo_description: string;
}
const EMPTY: Draft = {
  slug: "", category_id: "", title: "", summary: "", body_md: "",
  base_price: "", price_unit: "", currency: "RUB", status: "draft",
  sort_order: 0, seo_title: "", seo_description: "",
};

function ServicesPage() {
  const session = useAdminSession();
  const [items, setItems] = useState<Service[]>([]);
  const [cats, setCats] = useState<ServiceCategory[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CatalogStatus | "">("");
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
      const [a, b] = await Promise.all([
        listServices({ data: { search: search || undefined, status: statusFilter || undefined } }),
        listServiceCategories(),
      ]);
      setItems(a.items); setCats(b);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (session.status === "authenticated") reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status, statusFilter]);
  if (session.status !== "authenticated") return null;

  function loadItem(it: Service) {
    setDraft({
      id: it.id, slug: it.slug, category_id: it.category_id ?? "",
      title: it.title, summary: it.summary, body_md: it.body_md,
      base_price: it.base_price !== null ? String(it.base_price) : "",
      price_unit: it.price_unit, currency: it.currency,
      status: it.status as CatalogStatus, sort_order: it.sort_order,
      seo_title: it.seo_title, seo_description: it.seo_description,
    });
    setSuccess(null); setError(null);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const saved = await upsertService({ data: {
        id: draft.id, slug: draft.slug,
        category_id: draft.category_id || null,
        title: draft.title, summary: draft.summary, body_md: draft.body_md,
        base_price: draft.base_price.trim() || null,
        price_unit: draft.price_unit, currency: draft.currency,
        status: draft.status, sort_order: draft.sort_order,
        seo_title: draft.seo_title, seo_description: draft.seo_description,
      } });
      loadItem(saved);
      setSuccess("Сохранено");
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setBusy(false); }
  }

  async function onDelete(id: string) {
    if (!canWrite || !confirm("Удалить услугу?")) return;
    setBusy(true);
    try {
      await deleteService({ data: { id } });
      if (draft.id === id) setDraft(EMPTY);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setBusy(false); }
  }

  return (
    <AdminLayout
      admin={session.admin}
      title="Услуги каталога"
      breadcrumbs={[
        { label: "Админ-панель", to: "/admin" },
        { label: "Каталог" },
        { label: "Услуги" },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-3">
          <div className="flex gap-2">
            <Input type="search" placeholder="Поиск" value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") reload(); }} className="flex-1"/>
            <Button type="button" variant="outline" onClick={reload}>Найти</Button>
          </div>
          <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter((e.target.value as CatalogStatus) || "")}>
            <option value="">Все статусы</option>
            <option value="draft">Черновики</option>
            <option value="published">Опубликованные</option>
            <option value="archived">В архиве</option>
          </select>
          <Button type="button" variant="outline" className="w-full"
            onClick={() => { setDraft(EMPTY); setSuccess(null); setError(null); }} disabled={!canWrite}>
            <Plus aria-hidden className="mr-1 h-4 w-4" /> Новая услуга
          </Button>
          {loading ? <p className="text-sm text-muted-foreground">Загрузка…</p>
            : items.length === 0 ? <p className="text-sm text-muted-foreground">Услуг нет.</p>
            : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {items.map((it) => {
                  const active = draft.id === it.id;
                  return (
                    <li key={it.id}>
                      <button type="button" onClick={() => loadItem(it)}
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
              <Label htmlFor="s-slug">Slug</Label>
              <Input id="s-slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} disabled={!canWrite}/>
            </div>
            <div>
              <Label htmlFor="s-sort">Порядок</Label>
              <Input id="s-sort" type="number" value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })} disabled={!canWrite}/>
            </div>
            <div>
              <Label htmlFor="s-status">Статус</Label>
              <select id="s-status"
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
            <Label htmlFor="s-title">Название</Label>
            <Input id="s-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} disabled={!canWrite}/>
          </div>
          <div>
            <Label htmlFor="s-cat">Категория</Label>
            <select id="s-cat"
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.category_id}
              onChange={(e) => setDraft({ ...draft, category_id: e.target.value })} disabled={!canWrite}>
              <option value="">— Без категории —</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.slug})</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="s-summary">Краткое описание</Label>
            <Textarea id="s-summary" rows={3} value={draft.summary}
              onChange={(e) => setDraft({ ...draft, summary: e.target.value })} disabled={!canWrite}/>
          </div>
          <div>
            <Label htmlFor="s-body">Описание (Markdown)</Label>
            <Textarea id="s-body" rows={10} value={draft.body_md}
              onChange={(e) => setDraft({ ...draft, body_md: e.target.value })}
              disabled={!canWrite} className="font-mono text-sm"/>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr]">
            <div>
              <Label htmlFor="s-price">Цена «от»</Label>
              <Input id="s-price" inputMode="decimal" value={draft.base_price}
                onChange={(e) => setDraft({ ...draft, base_price: e.target.value })}
                placeholder="например 1500.00" disabled={!canWrite}/>
            </div>
            <div>
              <Label htmlFor="s-unit">Единица</Label>
              <Input id="s-unit" value={draft.price_unit}
                onChange={(e) => setDraft({ ...draft, price_unit: e.target.value })}
                placeholder="м² / шт / договорно" disabled={!canWrite}/>
            </div>
            <div>
              <Label htmlFor="s-cur">Валюта</Label>
              <Input id="s-cur" value={draft.currency} maxLength={3}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })}
                disabled={!canWrite}/>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="s-seo-title">SEO title</Label>
              <Input id="s-seo-title" value={draft.seo_title}
                onChange={(e) => setDraft({ ...draft, seo_title: e.target.value })} disabled={!canWrite}/>
            </div>
            <div>
              <Label htmlFor="s-seo-desc">SEO description</Label>
              <Input id="s-seo-desc" value={draft.seo_description}
                onChange={(e) => setDraft({ ...draft, seo_description: e.target.value })} disabled={!canWrite}/>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">{draft.id ? `ID: ${draft.id}` : "Новая услуга"}</span>
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