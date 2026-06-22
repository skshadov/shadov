import { createFileRoute, Navigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClientPortalLayout } from "@/components/client/ClientPortalLayout";
import { useClientSession } from "@/lib/client-portal/use-client-session";
import { isValidProjectId } from "@/lib/client-portal/safe-return-to";
import { getProject, type ProjectRow } from "@/lib/client-portal/api";
import { ProjectTabs, type TabKey, TAB_KEYS } from "@/components/client/ClientProjectTabs";

type Search = { tab?: string };

export const Route = createFileRoute("/client/project/$id")({
  head: () => ({
    meta: [
      { title: "Проект в кабинете — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Личный кабинет — страница проекта." },
    ],
  }),
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => ({
    tab: typeof s.tab === "string" ? s.tab : undefined,
  }),
  component: Page,
});

function Page() {
  const session = useClientSession();
  const { id } = Route.useParams();
  const search = useSearch({ from: "/client/project/$id" }) as Search;
  const tab: TabKey = (TAB_KEYS as readonly string[]).includes(search.tab ?? "")
    ? (search.tab as TabKey)
    : "overview";

  const [project, setProject] = useState<ProjectRow | null | "forbidden">(null);

  useEffect(() => {
    if (session.status !== "authenticated") return;
    if (!isValidProjectId(id)) { setProject("forbidden"); return; }
    let active = true;
    getProject(id)
      .then((p) => { if (active) setProject(p ?? "forbidden"); })
      .catch(() => { if (active) setProject("forbidden"); });
    return () => { active = false; };
  }, [session.status, id]);

  if (session.status === "loading") {
    return <div className="flex min-h-dvh items-center justify-center"><p className="text-sm text-muted-foreground">Загрузка…</p></div>;
  }
  if (session.status === "anonymous") {
    return <Navigate to="/login" search={{ returnTo: `/client/project/${id}` } as never} replace />;
  }

  if (project === null) {
    return (
      <ClientPortalLayout email={session.email} title="Проект" breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Личный кабинет", to: "/client" }, { label: "Проект" }]}>
        <p className="text-sm text-muted-foreground">Загружаем проект…</p>
      </ClientPortalLayout>
    );
  }

  if (project === "forbidden") {
    return (
      <ClientPortalLayout email={session.email} title="Проект" breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Личный кабинет", to: "/client" }, { label: "Проект" }]}>
        <div className="rounded-md border border-border bg-card p-6">
          <p className="text-sm">Проект не найден или у вас нет доступа.</p>
        </div>
      </ClientPortalLayout>
    );
  }

  return (
    <ClientPortalLayout
      email={session.email}
      title={project.title}
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Личный кабинет", to: "/client" },
        { label: project.is_demo ? "DEMO-проект" : "Проект" },
      ]}
    >
      {project.is_demo ? (
        <p className="mb-4 inline-block rounded bg-warning/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-warning-foreground">DEMO — демонстрационный проект</p>
      ) : null}
      <ProjectTabs projectId={project.id} activeTab={tab} project={project} userId={session.userId} />
    </ClientPortalLayout>
  );
}
