/**
 * Заглушка WebSocket для серверных Supabase-клиентов.
 *
 * supabase-js создаёт RealtimeClient при вызове createClient и падает
 * в средах без нативного WebSocket (Node.js < 22, Cloudflare Workers)
 * с ошибкой «detected without native WebSocket support».
 * Realtime на сервере нам не нужен — передаём безопасную заглушку.
 */
export class NoopWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readyState = 3;
  url: string;
  binaryType = "arraybuffer";
  onopen: ((ev?: unknown) => void) | null = null;
  onclose: ((ev?: unknown) => void) | null = null;
  onerror: ((ev?: unknown) => void) | null = null;
  onmessage: ((ev?: unknown) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  send(): void {}
  close(): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
}

/** Опции realtime для серверных клиентов Supabase. */
export const serverRealtimeOptions = {
  transport: NoopWebSocket as unknown as never,
};
