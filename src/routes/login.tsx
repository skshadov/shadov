import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { safeReturnTo } from "@/lib/client-portal/safe-return-to";

type Search = { returnTo?: string };

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Вход в личный кабинет — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Служебная страница входа в личный кабинет." },
    ],
    links: [{ rel: "canonical", href: "/login" }],
  }),
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => ({
    returnTo: typeof s.returnTo === "string" ? s.returnTo : undefined,
  }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" }) as Search;
  const returnTo = safeReturnTo(search.returnTo);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUserEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
      if (session?.user) navigate({ to: returnTo, replace: true });
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [navigate, returnTo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError("Не удалось войти. Проверьте email и пароль.");
      setBusy(false);
      return;
    }
    navigate({ to: returnTo, replace: true });
  }

  async function onLogout() {
    await supabase.auth.signOut();
    setUserEmail(null);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="surface-light flex-1">
        <div className="container-page py-12 md:py-20">
          <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Личный кабинет" }, { label: "Вход" }]} />
          <div className="mx-auto mt-6 max-w-md rounded-xl border border-border bg-card p-6 md:p-8">
            <h1 className="font-display text-2xl font-semibold md:text-3xl">Вход для клиентов</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Учётные записи создаются администратором. Самостоятельная регистрация на сайте сейчас недоступна.
            </p>
            {userEmail ? (
              <div className="mt-6 space-y-4">
                <p className="text-sm">Вы вошли как <strong>{userEmail}</strong>.</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild><Link to={returnTo}>Перейти в кабинет</Link></Button>
                  <Button type="button" variant="outline" onClick={onLogout}>Выйти</Button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
                <div className="grid gap-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="login-password">Пароль</Label>
                  <Input id="login-password" type="password" autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
                <Button type="submit" disabled={busy} className="min-h-11">
                  {busy ? "Входим…" : "Войти"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Продолжая, вы соглашаетесь с{" "}
                  <Link to="/privacy" className="text-primary underline-offset-2 hover:underline">политикой конфиденциальности</Link>{" "}
                  и{" "}
                  <Link to="/personal-data-consent" className="text-primary underline-offset-2 hover:underline">условиями обработки персональных данных</Link>.
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
