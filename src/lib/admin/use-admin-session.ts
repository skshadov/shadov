/**
 * Stage 5.1 — клиентский хук состояния админ-сессии.
 * Гейтинг UX-уровня; реальная защита — RLS + серверные функции с middleware.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AdminContext } from "./api.functions";

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
      const { data, error: userError } = await supabase.auth.getUser();
      if (!active) return;
      if (userError || !data.user) {
        setState({ status: "anonymous" });
        return;
      }
      const email = data.user.email ?? null;
      try {
        // Проверяем доступ через защищённые RPC базы под текущей сессией.
        // Это устраняет ложный forbidden при сбое транспорта serverFn;
        // реальные операции админки всё равно повторно защищены middleware и RLS.
        const [adminResult, permissionsResult, roleResult] = await Promise.all([
          supabase.rpc("is_admin_user"),
          supabase.rpc("get_my_admin_permissions"),
          supabase.rpc("get_my_primary_role"),
        ]);
        if (adminResult.error || permissionsResult.error || roleResult.error) {
          throw adminResult.error ?? permissionsResult.error ?? roleResult.error;
        }
        if (!active) return;
        if (!adminResult.data) {
          setState({ status: "forbidden", email, retry: () => setAttempt((n) => n + 1) });
          return;
        }
        const permissions = Array.isArray(permissionsResult.data)
          ? permissionsResult.data.map((row) => row.permission_key)
          : [];
        setState({
          status: "authenticated",
          admin: {
            userId: data.user.id,
            email,
            role: roleResult.data ?? null,
            permissions,
          },
        });
      } catch {
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