import { useEffect, useRef, useState } from "react";
import type { AcceptanceRow } from "@/lib/client-portal/api";
import { respondToAcceptance } from "@/lib/client-portal/api";

interface Props { acceptance: AcceptanceRow; onClose: () => void; onResolved: () => void | Promise<void> }

export function AcceptanceDialog({ acceptance, onClose, onResolved }: Props) {
  const [decision, setDecision] = useState<"accepted" | "changes_requested" | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    function focusables(): HTMLElement[] {
      const root = ref.current;
      if (!root) return [];
      return Array.from(root.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
      ));
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) { e.preventDefault(); ref.current?.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !ref.current?.contains(active))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault(); first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);
  async function submit() {
    if (!decision || busy) return;
    if (decision === "changes_requested" && comment.trim().length < 10) {
      setError("Комментарий должен содержать минимум 10 символов."); return;
    }
    setBusy(true); setError(null);
    try {
      await respondToAcceptance(acceptance.id, decision, decision === "changes_requested" ? comment : null);
      await onResolved();
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "";
      if (msg.includes("already_resolved")) setError("Это решение уже зафиксировано.");
      else if (msg.includes("forbidden")) setError("У вас нет доступа к этому проекту.");
      else if (msg.includes("comment_required")) setError("Комментарий обязателен.");
      else setError("Не удалось зафиксировать решение. Попробуйте ещё раз.");
      setBusy(false);
    }
  }
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="acc-title" className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div ref={ref} tabIndex={-1} className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-lg">
        <h2 id="acc-title" className="font-display text-lg font-semibold">Приёмка этапа</h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Подтверждение в личном кабинете фиксирует ваше решение в системе. Оно не заменяет подписанный акт или иной документ, если письменное оформление предусмотрено договором.
        </p>
        <div className="mt-4 grid gap-2">
          <label className="flex items-start gap-2 text-sm">
            <input type="radio" name="decision" checked={decision === "accepted"} onChange={() => setDecision("accepted")} />
            <span>Принять этап</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="radio" name="decision" checked={decision === "changes_requested"} onChange={() => setDecision("changes_requested")} />
            <span>Есть замечания</span>
          </label>
        </div>
        {decision === "changes_requested" ? (
          <div className="mt-3">
            <label htmlFor="acc-comment" className="text-sm font-medium">Комментарий (минимум 10 символов)</label>
            <textarea id="acc-comment" value={comment} maxLength={4000} onChange={(e) => setComment(e.target.value)}
              className="mt-1 min-h-24 w-full rounded-md border border-border bg-background p-2 text-sm" />
            <p className="mt-1 text-xs text-muted-foreground">{comment.length} / 4000</p>
          </div>
        ) : null}
        {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="min-h-11 rounded-md border border-border px-3 text-sm" onClick={onClose}>Отмена</button>
          <button type="button" className="min-h-11 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50" onClick={submit} disabled={!decision || busy}>
            {busy ? "Отправляем…" : "Подтвердить"}
          </button>
        </div>
      </div>
    </div>
  );
}