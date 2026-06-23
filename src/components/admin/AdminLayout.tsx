/**
 * Stage 5.1 — каркас административной панели.
 * Sidebar навигация по разделам (фильтрация по разрешениям),
 * topbar с текущей ролью и кнопкой выхода, breadcrumbs.
 */
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, ExternalLink, ShieldAlert } from "lucide-react";
import {
  LayoutDashboard, Inbox, Users, Building2, ListChecks, FileText, FolderOpen, Camera, Images,
  MessageSquare, CreditCard, ClipboardCheck, Briefcase, Tag, Calculator as CalcIcon,
  FileEdit, ImageIcon, Star, HelpCircle, Globe, Scale, UserCog, Bell, Settings, History, Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/common/Breadcrumbs";
import type { AdminContext } from "@/lib/admin/api.functions";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  permission: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/admin/dashboard",     label: "Дашборд",           icon: LayoutDashboard, permission: "admin.dashboard.read" },
  { to: "/admin/applications",  label: "Заявки",            icon: Inbox,           permission: "admin.applications.read" },
  { to: "/admin/clients",       label: "Клиенты",           icon: Users,           permission: "admin.clients.read" },
  { to: "/admin/projects",      label: "Проекты",           icon: Building2,       permission: "admin.projects.read" },
  { to: "/admin/project-stages",label: "Этапы",             icon: ListChecks,      permission: "admin.stages.read" },
  { to: "/admin/daily-reports", label: "Отчёты",            icon: FileText,        permission: "admin.reports.read" },
  { to: "/admin/project-documents", label: "Документы",     icon: FolderOpen,      permission: "admin.documents.read" },
  { to: "/admin/cameras",       label: "Камеры",            icon: Camera,          permission: "admin.cameras.read" },
  { to: "/admin/messages",      label: "Сообщения",         icon: MessageSquare,   permission: "admin.messages.read" },
  { to: "/admin/payments",      label: "Оплаты",            icon: CreditCard,      permission: "admin.payments.read" },
  { to: "/admin/acceptances",   label: "Приёмка",           icon: ClipboardCheck,  permission: "admin.acceptances.read" },
  { to: "/admin/services",      label: "Услуги",            icon: Briefcase,       permission: "admin.services.read" },
  { to: "/admin/prices",        label: "Цены",              icon: Tag,             permission: "admin.prices.read" },
  { to: "/admin/calculator",    label: "Калькулятор",       icon: CalcIcon,        permission: "admin.calculator.read" },
  { to: "/admin/pages",         label: "Страницы",          icon: FileEdit,        permission: "admin.pages.read" },
  { to: "/admin/media",         label: "Медиатека",         icon: Images,          permission: "admin.media.read" },
  { to: "/admin/portfolio",     label: "Портфолио",         icon: ImageIcon,       permission: "admin.portfolio.read" },
  { to: "/admin/reviews",       label: "Отзывы",            icon: Star,            permission: "admin.reviews.read" },
  { to: "/admin/faq",           label: "FAQ",               icon: HelpCircle,      permission: "admin.faq.read" },
  { to: "/admin/seo",           label: "SEO",               icon: Globe,           permission: "admin.seo.read" },
  { to: "/admin/legal",         label: "Юридические",       icon: Scale,           permission: "admin.legal.read" },
  { to: "/admin/employees",     label: "Сотрудники",        icon: UserCog,         permission: "admin.employees.read" },
  { to: "/admin/notifications", label: "Уведомления",       icon: Bell,            permission: "admin.notifications.read" },
  { to: "/admin/settings",      label: "Настройки",         icon: Settings,        permission: "admin.settings.read" },
  { to: "/admin/audit",         label: "Журнал аудита",     icon: History,         permission: "admin.audit.read" },
  { to: "/admin/system",        label: "Состояние системы", icon: Activity,        permission: "admin.system.read" },
];

export const ADMIN_NAV_ITEMS = NAV_ITEMS;

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Администратор",
  project_manager: "Менеджер проектов",
  content_manager: "Контент-менеджер",
  accountant: "Бухгалтер",
  support: "Поддержка",
  viewer: "Наблюдатель",
  client: "Клиент",
};

interface Props {
  admin: AdminContext;
  title: string;
  breadcrumbs: BreadcrumbItem[];
  children: React.ReactNode;
}

export function AdminLayout({ admin, title, breadcrumbs, children }: Props) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visibleItems = NAV_ITEMS.filter((it) => admin.permissions.includes(it.permission));

  async function onLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* Sidebar — desktop only */}
      <aside
        aria-label="Навигация по административной панели"
        className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col"
      >
        <div className="border-b border-border px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Админ-панель</p>
          <p className="mt-1 font-display text-base font-semibold">Шадов и партнёры</p>
        </div>
        <nav aria-label="Основное меню" className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={[
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon aria-hidden className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div className="min-w-0">
            <Breadcrumbs items={breadcrumbs} />
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {admin.email}
            </span>
            {admin.role ? (
              <span className="rounded border border-border bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider">
                {ROLE_LABELS[admin.role] ?? admin.role}
              </span>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ExternalLink aria-hidden className="mr-1 h-3.5 w-3.5" />
                Сайт
              </Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onLogout}>
              <LogOut aria-hidden className="mr-1 h-3.5 w-3.5" />
              Выйти
            </Button>
          </div>
        </header>

        {/* Mobile nav strip */}
        <nav
          aria-label="Мобильная навигация админ-панели"
          className="border-b border-border bg-card md:hidden"
        >
          <div className="flex gap-1 overflow-x-auto px-2 py-2">
            {visibleItems.slice(0, 12).map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={[
                    "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs",
                    active ? "bg-primary/10 font-medium" : "text-muted-foreground",
                  ].join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon aria-hidden className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <main id="main" className="flex-1 overflow-x-hidden bg-background">
          <div className="container-page py-6 md:py-8">
            <h1 className="font-display text-2xl font-semibold md:text-3xl">{title}</h1>
            <div className="mt-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function AdminForbidden({ email }: { email: string | null }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
        <ShieldAlert aria-hidden className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-3 font-display text-xl font-semibold">Недостаточно прав</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Учётная запись {email ?? "(без email)"} не имеет административных прав.
          Если это ошибка — обратитесь к super_admin.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/">На сайт</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/client">В личный кабинет</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}