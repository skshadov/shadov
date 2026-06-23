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
  | { status: "forbidden"; email: string | null }
  | { status: "authenticated"; admin: AdminContext };

export function useAdminSession(): AdminSessionState {
  const [state, setState] = useState<AdminSessionState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function evaluate() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session?.user) {
        setState({ status: "anonymous" });
        return;
      }
      try {
        const admin = await getMyAdminContext();
        if (!active) return;
        if (!admin) {
          setState({ status: "forbidden", email: data.session.user.email ?? null });
          return;
        }
        setState({ status: "authenticated", admin });
      } catch {
        if (!active) return;
        setState({ status: "forbidden", email: data.session.user.email ?? null });
      }
    }

    evaluate();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setState({ status: "anonymous" });
      if (event === "SIGNED_IN" || event === "USER_UPDATED") evaluate();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export function hasPermission(state: AdminSessionState, key: string): boolean {
  return state.status === "authenticated" && state.admin.permissions.includes(key);
}