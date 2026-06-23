import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminSession } from "@/lib/admin/use-admin-session";
import {
  listPriceItems, upsertPriceItem, deletePriceItem,
  type PriceItem, type CatalogStatus,
} from "@/lib/admin/catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/catalog/prices")({
  head: () => ({
    meta: [
      { title: "Прайс-лист — Админ-панель" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: PricesPage,
});

interface Draft {
  id?: string;
  group_slug: string;
  subgroup_slug: string;
  title: string;
  unit: string;
  price_min: string;
  price_max: string;
  currency: string;
  status: CatalogStatus;
  sort_order: number;
  notes: string;
}
const EMPTY: Draft = {
  group_slug: "", subgroup_slug: "", title: "", unit: "",
  price_min: "", price_max: "", currency: "RUB", status: "draft",
  sort_order: 0, notes: "",
};

function PricesPage() {
  const session = useAdminSession();
  const [items, setItems] = useState<PriceItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CatalogStatus | "">("");
  const [groupFilter, setGroupFilter] = useState("");
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
      const r = await listPriceItems({ data: {
        search: search || undefined,
        status: statusFilter || undefined,
        group_slug: groupFilter || undefined,
      } });
      setItems(r.items);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (session.status === "authenticated") reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status, statusFilter, groupFilter]);
  if (session.status !== "authenticated") return null;

  function loadItem(it: PriceItem) {
    setDraft({
      id: it.id, group_slug: it.group_slug, subgroup_slug: it.subgroup_slug,
      title: it.title, unit: it.unit,
      price_min: it.price_min !== null ? String(it.price_min) : "",
      price_max: it.price_max !== null ? String(it.price_max) : "",
      currency: it.currency, status: it.status as CatalogStatus,
      sort_order: it.sort_order, notes: it.notes,
    });
    setSuccess(null); setError(null);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const saved = await upsertPriceItem({ data: {
        id: draft.id, group_slug: draft.group_slug, subgroup_slug: draft.subgroup_slug || undefined,
        title: draft.title, unit: draft.unit,
        price_min: draft.price_min.trim() || null,
        price_max: draft.price_max.trim() || null,
        currency: draft.currency, status: draft.status,
        sort_order: draft.sort_order, notes: draft.notes,
      } });
      loadItem(saved);
      setSuccess("Сохранено");
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setBusy(false); }
  }

  async function onDelete(id: string) {
    if (!canWrite || !confirm("Удалить позицию прайса?")) return;
    setBusy(true);
    try {
      await deletePriceItem({ data: { id } });
      if (draft.id === id) setDraft(EMPTY);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setBusy(false); }
  }

  const groups = useMemo(() => Array.from(new Set(items.map((i) => i.group_slug))).sort(), [items]);

  return (
    <AdminLayout
      admin={session.admin}
      title="Прайс-лист"
      breadcrumbs={[
        { label: "Админ-панель", to: "/admin" },
        { label: "Каталог" },
        { label: "Прайс" },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-3">
          <div className="flex gap-2">
            <Input type="search" placeholder="Поиск" value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") reload(); }} className="flex-1"/>
            <Button type="button" variant="outline" onClick={reload}>Найти</Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter((e.target.value as CatalogStatus) || "")}>
              <option value="">Все статусы</option>
              <option value="draft">Черновики</option>
              <option value="published">Опубликованные</option>
              <option value="archived">В архиве</option>
            </select>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}>
              <option value="">Все группы</option>
              {groups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <Button type="button" variant="outline" className="w-full"
            onClick={() => { setDraft(EMPTY); setSuccess(null); setError(null); }} disabled={!canWrite}>
            <Plus aria-hidden className="mr-1 h-4 w-4" /> Новая позиция
          </Button>
          {loading ? <p className="text-sm text-muted-foreground">Загрузка…</p>
            : items.length === 0 ? <p className="text-sm text-muted-foreground">Позиций нет.</p>
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
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {it.group_slug}{it.subgroup_slug ? ` / ${it.subgroup_slug}` : ""}
                          {it.price_min !== null || it.price_max !== null ? (
                            <> · {it.price_min ?? "…"}–{it.price_max ?? "…"} {it.currency}</>
                          ) : null}
                        </div>
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

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr]">
            <div>
              <Label htmlFor="p-group">Группа (slug)</Label>
              <Input id="p-group" value={draft.group_slug}
                onChange={(e) => setDraft({ ...draft, group_slug: e.target.value })}
                placeholder="finishing" disabled={!canWrite}/>
            </div>
            <div>
              <Label htmlFor="p-subgroup">Подгруппа</Label>
              <Input id="p-subgroup" value={draft.subgroup_slug}
                onChange={(e) => setDraft({ ...draft, subgroup_slug: e.target.value })}
                placeholder="walls" disabled={!canWrite}/>
            </div>
            <div>
              <Label htmlFor="p-sort">Порядок</Label>
              <Input id="p-sort" type="number" value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })} disabled={!canWrite}/>
            </div>
            <div>
              <Label htmlFor="p-status">Статус</Label>
              <select id="p-status"
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
            <Label htmlFor="p-title">Название</Label>
            <Input id="p-title" value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })} disabled={!canWrite}/>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr]">
            <div>
              <Label htmlFor="p-min">Цена «от»</Label>
              <Input id="p-min" inputMode="decimal" value={draft.price_min}
                onChange={(e) => setDraft({ ...draft, price_min: e.target.value })} disabled={!canWrite}/>
            </div>
            <div>
              <Label htmlFor="p-max">Цена «до»</Label>
              <Input id="p-max" inputMode="decimal" value={draft.price_max}
                onChange={(e) => setDraft({ ...draft, price_max: e.target.value })} disabled={!canWrite}/>
            </div>
            <div>
              <Label htmlFor="p-unit">Единица</Label>
              <Input id="p-unit" value={draft.unit}
                onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                placeholder="м² / шт / м.п." disabled={!canWrite}/>
            </div>
            <div>
              <Label htmlFor="p-cur">Валюта</Label>
              <Input id="p-cur" value={draft.currency} maxLength={3}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })}
                disabled={!canWrite}/>
            </div>
          </div>

          <div>
            <Label htmlFor="p-notes">Примечания</Label>
            <Textarea id="p-notes" rows={3} value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })} disabled={!canWrite}/>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">{draft.id ? `ID: ${draft.id}` : "Новая позиция"}</span>
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