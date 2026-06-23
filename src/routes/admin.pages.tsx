import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminSession } from "@/lib/admin/use-admin-session";
import {
  listContentBlocks, upsertContentBlock, deleteContentBlock,
  type ContentBlock, type ContentStatus,
} from "@/lib/admin/content.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/pages")({
  head: () => ({
    meta: [
      { title: "Контентные блоки — Админ-панель" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: AdminPagesPage,
});

const STATUS_OPTIONS: { value: ContentStatus | ""; label: string }[] = [
  { value: "",         label: "Все статусы" },
  { value: "draft",    label: "Черновики" },
  { value: "published",label: "Опубликованные" },
  { value: "archived", label: "В архиве" },
];

interface Draft {
  id?: string;
  slug: string;
  locale: string;
  title: string;
  body_md: string;
  body_html: string;
  status: ContentStatus;
}

const EMPTY: Draft = { slug: "", locale: "ru", title: "", body_md: "", body_html: "", status: "draft" };

function toDraft(b: ContentBlock): Draft {
  return {
    id: b.id, slug: b.slug, locale: b.locale, title: b.title,
    body_md: b.body_md, body_html: b.body_html, status: b.status as ContentStatus,
  };
}

function AdminPagesPage() {
  const session = useAdminSession();
  const [items, setItems] = useState<ContentBlock[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "">("");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canWrite = useMemo(
    () => session.status === "authenticated" && session.admin.permissions.includes("admin.content.write"),
    [session]
  );

  async function reload() {
    setLoading(true);
    try {
      const r = await listContentBlocks({ data: {
        search: search || undefined,
        status: statusFilter || undefined,
      } });
      setItems(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить блоки.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (session.status !== "authenticated") return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status, statusFilter]);

  if (session.status !== "authenticated") return null;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const saved = await upsertContentBlock({ data: draft });
      setSuccess(draft.id ? "Сохранено" : "Создано");
      setDraft(toDraft(saved));
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить.");
    } finally { setBusy(false); }
  }

  async function onDelete(id: string) {
    if (!canWrite) return;
    if (!confirm("Удалить контентный блок?")) return;
    setBusy(true); setError(null);
    try {
      await deleteContentBlock({ data: { id } });
      if (draft.id === id) setDraft(EMPTY);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить.");
    } finally { setBusy(false); }
  }

  return (
    <AdminLayout
      admin={session.admin}
      title="Контентные блоки"
      breadcrumbs={[{ label: "Админ-панель", to: "/admin" }, { label: "Страницы" }]}
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* List */}
        <aside className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              type="search" placeholder="Поиск по slug / заголовку"
              value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") reload(); }}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={reload}>Найти</Button>
          </div>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter((e.target.value as ContentStatus) || "")}
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Button
            type="button" variant="outline" className="w-full"
            onClick={() => { setDraft(EMPTY); setSuccess(null); setError(null); }}
            disabled={!canWrite}
          >
            <Plus aria-hidden className="mr-1 h-4 w-4" /> Новый блок
          </Button>
          {loading ? (
            <p className="text-sm text-muted-foreground">Загрузка…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Блоков пока нет.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {items.map((it) => {
                const active = draft.id === it.id;
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      onClick={() => { setDraft(toDraft(it)); setSuccess(null); setError(null); }}
                      className={[
                        "block w-full px-3 py-2 text-left text-sm",
                        active ? "bg-primary/10" : "hover:bg-muted",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{it.title || it.slug}</span>
                        <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {it.status}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{it.slug} · {it.locale}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Editor */}
        <form onSubmit={onSave} className="space-y-4">
          {error ? (
            <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span>{error}</span>
            </div>
          ) : null}
          {success ? (
            <div role="status" className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
              <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
            <div>
              <Label htmlFor="cb-slug">Slug</Label>
              <Input id="cb-slug" value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                placeholder="home.hero.title" disabled={!canWrite}
              />
              <p className="mt-1 text-xs text-muted-foreground">Маленькие буквы/цифры/символы <code>- _ . /</code></p>
            </div>
            <div>
              <Label htmlFor="cb-locale">Локаль</Label>
              <Input id="cb-locale" value={draft.locale}
                onChange={(e) => setDraft((d) => ({ ...d, locale: e.target.value }))}
                placeholder="ru" disabled={!canWrite}
              />
            </div>
            <div>
              <Label htmlFor="cb-status">Статус</Label>
              <select
                id="cb-status"
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as ContentStatus }))}
                disabled={!canWrite}
              >
                <option value="draft">Черновик</option>
                <option value="published">Опубликовано</option>
                <option value="archived">В архиве</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="cb-title">Заголовок</Label>
            <Input id="cb-title" value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              disabled={!canWrite}
            />
          </div>
          <div>
            <Label htmlFor="cb-md">Markdown</Label>
            <Textarea id="cb-md" rows={10} value={draft.body_md}
              onChange={(e) => setDraft((d) => ({ ...d, body_md: e.target.value }))}
              disabled={!canWrite}
              className="font-mono text-sm"
            />
          </div>
          <div>
            <Label htmlFor="cb-html">HTML (опционально, выводится как доверенный)</Label>
            <Textarea id="cb-html" rows={6} value={draft.body_html}
              onChange={(e) => setDraft((d) => ({ ...d, body_html: e.target.value }))}
              disabled={!canWrite}
              className="font-mono text-xs"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              HTML рендерится напрямую — не вставляйте код из недоверенных источников.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <div className="text-xs text-muted-foreground">
              {draft.id ? `ID: ${draft.id}` : "Новый блок"}
            </div>
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