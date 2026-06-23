import { createFileRoute, Link, Navigate, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ClientPortalLayout } from "@/components/client/ClientPortalLayout";
import { useClientSession } from "@/lib/client-portal/use-client-session";
import { listMyProjects, type ProjectRow } from "@/lib/client-portal/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/client")({
  head: () => ({
    meta: [
      { title: "Личный кабинет — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Личный кабинет заказчика." },
    ],
    links: [{ rel: "canonical", href: "/client" }],
  }),
  ssr: false,
  component: Page,
});

function Page() {
  const session = useClientSession();
  const matchRoute = useMatchRoute();
  const isChild = !!matchRoute({ to: "/client/project/$id" });
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session.status !== "authenticated" || isChild) return;
    let active = true;
    listMyProjects()
      .then((p) => { if (active) setProjects(p); })
      .catch(() => { if (active) setError("Не удалось загрузить список проектов. Попробуйте обновить страницу."); });
    return () => { active = false; };
  }, [session.status, isChild]);

  if (session.status === "loading") {
    return <Skeleton />;
  }
  if (session.status === "anonymous") {
    return <Navigate to="/login" search={{ returnTo: "/client" } as never} replace />;
  }

  if (isChild) {
    return <Outlet />;
  }

  return (
    <ClientPortalLayout
      email={session.email}
      title="Личный кабинет"
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Личный кабинет" }]}
    >
      {error ? (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</div>
      ) : projects === null ? (
        <p className="text-sm text-muted-foreground">Загружаем ваши проекты…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-6">
          <p className="text-sm">У вас пока нет доступных проектов.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Проект появляется в личном кабинете после его создания и привязки к вашей учётной записи.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {p.is_demo ? (
                    <span className="inline-block rounded bg-warning/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-warning-foreground">DEMO</span>
                  ) : null}
                  <h2 className="mt-2 font-display text-lg font-semibold">{p.title}</h2>
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs">{statusLabel(p.status)}</span>
              </div>
              {p.description ? (
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
              ) : null}
              <Button asChild className="mt-4" size="sm">
                <Link to="/client/project/$id" params={{ id: p.id }}>
                  Открыть проект
                  <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </ClientPortalLayout>
  );
}

function Skeleton() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-sm text-muted-foreground">Загрузка…</p>
    </div>
  );
}

function statusLabel(s: string) {
  switch (s) {
    case "active": return "В работе";
    case "completed": return "Завершён";
    case "on_hold": return "Приостановлен";
    case "cancelled": return "Отменён";
    default: return s;
  }
}
