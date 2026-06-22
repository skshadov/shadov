/**
 * Этап 4 — валидация returnTo. Разрешены только внутренние маршруты
 * /client и /client/project/<uuid>. Запрещены внешние URL, javascript:,
 * data:, протокол-относительные пути и /admin.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidReturnTo(raw: string | null | undefined): raw is string {
  if (!raw || typeof raw !== "string") return false;
  if (raw.length > 200) return false;
  if (raw.startsWith("//")) return false;
  if (!raw.startsWith("/")) return false;
  if (/^[a-z]+:/i.test(raw)) return false;
  const path = raw.split("?")[0]!.split("#")[0]!;
  if (path === "/client") return true;
  const m = /^\/client\/project\/([^/]+)$/.exec(path);
  if (m && UUID_RE.test(m[1]!)) return true;
  return false;
}

export function safeReturnTo(raw: string | null | undefined, fallback = "/client"): string {
  return isValidReturnTo(raw) ? raw : fallback;
}

export function isValidProjectId(id: string | null | undefined): id is string {
  return !!id && typeof id === "string" && UUID_RE.test(id);
}