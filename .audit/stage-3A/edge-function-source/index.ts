/**
 * Edge Function submit-estimate-request — единственный путь публичной отправки
 * заявки. Используется service_role внутри функции, RLS не нарушается, потому
 * что сервер сам нормализует данные и проверяет согласие, honeypot, rate-limit
 * и feature flag PUBLIC_DATA_COLLECTION_ENABLED.
 *
 * Контракт ответа: { success: true, requestNumber } или { success: false, code }.
 * Внутренний UUID заявки наружу не отдаётся.
 */
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "*")
  .split(",").map((s) => s.trim()).filter(Boolean);
const RATE_LIMIT_SALT = Deno.env.get("RATE_LIMIT_SALT") ?? "stage-3-default-salt";
const PUBLIC_DATA_COLLECTION_ENABLED =
  (Deno.env.get("PUBLIC_DATA_COLLECTION_ENABLED") ?? "false").toLowerCase() === "true";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function corsHeaders(origin: string | null): HeadersInit {
  const allowed =
    ALLOWED_ORIGINS.includes("*") ||
    (origin && ALLOWED_ORIGINS.includes(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? (origin ?? "*") : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
  };
}

function json(status: number, body: unknown, origin: string | null): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function isEmail(v: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && v.length <= 254;
}

function isPhone(v: string): boolean {
  return /^(\+7|7|8)?[\s\-()]*\d{3}[\s\-)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}$/.test(v);
}

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

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json(405, { success: false, code: "method_not_allowed" }, origin);

  if (!PUBLIC_DATA_COLLECTION_ENABLED) {
    return json(503, { success: false, code: "public_collection_disabled" }, origin);
  }

  let body: any;
  try { body = await req.json(); } catch { return json(400, { success: false, code: "invalid_json" }, origin); }

  // Honeypot — поле website должно быть пустым
  if (body.website && String(body.website).trim().length > 0) {
    return json(200, { success: true, requestNumber: generateRequestNumber() }, origin);
  }

  if (!isUuid(body.submission_id)) return json(400, { success: false, code: "bad_submission_id" }, origin);
  if (typeof body.contact_name !== "string" || body.contact_name.trim().length < 2) {
    return json(400, { success: false, code: "bad_name" }, origin);
  }
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!phone && !email) return json(400, { success: false, code: "no_contact" }, origin);
  if (phone && !isPhone(phone)) return json(400, { success: false, code: "bad_phone" }, origin);
  if (email && !isEmail(email)) return json(400, { success: false, code: "bad_email" }, origin);
  if (body.consent_accepted !== true) return json(400, { success: false, code: "no_consent" }, origin);
  if (typeof body.consent_version !== "string" || body.consent_version.length === 0) {
    return json(400, { success: false, code: "no_consent_version" }, origin);
  }
  if (typeof body.source_path !== "string" || !body.source_path.startsWith("/")) {
    return json(400, { success: false, code: "bad_source" }, origin);
  }
  const message = typeof body.message === "string" ? body.message.slice(0, 2000) : null;
  const snapshotRaw = body.calculator_snapshot ?? null;
  const snapshotJson = snapshotRaw ? JSON.stringify(snapshotRaw) : null;
  if (snapshotJson && snapshotJson.length > 50_000) {
    return json(400, { success: false, code: "snapshot_too_large" }, origin);
  }

  // Rate limit
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const keyHash = await sha256(`${ip}|${RATE_LIMIT_SALT}`);
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const windowStart = new Date(Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS).toISOString();
  const expiresAt = new Date(Date.now() + RATE_LIMIT_WINDOW_MS + 24 * 3600 * 1000).toISOString();
  const { data: rl } = await supabase
    .from("submission_rate_limits")
    .select("attempt_count")
    .eq("key_hash", keyHash).eq("window_started_at", windowStart).maybeSingle();
  const attempts = (rl?.attempt_count ?? 0) + 1;
  if (attempts > RATE_LIMIT_MAX) return json(429, { success: false, code: "rate_limited" }, origin);
  await supabase.from("submission_rate_limits").upsert({
    key_hash: keyHash, window_started_at: windowStart, attempt_count: attempts, expires_at: expiresAt,
  });

  // Idempotency by submission_id
  const { data: existing } = await supabase
    .from("estimate_requests").select("request_number").eq("submission_id", body.submission_id).maybeSingle();
  if (existing?.request_number) {
    return json(200, { success: true, requestNumber: existing.request_number }, origin);
  }

  // Authenticated user from JWT (optional)
  let userId: string | null = null;
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7);
    const { data } = await supabase.auth.getUser(token);
    userId = data.user?.id ?? null;
  }

  // Generate unique request number (retry a few times on collision)
  let requestNumber = generateRequestNumber();
  for (let i = 0; i < 5; i++) {
    const { data: collision } = await supabase
      .from("estimate_requests").select("id").eq("request_number", requestNumber).maybeSingle();
    if (!collision) break;
    requestNumber = generateRequestNumber();
  }

  const consentAcceptedAt = new Date().toISOString();
  const { data: inserted, error } = await supabase.from("estimate_requests").insert({
    request_number: requestNumber,
    submission_id: body.submission_id,
    user_id: userId,
    source_path: body.source_path,
    service_slug: typeof body.service_slug === "string" ? body.service_slug.slice(0, 80) : null,
    calculator_mode: typeof body.calculator_mode === "string" ? body.calculator_mode.slice(0, 40) : null,
    contact_name: body.contact_name.trim().slice(0, 80),
    phone: phone || null,
    email: email || null,
    message,
    calculator_snapshot: snapshotRaw ? { ...snapshotRaw, clientCalculated: true } : null,
    price_version: typeof body.price_version === "string" ? body.price_version.slice(0, 40) : null,
    consent_version: body.consent_version,
    consent_accepted_at: consentAcceptedAt,
    status: "new",
  }).select("id, request_number").maybeSingle();

  if (error || !inserted) {
    // race-условие: вторая попытка с тем же submission_id
    const { data: again } = await supabase
      .from("estimate_requests").select("request_number").eq("submission_id", body.submission_id).maybeSingle();
    if (again?.request_number) return json(200, { success: true, requestNumber: again.request_number }, origin);
    return json(500, { success: false, code: "store_failed" }, origin);
  }

  // Consent records
  await supabase.from("consent_records").insert([
    { request_id: inserted.id, user_id: userId, document_slug: "privacy", document_version: body.consent_version, accepted_at: consentAcceptedAt },
    { request_id: inserted.id, user_id: userId, document_slug: "personal-data-consent", document_version: body.consent_version, accepted_at: consentAcceptedAt },
  ]);

  return json(200, { success: true, requestNumber: inserted.request_number }, origin);
});