import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Inbox, Building2, ClipboardCheck, MessageSquare, CreditCard, FileText, History,
} from "lucide-react";
import { useAdminSession } from "@/lib/admin/use-admin-session";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getDashboardCounters, type DashboardCounters } from "@/lib/admin/api.functions";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Дашборд — Админ-панель" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: DashboardPage,
});

interface Widget {
  label: string;
  key: keyof DashboardCounters;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  hint: string;
  requires: string;
}

const WIDGETS: Widget[] = [
  { key: "newApplications",    label: "Новые заявки",                   icon: Inbox,          hint: "статус: new",                          requires: "admin.applications.read" },
  { key: "activeProjects",     label: "Активные проекты",               icon: Building2,      hint: "статус: active",                       requires: "admin.projects.read" },
  { key: "pendingAcceptances", label: "Этапы на приёмке",               icon: ClipboardCheck, hint: "ожидают решения клиента",              requires: "admin.acceptances.read" },
  { key: "recentMessages",     label: "Сообщения за 7 дней",            icon: MessageSquare,  hint: "по всем доступным проектам",           requires: "admin.messages.read" },
  { key: "unpaidPayments",     label: "Неоплаченные платежи",           icon: CreditCard,     hint: "planned / pending / overdue",          requires: "admin.payments.read" },
  { key: "recentReports",      label: "Отчёты за 7 дней",               icon: FileText,       hint: "созданные за неделю",                  requires: "admin.reports.read" },
  { key: "recentAuditEntries", label: "Действий в журнале за 7 дней",   icon: History,        hint: "административные события",             requires: "admin.audit.read" },
];

function DashboardPage() {
  const session = useAdminSession();
  const [counters, setCounters] = useState<DashboardCounters | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session.status !== "authenticated") return;
    let active = true;
    getDashboardCounters()
      .then((c) => { if (active) setCounters(c); })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Не удалось загрузить данные дашборда.");
      });
    return () => { active = false; };
  }, [session.status]);

  if (session.status !== "authenticated") return null;

  const visible = WIDGETS.filter((w) => session.admin.permissions.includes(w.requires));

  return (
    <AdminLayout
      admin={session.admin}
      title="Дашборд"
      breadcrumbs={[{ label: "Админ-панель", to: "/admin" }, { label: "Дашборд" }]}
    >
      {error ? (
        <div role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          {error}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">У вашей роли нет доступных виджетов.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((w) => {
            const Icon = w.icon;
            const value = counters ? counters[w.key] : null;
            return (
              <li
                key={w.key}
                className="rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {w.label}
                    </p>
                    <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
                      {value === null ? "—" : value}
                    </p>
                  </div>
                  <Icon aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{w.hint}</p>
              </li>
            );
          })}
        </ul>
      )}

      <section className="mt-8 rounded-lg border border-border bg-card p-4">
        <h2 className="font-display text-lg font-semibold">Stage 5.1 — Foundation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Каркас админ-панели активен. Разделы будут заполняться в Stage 5.2–5.4.
        </p>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <li>Роль: <strong>{session.admin.role ?? "—"}</strong></li>
          <li>Разрешений: <strong>{session.admin.permissions.length}</strong></li>
        </ul>
      </section>
    </AdminLayout>
  );
}