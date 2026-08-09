/**
 * Stage 5.1 — клиентский хук состояния админ-сессии.
 * Гейтинг UX-уровня; реальная защита — RLS + серверные функции с middleware.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyAdminContext, type AdminContext } from "./api.functions";

export type AdminSessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "forbidden"; email: string | null; retry: () => void }
  | { status: "authenticated"; admin: AdminContext };

export function useAdminSession(): AdminSessionState {
  const [state, setState] = useState<AdminSessionState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function evaluate() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session?.user) {
        setState({ status: "anonymous" });
        return;
      }
      const email = data.session.user.email ?? null;
      try {
        let admin = await getMyAdminContext();
        if (!admin) {
          // Возможен устаревший JWT (выдан до назначения роли) — одна попытка
          // обновления сессии, без повторных ротаций refresh-токена.
          const refreshed = await supabase.auth.refreshSession().catch(() => null);
          if (!active) return;
          if (refreshed?.data?.session) admin = await getMyAdminContext();
        }
        if (!active) return;
        if (!admin) {
          setState({ status: "forbidden", email, retry: () => setAttempt((n) => n + 1) });
          return;
        }
        setState({ status: "authenticated", admin });
      } catch {
        // Сетевая ошибка/401 — пробуем один раз обновить токен и повторить.
        const refreshed = await supabase.auth.refreshSession().catch(() => null);
        if (!active) return;
        if (refreshed?.data?.session) {
          try {
            const admin = await getMyAdminContext();
            if (!active) return;
            if (admin) {
              setState({ status: "authenticated", admin });
              return;
            }
          } catch {
            /* ниже — forbidden */
          }
        }
        if (!active) return;
        setState({ status: "forbidden", email, retry: () => setAttempt((n) => n + 1) });
      }
    }

    setState({ status: "loading" });
    evaluate();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setState({ status: "anonymous" });
      if (event === "SIGNED_IN" || event === "USER_UPDATED") evaluate();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [attempt]);

  return state;
}

export function hasPermission(state: AdminSessionState, key: string): boolean {
  return state.status === "authenticated" && state.admin.permissions.includes(key);
}