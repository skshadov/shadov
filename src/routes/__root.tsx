import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex flex-1 items-center justify-center surface-light px-4 py-20">
        <div className="max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Ошибка 404</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Страница не найдена
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Возможно, адрес изменился или страница была удалена. Перейдите на главную страницу либо выберите нужное направление работ.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              На главную
            </Link>
            <Link
              to="/stroitelstvo"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Посмотреть услуги
            </Link>
            <Link
              to="/kalkulyator-stoimosti"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Получить расчёт
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0B1F18" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Шадов и партнёры" },
      { property: "og:locale", content: "ru_RU" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Шадов и партнёры — строительство и ремонт под ключ" },
      { property: "og:title", content: "Шадов и партнёры — строительство и ремонт под ключ" },
      { name: "twitter:title", content: "Шадов и партнёры — строительство и ремонт под ключ" },
      { name: "description", content: "Строительство домов, ремонт квартир и инженерные системы под ключ. Прозрачные сметы, фиксированный срок, гарантия по договору." },
      { property: "og:description", content: "Строительство домов, ремонт квартир и инженерные системы под ключ. Прозрачные сметы, фиксированный срок, гарантия по договору." },
      { name: "twitter:description", content: "Строительство домов, ремонт квартир и инженерные системы под ключ. Прозрачные сметы, фиксированный срок, гарантия по договору." },
      { property: "og:url", content: "https://shadov.pro" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap",
      },
    ],
    scripts: [
      {
        children: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=110098177', 'ym');ym(110098177, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});`,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/110098177" style={{ position: "absolute", left: "-9999px" }} alt="" />
          </div>
        </noscript>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
