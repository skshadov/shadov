import { createFileRoute, Navigate, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useAdminSession } from "@/lib/admin/use-admin-session";
import { AdminForbidden } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Административная панель — Шадов и партнёры" },
      // Жёсткий noindex для всей админки: индексация запрещена, ссылки не считать.
      { name: "robots", content: "noindex, nofollow" },
      { name: "googlebot", content: "noindex, nofollow" },
      { name: "description", content: "Административная панель компании. Доступ только для авторизованных сотрудников." },
    ],
    links: [{ rel: "canonical", href: "/admin" }],
  }),
  ssr: false,
  component: AdminGate,
});

function AdminGate() {
  const session = useAdminSession();
  const matchRoute = useMatchRoute();
  const isExactAdminRoot = !!matchRoute({ to: "/admin" });

  if (session.status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Проверка доступа…</p>
      </div>
    );
  }
  if (session.status === "anonymous") {
    return <Navigate to="/login" search={{ returnTo: "/admin/dashboard" } as never} replace />;
  }
  if (session.status === "forbidden") {
    return <AdminForbidden email={session.email} />;
  }
  // Голый /admin — редирект на дашборд.
  if (isExactAdminRoot) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Outlet />;
}
