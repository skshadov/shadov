import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { isPublicAuthEnabled, getOperatorStatus } from "@/lib/operator-configuration";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Вход в личный кабинет — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Служебная страница входа в личный кабинет." },
    ],
    links: [{ rel: "canonical", href: "/login" }],
  }),
  component: Page,
});

function Page() {
  const authEnabled = isPublicAuthEnabled();
  const operator = getOperatorStatus();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUserEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authEnabled) return;
    setStatus("sending");
    try {
      await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined },
      });
      setStatus("sent");
    } catch {
      setStatus("sent"); // не раскрываем существование пользователя
    }
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
              Для входа достаточно ввести email — мы пришлём ссылку. Отдельная регистрация не требуется.
            </p>

            {!authEnabled ? (
              <div className="mt-6 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
                Публичный вход временно отключён. Инфраструктура авторизации подключена, но публичный сбор данных активируется после заполнения реквизитов оператора{operator.missingRequiredFields.length ? ` (отсутствуют: ${operator.missingRequiredFields.join(", ")})` : ""}.
              </div>
            ) : userEmail ? (
              <div className="mt-6 space-y-4">
                <p className="text-sm">Вы вошли как <strong>{userEmail}</strong>.</p>
                <p className="text-sm text-muted-foreground">Личный кабинет будет открыт на следующем этапе развития сайта.</p>
                <Button type="button" variant="outline" onClick={onLogout}>Выйти</Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
                <div className="grid gap-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <Button type="submit" disabled={status === "sending"} className="min-h-11">
                  {status === "sending" ? "Отправляем…" : "Получить ссылку для входа"}
                </Button>
                {status === "sent" ? (
                  <p className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                    Если адрес может быть использован для входа, инструкция будет отправлена на него.
                  </p>
                ) : null}
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
