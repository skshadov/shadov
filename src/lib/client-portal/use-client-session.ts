/**
 * Этап 4 — клиентский guard через штатный Supabase auth-state.
 * Не дублирует RLS — это лишь UX-перенаправление.
 */
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type ClientSessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; userId: string; email: string | null };

export function useClientSession(): ClientSessionState {
  const [state, setState] = useState<ClientSessionState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;
    function applySession(session: Session | null) {
      if (!mounted) return;
      if (!session?.user) {
        setState({ status: "anonymous" });
        return;
      }
      setState({ status: "authenticated", userId: session.user.id, email: session.user.email ?? null });
    }
    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => applySession(session));
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return state;
}