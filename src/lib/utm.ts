/**
 * UTM-метки: захватываем параметры из URL первого визита,
 * храним в sessionStorage и прикладываем к заявкам.
 *
 * Захват один раз за сессию: если пользователь уйдёт на другую страницу
 * без меток, ранее сохранённые не теряются. Новые UTM при последующих
 * заходах в той же сессии перезаписывают значения — это поведение
 * Яндекс.Метрики и Директа.
 */

const STORAGE_KEY = "shadov:utm";

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "yclid",
  "gclid",
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];
export type UtmData = Partial<Record<UtmKey, string>>;

/** Считываем UTM-метки из текущего URL и сохраняем в sessionStorage. */
export function captureUtmFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const incoming: UtmData = {};
    for (const key of UTM_KEYS) {
      const v = params.get(key);
      if (v && v.length <= 200) incoming[key] = v;
    }
    if (Object.keys(incoming).length === 0) return;
    const existing = readUtm();
    const merged = { ...existing, ...incoming };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* sessionStorage может быть недоступен — игнорируем */
  }
}

export function readUtm(): UtmData {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UtmData;
  } catch {
    return {};
  }
}

/** Формирует короткий текстовый блок с UTM для добавления в message. */
export function formatUtmForMessage(utm: UtmData): string {
  const entries = Object.entries(utm).filter(([, v]) => Boolean(v));
  if (entries.length === 0) return "";
  const lines = entries.map(([k, v]) => `${k}=${v}`).join("\n");
  return `\n\n— Источник перехода —\n${lines}`;
}