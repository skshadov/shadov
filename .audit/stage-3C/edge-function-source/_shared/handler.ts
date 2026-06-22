/**
 * Stage 3B — общий handler для submit-estimate-request и submit-estimate-request-test.
 * Конструктор принимает конфиг (флаги, allowed origins, salt, имена секретов),
 * чтобы prod и test варианты делили одну реализацию без копипасты.
 */
// deno-lint-ignore-file no-explicit-any
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  SERVICE_SLUG_ALLOWLIST,
  CALCULATOR_MODE_ALLOWLIST,
  PRICE_ID_UNITS,
  PRICE_VERSION_ALLOWED,
} from "./allowlists.ts";

export interface HandlerConfig {
  name: string;
  testMode: boolean;
}

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_MESSAGE = 2000;
const MAX_NAME = 80;
const MAX_PHONE = 40;
const MAX_EMAIL = 254;
const MAX_CONSENT_VER = 40;
const MAX_PRICE_VERSION = 40;
const SNAPSHOT_MAX_BYTES = 50_000;
const SALT_MIN_LENGTH = 32;

function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
function isEmail(v: string): boolean { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); }
function isPhone(v: string): boolean { return /^(\+7|7|8)?[\s\-()]*\d{3}[\s\-)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}$/.test(v); }
async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function generateRequestNumber(): string {
  const d = new Date();
  const ym = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const rand = new Uint8Array(4);
  crypto.getRandomValues(rand);
  const tail = Array.from(rand).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 6).toUpperCase();
  return `SH-${ym}-${tail}`;
}

/** Snapshot — недоверенный клиентский ввод. Whitelist полей, явные коды ошибок. */
function validateSnapshot(raw: unknown): { ok: true; value: any } | { ok: false; code: string } {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  if (typeof raw !== "object" || Array.isArray(raw)) return { ok: false, code: "snapshot_invalid_shape" };
  const src = raw as Record<string, unknown>;
  const ALLOWED = new Set(["mode","items","totals","warnings","priceVersion","clientCalculated"]);
  for (const k of Object.keys(src)) if (!ALLOWED.has(k)) return { ok: false, code: "snapshot_unknown_field" };
  // clientCalculated forced server-side, ignoring user value
  const out: any = { clientCalculated: true };
  if (src.mode !== undefined) {
    if (typeof src.mode !== "string" || !CALCULATOR_MODE_ALLOWLIST.has(src.mode)) return { ok: false, code: "snapshot_bad_mode" };
    out.mode = src.mode;
  }
  if (src.priceVersion !== undefined) {
    if (typeof src.priceVersion !== "string" || src.priceVersion.length > MAX_PRICE_VERSION) return { ok: false, code: "snapshot_bad_price_version" };
    out.priceVersion = src.priceVersion;
  }
  if (src.items !== undefined) {
    if (!Array.isArray(src.items) || src.items.length > 100) return { ok: false, code: "snapshot_bad_items" };
    const items: any[] = [];
    for (const it of src.items) {
      if (!it || typeof it !== "object") return { ok: false, code: "snapshot_item_shape" };
      const item = it as Record<string, unknown>;
      const id = item.id, qty = item.quantity, unit = item.unit;
      if (typeof id !== "string" || !(id in PRICE_ID_UNITS)) return { ok: false, code: "snapshot_unknown_price_id" };
      if (typeof qty !== "number" || !Number.isFinite(qty) || qty < 0 || qty > 1_000_000) return { ok: false, code: "snapshot_bad_quantity" };
      const expectedUnit = PRICE_ID_UNITS[id];
      if (typeof unit !== "string" || unit !== expectedUnit) return { ok: false, code: "snapshot_unit_mismatch" };
      items.push({ id, quantity: qty, unit });
    }
    out.items = items;
  }
  if (src.totals !== undefined) {
    if (!src.totals || typeof src.totals !== "object" || Array.isArray(src.totals)) return { ok: false, code: "snapshot_bad_totals" };
    const totals: Record<string, number> = {};
    for (const [k, v] of Object.entries(src.totals as Record<string, unknown>)) {
      if (typeof k !== "string" || k.length > 40 || !/^[a-zA-Z_]+$/.test(k)) return { ok: false, code: "snapshot_totals_key" };
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1e12) return { ok: false, code: "snapshot_totals_value" };
      totals[k] = v;
    }
    out.totals = totals;
  }
  if (src.warnings !== undefined) {
    if (!Array.isArray(src.warnings) || src.warnings.length > 20) return { ok: false, code: "snapshot_bad_warnings" };
    const warnings: string[] = [];
    for (const w of src.warnings) {
      if (typeof w !== "string" || w.length > 200) return { ok: false, code: "snapshot_bad_warning_text" };
      warnings.push(w);
    }
    out.warnings = warnings;
  }
  if (JSON.stringify(out).length > SNAPSHOT_MAX_BYTES) return { ok: false, code: "snapshot_too_large" };
  return { ok: true, value: out };
}

