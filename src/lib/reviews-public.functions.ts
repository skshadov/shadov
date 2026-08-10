/**
 * Публичные серверные функции для отзывов посетителей сайта:
 * простая арифметическая капча с подписью HMAC + приём отзыва на модерацию.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

export type ReviewCaptcha = { question: string; token: string };

const CAPTCHA_TTL_MS = 15 * 60 * 1000;

function secret(): string {
  return (
    process.env['RATE_LIMIT_SALT'] ||
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ||
    "shadov-review-captcha"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function ipHash(): string {
  const req = getRequest();
  const ip =
    req?.headers?.get("cf-connecting-ip") ||
    req?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return createHmac("sha256", secret()).update(`review:${ip}`).digest("hex");
}

export const getReviewCaptcha = createServerFn({ method: "GET" }).handler(
  async (): Promise<ReviewCaptcha> => {
    const a = 2 + Math.floor(Math.random() * 8);
    const b = 1 + Math.floor(Math.random() * 8);
    const answer = a + b;
    const exp = Date.now() + CAPTCHA_TTL_MS;
    const payload = `${answer}.${exp}`;
    return { question: `Сколько будет ${a} + ${b}?`, token: `${payload}.${sign(payload)}` };
  },
);

function verifyCaptcha(token: string, answer: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expected, exp, sig] = parts;
  if (!safeEqual(sig!, sign(`${expected}.${exp}`))) return false;
  if (Number(exp) < Date.now()) return false;
  return String(answer).trim() === expected;
}

const submitSchema = z.object({
  author_name: z.string().trim().min(2).max(80),
  author_role: z.string().trim().max(120).optional().or(z.literal("")),
  contact: z.string().trim().max(160).optional().or(z.literal("")),
  service_slug: z.string().trim().max(80).optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(30).max(3000),
  consent: z.literal(true),
  captcha_token: z.string().min(10).max(300),
  captcha_answer: z.string().trim().min(1).max(6),
});

export type SubmitReviewInput = z.input<typeof submitSchema>;

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    if (!verifyCaptcha(data.captcha_token, data.captcha_answer)) {
      throw new Error("captcha_failed");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rl, error: rlError } = await supabaseAdmin.rpc("consume_submission_rate_limit", {
      _key_hash: ipHash(),
      _window_ms: 60 * 60 * 1000,
      _max_attempts: 3,
    });
    if (!rlError && Array.isArray(rl) && rl[0] && rl[0].allowed === false) {
      throw new Error("rate_limited");
    }

    const { error } = await supabaseAdmin.from("portfolio_reviews").insert({
      author_name: data.author_name,
      author_role: data.author_role ? data.author_role : null,
      contact: data.contact ? data.contact : null,
      service_slug: data.service_slug ? data.service_slug : null,
      rating: data.rating,
      body: data.body,
      source: "Форма на сайте",
      is_published: false,
      moderation_status: "pending",
      submitted_at: new Date().toISOString(),
      sort_order: 0,
    } as never);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
