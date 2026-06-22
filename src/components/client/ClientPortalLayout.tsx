/**
 * Этап 4 — общий каркас личного кабинета.
 */
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  email: string | null;
  breadcrumbs: BreadcrumbItem[];
  title: string;
  children: React.ReactNode;
}

export function ClientPortalLayout({ email, breadcrumbs, title, children }: Props) {
  const navigate = useNavigate();
  async function onLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="surface-light flex-1">
        <div className="container-page py-8 md:py-12">
          <Breadcrumbs items={breadcrumbs} className="mb-4" />
          <header className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Личный кабинет</p>
              <h1 className="font-display text-2xl font-semibold md:text-3xl">{title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {email ? <span className="text-muted-foreground">{email}</span> : null}
              <Button asChild variant="outline" size="sm">
                <Link to="/">
                  <ExternalLink aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
                  Публичный сайт
                </Link>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onLogout}>
                <LogOut aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
                Выйти
              </Button>
            </div>
          </header>
          <div className="mt-6">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}