function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  const len = Math.max(aa.length, bb.length);
  let diff = aa.length ^ bb.length;
  for (let i = 0; i < len; i++) diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

function getTrustedClientKey(req: Request): { source: "cf_connecting_ip" | "shared_fallback"; material: string } {
  if ((Deno.env.get("TRUST_CF_CONNECTING_IP") ?? "false").toLowerCase() === "true") {
    const cf = req.headers.get("cf-connecting-ip");
    if (cf && /^[0-9a-fA-F.:]+$/.test(cf) && cf.length <= 64) return { source: "cf_connecting_ip", material: cf };
  }
  return { source: "shared_fallback", material: "edge-shared-fallback" };
}

export function createHandler(config: HandlerConfig) {
  const PUBLIC_DATA_COLLECTION_ENABLED =
    (Deno.env.get(config.testMode ? "TEST_MODE_ENABLED" : "PUBLIC_DATA_COLLECTION_ENABLED") ?? "false").toLowerCase() === "true";
  const ALLOWED_ORIGINS_RAW = Deno.env.get(config.testMode ? "TEST_ALLOWED_ORIGINS" : "ALLOWED_ORIGINS") ?? "";
  const ALLOWED_ORIGINS = ALLOWED_ORIGINS_RAW.split(",").map((s) => s.trim()).filter(Boolean);
  const RATE_LIMIT_SALT = Deno.env.get(config.testMode ? "TEST_RATE_LIMIT_SALT" : "RATE_LIMIT_SALT") ?? "";
  const TEST_RUN_TOKEN = Deno.env.get("TEST_RUN_TOKEN") ?? "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  function corsHeadersFor(originAllowed: string | null): HeadersInit {
    const h: Record<string,string> = {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, X-Test-Run-Token",
      "Access-Control-Max-Age": "86400",
      "Content-Type": "application/json",
      "Vary": "Origin",
    };
    if (originAllowed) h["Access-Control-Allow-Origin"] = originAllowed;
    return h;
  }
  function reject(status: number, code: string, originAllowed: string | null): Response {
    return new Response(JSON.stringify({ success: false, code }), { status, headers: corsHeadersFor(originAllowed) });
  }
  function accept(status: number, body: unknown, originAllowed: string | null): Response {
    return new Response(JSON.stringify(body), { status, headers: corsHeadersFor(originAllowed) });
  }

  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get("origin");
    const originAllowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : null;

    if (config.testMode) {
      if (TEST_RUN_TOKEN.length < SALT_MIN_LENGTH) return reject(500, "server_not_configured", originAllowed);
      const supplied = req.headers.get("x-test-run-token") ?? "";
      if (!constantTimeEqual(supplied, TEST_RUN_TOKEN)) return reject(403, "test_access_denied", originAllowed);
    }

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeadersFor(originAllowed) });
    if (req.method !== "POST") return reject(405, "method_not_allowed", originAllowed);
    if (!PUBLIC_DATA_COLLECTION_ENABLED) return reject(503, "public_collection_disabled", originAllowed);
    if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes("*")) return reject(500, "server_not_configured", null);
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(JSON.stringify({ success: false, code: "origin_not_allowed" }),
        { status: 403, headers: { "Content-Type": "application/json" } });
    }
    if (!origin && !config.testMode) return reject(403, "origin_not_allowed", null);
    if (RATE_LIMIT_SALT.length < SALT_MIN_LENGTH || !SUPABASE_URL || !SERVICE_ROLE) return reject(500, "server_not_configured", originAllowed);

    let body: any;
    try { body = await req.json(); } catch { return reject(400, "invalid_json", originAllowed); }

    if (body.website && String(body.website).trim().length > 0) {
      return accept(200, { success: true, requestNumber: generateRequestNumber() }, originAllowed);
    }

    if (!isUuid(body.submission_id)) return reject(400, "bad_submission_id", originAllowed);
    if (typeof body.contact_name !== "string" || body.contact_name.trim().length < 2) return reject(400, "bad_name", originAllowed);
    if (body.contact_name.length > MAX_NAME) return reject(400, "name_too_long", originAllowed);
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!phone && !email) return reject(400, "no_contact", originAllowed);
    if (phone && phone.length > MAX_PHONE) return reject(400, "phone_too_long", originAllowed);
    if (email && email.length > MAX_EMAIL) return reject(400, "email_too_long", originAllowed);
    if (phone && !isPhone(phone)) return reject(400, "bad_phone", originAllowed);
    if (email && !isEmail(email)) return reject(400, "bad_email", originAllowed);
    if (body.consent_accepted !== true) return reject(400, "no_consent", originAllowed);
    if (typeof body.consent_version !== "string" || body.consent_version.length === 0) return reject(400, "no_consent_version", originAllowed);
    if (body.consent_version.length > MAX_CONSENT_VER) return reject(400, "consent_version_too_long", originAllowed);
    if (typeof body.source_path !== "string" || !body.source_path.startsWith("/")) return reject(400, "bad_source", originAllowed);
    if (body.source_path.length > 200) return reject(400, "source_too_long", originAllowed);

    let serviceSlug: string | null = null;
    if (body.service_slug !== undefined && body.service_slug !== null) {
      if (typeof body.service_slug !== "string" || !SERVICE_SLUG_ALLOWLIST.has(body.service_slug)) return reject(400, "unknown_service", originAllowed);
      serviceSlug = body.service_slug;
    }
    let calcMode: string | null = null;
    if (body.calculator_mode !== undefined && body.calculator_mode !== null) {
      if (typeof body.calculator_mode !== "string" || !CALCULATOR_MODE_ALLOWLIST.has(body.calculator_mode)) return reject(400, "invalid_calculator_mode", originAllowed);
      calcMode = body.calculator_mode;
    }

    if (body.message !== undefined && body.message !== null) {
      if (typeof body.message !== "string") return reject(400, "bad_message", originAllowed);
      if (body.message.length > MAX_MESSAGE) return reject(400, "message_too_long", originAllowed);
    }
    if (body.price_version !== undefined && body.price_version !== null) {
      if (typeof body.price_version !== "string" || body.price_version.length > MAX_PRICE_VERSION) return reject(400, "bad_price_version", originAllowed);
      if (body.price_version !== PRICE_VERSION_ALLOWED) return reject(400, "unsupported_price_version", originAllowed);
    }

    const snap = validateSnapshot(body.calculator_snapshot);
    if (!snap.ok) return reject(400, snap.code, originAllowed);

    if (config.testMode && body.stage3c_fault_injection === true) {
      const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
      await supabase.rpc("stage3c_fault_injection_submission", {
        _payload: { submission_id: body.submission_id, request_number: generateRequestNumber(), user_id: null },
      });
      return reject(500, "fault_injection_failed", originAllowed);
    }

    const rlKey = getTrustedClientKey(req);
    const keyHash = await sha256(`${rlKey.material}${RATE_LIMIT_SALT}`);
    const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    const { data: rl, error: rlErr } = await supabase.rpc("consume_submission_rate_limit", {
      _key_hash: keyHash, _window_ms: RATE_LIMIT_WINDOW_MS, _max_attempts: RATE_LIMIT_MAX,
    });
    if (rlErr) return reject(500, "rate_limit_error", originAllowed);
    const rlRow = Array.isArray(rl) ? rl[0] : rl;
    if (!rlRow?.allowed) {
      const retry = rlRow?.retry_after_seconds ?? 60;
      return new Response(JSON.stringify({ success: false, code: "rate_limited" }),
        { status: 429, headers: { ...corsHeadersFor(originAllowed), "Retry-After": String(retry) } });
    }

    // user_id only from verified JWT — body.user_id ignored
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization") ?? "";
    if (authHeader.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.slice(7);
      const { data } = await supabase.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    const consentAcceptedAt = new Date().toISOString();
    let requestNumber = generateRequestNumber();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase.rpc("create_estimate_request_transaction", {
        _payload: {
          submission_id: body.submission_id,
          request_number: requestNumber,
          user_id: userId,
          source_path: body.source_path,
          service_slug: serviceSlug,
          calculator_mode: calcMode,
          contact_name: body.contact_name.trim(),
          phone: phone || null,
          email: email || null,
          message: body.message ?? null,
          calculator_snapshot: snap.value,
          price_version: body.price_version ?? null,
          consent_version: body.consent_version,
          consent_accepted_at: consentAcceptedAt,
        },
      });
      if (error) {
        if (typeof error.message === "string" && /request_number/.test(error.message)) {
          requestNumber = generateRequestNumber();
          continue;
        }
        return reject(500, "store_failed", originAllowed);
      }
      const row = Array.isArray(data) ? data[0] : data;
      return accept(200, { success: true, requestNumber: row?.request_number ?? requestNumber }, originAllowed);
    }
    return reject(500, "store_failed", originAllowed);
  };
}