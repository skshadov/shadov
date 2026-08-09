/**
 * Устойчивый вариант requireSupabaseAuth: если серверные переменные окружения
 * (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY) не проброшены в деплой, берём
 * значения, вшитые в бандл на этапе сборки (VITE_*). Логика проверки токена
 * идентична сгенерированному middleware.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const requireAdminAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const url =
    process.env['SUPABASE_URL'] ||
    (import.meta as any).env?.VITE_SUPABASE_URL;
  const key =
    process.env['SUPABASE_PUBLISHABLE_KEY'] ||
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) throw new Error("Supabase configuration is unavailable on the server");

  const request = getRequest();
  const authHeader = request?.headers?.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const token = authHeader.slice(7);
  if (!token) throw new Error("Unauthorized");

  const supabase = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) throw new Error("Unauthorized");

  return next({ context: { supabase, userId: data.claims.sub as string, claims: data.claims } });
});
