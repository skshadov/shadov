/**
 * Stage 5.3.1 — серверные функции реквизитов оператора (singleton).
 *
 * - getPublicCompanyRequisites: безопасное чтение опубликованных полей
 *   (server publishable client + RLS-политика `published = true`).
 *   Используется публичными страницами (`/requisites`, футер).
 * - getCompanySettings: полная запись для админ-панели (требует `admin.settings.read`).
 * - updateCompanySettings: апсёрт singleton-строки (требует `admin.settings.write`).
 *   Все изменения логируются в `admin_audit_log`.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["company_settings"]["Row"];
type Update = Database["public"]["Tables"]["company_settings"]["Update"];

export type CompanySettings = Row;

export interface PublicCompanyRequisites {
  legal_name: string;
  brand_name: string;
  brand_full: string;
  domain: string;
  inn: string;
  kpp: string;
  ogrn: string;
  legal_address: string;
  office_address: string;
  phone: string;
  phone_e164: string;
  email: string;
  telegram: string;
  whatsapp: string;
  working_hours: string;
  sro_name: string;
  sro_number: string;
  sro_registry_url: string;
  bank_name: string;
  bank_bik: string;
  bank_account: string;
  bank_corr_account: string;
}

const PUBLIC_FIELDS =
  "legal_name, brand_name, brand_full, domain, inn, kpp, ogrn, legal_address, office_address, phone, phone_e164, email, telegram, whatsapp, working_hours, sro_name, sro_number, sro_registry_url, bank_name, bank_bik, bank_account, bank_corr_account";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePerm(context: { supabase: any }, perm: string) {
  const { data, error } = await context.supabase.rpc("has_admin_permission", { _permission: perm });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

// ───────────────────────────────────────────────────────────────────
// Public read — for /requisites, footer, etc. (no auth required)
// ───────────────────────────────────────────────────────────────────
export const getPublicCompanyRequisites = createServerFn({ method: "GET" })
  .handler(async (): Promise<PublicCompanyRequisites | null> => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return null;
    const client = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client
      .from("company_settings")
      .select(PUBLIC_FIELDS)
      .limit(1)
      .maybeSingle<PublicCompanyRequisites>();
    if (error) return null;
    return data ?? null;
  });

// ───────────────────────────────────────────────────────────────────
// Admin read
// ───────────────────────────────────────────────────────────────────
export const getCompanySettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CompanySettings | null> => {
    await ensurePerm(context, "admin.settings.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("company_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? null;
  });

// ───────────────────────────────────────────────────────────────────
// Admin update
// ───────────────────────────────────────────────────────────────────
const STRING_FIELDS: (keyof PublicCompanyRequisites)[] = [
  "legal_name", "brand_name", "brand_full", "domain", "inn", "kpp", "ogrn",
  "legal_address", "office_address", "phone", "phone_e164", "email",
  "telegram", "whatsapp", "working_hours", "sro_name", "sro_number",
  "sro_registry_url", "bank_name", "bank_bik", "bank_account", "bank_corr_account",
];

const MAX_LEN: Partial<Record<keyof PublicCompanyRequisites, number>> = {
  legal_name: 300, brand_name: 200, brand_full: 300, domain: 200,
  inn: 12, kpp: 9, ogrn: 15,
  legal_address: 500, office_address: 500,
  phone: 60, phone_e164: 20, email: 200,
  telegram: 100, whatsapp: 60, working_hours: 200,
  sro_name: 300, sro_number: 100, sro_registry_url: 500,
  bank_name: 300, bank_bik: 9, bank_account: 20, bank_corr_account: 20,
};

export interface UpdateCompanyInput extends Partial<Record<keyof PublicCompanyRequisites, string>> {
  published?: boolean;
}

export const updateCompanySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: UpdateCompanyInput) => {
    const out: Record<string, unknown> = {};
    for (const f of STRING_FIELDS) {
      const v = input?.[f];
      if (typeof v !== "string") continue;
      const trimmed = v.trim();
      const max = MAX_LEN[f] ?? 500;
      if (trimmed.length > max) throw new Error(`Поле "${f}" длиннее ${max} символов`);
      out[f] = trimmed;
    }
    if (typeof input?.published === "boolean") out.published = input.published;
    return out as Update;
  })
  .handler(async ({ data, context }): Promise<CompanySettings> => {
    await ensurePerm(context, "admin.settings.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: current, error: readErr } = await supabaseAdmin
      .from("company_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);

    let updated: CompanySettings;
    if (current) {
      const { data: upd, error: updErr } = await supabaseAdmin
        .from("company_settings")
        .update({ ...data, updated_by: context.userId })
        .eq("id", current.id)
        .select("*")
        .single();
      if (updErr) throw new Error(updErr.message);
      updated = upd;
    } else {
      const { data: ins, error: insErr } = await supabaseAdmin
        .from("company_settings")
        .insert({ ...data, updated_by: context.userId })
        .select("*")
        .single();
      if (insErr) throw new Error(insErr.message);
      updated = ins;
    }

    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "company_settings.update",
      entityType: "company_settings",
      entityId: updated.id,
      oldValue: (current ?? null) as never,
      newValue: updated as never,
    });

    return updated;
  });