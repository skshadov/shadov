/**
 * Админка: модерация отзывов, присланных с сайта.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Star, Check, X, EyeOff, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminSession } from "@/lib/admin/use-admin-session";
import { Button } from "@/components/ui/button";
import { listAdminReviews, moderateReview, type AdminReview } from "@/lib/admin/reviews.functions";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({
    meta: [
      { title: "Отзывы — Админ-панель" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: AdminReviewsPage,
});

type Filter = "pending" | "approved" | "rejected" | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "pending", label: "На проверке" },
  { value: "approved", label: "Опубликованные" },
  { value: "rejected", label: "Отклонённые" },
  { value: "all", label: "Все" },
];

function AdminReviewsPage() {
  const session = useAdminSession();
  const [status, setStatus] = useState<Filter>("pending");
  const [rows, setRows] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canPublish = useMemo(
    () => session.status === "authenticated" && session.admin.permissions.includes("admin.reviews.publish"),
    [session],
  );

  async function reload(next: Filter = status) {
    setLoading(true);
    setError(null);
    try {
      setRows(await listAdminReviews({ data: { status: next } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить отзывы");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function act(id: string, action: "approve" | "reject" | "unpublish" | "delete") {
    if (action === "delete" && !window.confirm("Удалить отзыв безвозвратно?")) return;
    setBusy(id);
    try {
      await moderateReview({ data: { id, action } });
      await reload(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось выполнить действие");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminLayout
      admin={session.status === "authenticated" ? session.admin : null}
      title="Отзывы"
      breadcrumbs={[{ label: "Админ", to: "/admin/dashboard" }, { label: "Отзывы" }]}
    >
      <p className="max-w-3xl text-sm text-muted-foreground">
        Отзывы с формы на сайте попадают сюда со статусом «на проверке» и не видны публично,
        пока их не одобрят.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={status === f.value ? "default" : "outline"}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Отзывов в этом статусе нет.</p>
        ) : (
          rows.map((r) => (
            <article key={r.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{r.author_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[r.author_role, r.service_slug, r.contact].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-primary" aria-label={`Оценка ${r.rating} из 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4" fill={i < r.rating ? "currentColor" : "none"} />
                  ))}
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{r.body}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {r.moderation_status === "pending"
                    ? "На проверке"
                    : r.moderation_status === "approved"
                      ? "Одобрен"
                      : "Отклонён"}
                  {r.is_published ? " · опубликован" : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.submitted_at ?? r.created_at).toLocaleString("ru-RU")}
                </span>
                <span className="text-xs text-muted-foreground">{r.source ?? ""}</span>

                {canPublish ? (
                  <div className="ml-auto flex flex-wrap gap-2">
                    {!r.is_published ? (
                      <Button size="sm" disabled={busy === r.id} onClick={() => act(r.id, "approve")}>
                        <Check className="mr-1 h-4 w-4" /> Опубликовать
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => act(r.id, "unpublish")}>
                        <EyeOff className="mr-1 h-4 w-4" /> Снять с публикации
                      </Button>
                    )}
                    {r.moderation_status !== "rejected" ? (
                      <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => act(r.id, "reject")}>
                        <X className="mr-1 h-4 w-4" /> Отклонить
                      </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => act(r.id, "delete")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
