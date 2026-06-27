/**
 * Всплывающее окно «Заказать обратный звонок».
 * Триггеры:
 *  1) Пользователь на сайте более 60 секунд.
 *  2) Exit-intent — курсор покидает окно через верхний край (desktop).
 *  3) На мобильных — быстрый scroll-up после задержки.
 *
 * После показа/отправки сохраняем флаг в localStorage, чтобы не
 * мозолить глаза тому же посетителю в течение 24 часов.
 */
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Loader2, Phone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { CONSENT_VERSION, isPublicDataCollectionEnabled } from "@/lib/operator-configuration";
import { readUtm, formatUtmForMessage, reachMetrikaGoal } from "@/lib/utm";

const DISMISS_KEY = "shadov:callback-popup-dismissed-at";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;
const SHOW_AFTER_MS = 60_000;
const PHONE_REGEX = /^(\+7|7|8)?[\s\-(]*\d{3}[\s\-)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}$/;

function wasDismissedRecently(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function markDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function CallbackPopup() {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (wasDismissedRecently()) return;

    let shown = false;
    const show = () => {
      if (shown || wasDismissedRecently()) return;
      shown = true;
      setOpen(true);
      reachMetrikaGoal("callback_popup_shown");
    };

    const timer = window.setTimeout(show, SHOW_AFTER_MS);

    const onMouseOut = (e: MouseEvent) => {
      // Exit-intent: курсор пересекает верхнюю границу окна.
      if (e.relatedTarget) return;
      if (e.clientY > 8) return;
      show();
    };

    // На мобильных нет mouseleave — используем быстрый scroll-up + долгое нахождение.
    let lastScrollY = window.scrollY;
    let lastScrollAt = Date.now();
    const enabledScrollAfter = Date.now() + 25_000;
    const onScroll = () => {
      const now = Date.now();
      const dy = window.scrollY - lastScrollY;
      const dt = now - lastScrollAt;
      lastScrollY = window.scrollY;
      lastScrollAt = now;
      if (now < enabledScrollAfter) return;
      // быстрый рывок вверх (px/ms)
      if (dy < -40 && dt < 150) show();
    };

    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Esc → закрыть.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    markDismissed();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Укажите имя (минимум 2 символа).");
      return;
    }
    if (!PHONE_REGEX.test(phone.trim())) {
      setError("Введите корректный номер телефона.");
      return;
    }
    if (!consent) {
      setError("Необходимо согласие на обработку персональных данных.");
      return;
    }
    if (!isPublicDataCollectionEnabled()) {
      setError("Приём заявок временно недоступен. Позвоните нам напрямую, пожалуйста.");
      return;
    }

    setSubmitting(true);
    try {
      const utm = readUtm();
      const utmSuffix = formatUtmForMessage(utm);
      const pagePath = typeof window !== "undefined" ? window.location.pathname : "/";
      const message = `Запрос обратного звонка с поп-апа.\nСтраница: ${pagePath}${utmSuffix}`.slice(0, 1000);
      const submissionId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}-0000-0000-000000000000`;

      const { data, error: invokeError } = await supabase.functions.invoke("submit-estimate-request", {
        body: {
          submission_id: submissionId,
          source_path: "/popup-callback",
          service_slug: null,
          contact_name: name.trim(),
          phone: phone.trim(),
          email: null,
          message,
          consent_accepted: true,
          consent_version: CONSENT_VERSION,
          website: "",
        },
      });
      if (invokeError || !data || (data as { success?: boolean }).success !== true) {
        setError("Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.");
        return;
      }
      const requestNumber = (data as { requestNumber?: string }).requestNumber ?? "";
      reachMetrikaGoal("callback_popup_submitted");
      toast.success("Спасибо! Мы перезвоним.", {
        description: requestNumber ? `Номер заявки: ${requestNumber}` : undefined,
        duration: 8000,
      });
      markDismissed();
      setOpen(false);
      setName("");
      setPhone("");
    } catch {
      setError("Сеть недоступна. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${formId}-title`}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-3 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <button
          type="button"
          aria-label="Закрыть"
          onClick={close}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>

        <div className="bg-primary/10 px-5 pb-4 pt-6 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Phone aria-hidden className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 id={`${formId}-title`} className="font-display text-lg font-semibold leading-tight">
                Перезвоним за 15 минут
              </h2>
              <p className="text-xs text-muted-foreground">Бесплатная консультация инженера</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-3 px-5 py-5 sm:px-6">
          <div>
            <label htmlFor={`${formId}-name`} className="mb-1 block text-xs font-medium text-muted-foreground">
              Как к вам обращаться
            </label>
            <Input
              id={`${formId}-name`}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя"
              disabled={submitting}
              required
            />
          </div>
          <div>
            <label htmlFor={`${formId}-phone`} className="mb-1 block text-xs font-medium text-muted-foreground">
              Телефон
            </label>
            <Input
              id={`${formId}-phone`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (___) ___-__-__"
              disabled={submitting}
              required
            />
          </div>

          <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Checkbox
              checked={consent}
              onCheckedChange={(v) => setConsent(v === true)}
              disabled={submitting}
              className="mt-0.5"
            />
            <span>
              Согласен с обработкой персональных данных в соответствии с{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                политикой конфиденциальности
              </a>
              .
            </span>
          </label>

          {error ? (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={submitting} className="mt-1 h-11">
            {submitting ? (
              <>
                <Loader2 aria-hidden className="mr-2 h-4 w-4 animate-spin" /> Отправляем…
              </>
            ) : (
              "Заказать звонок"
            )}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            Нажимая кнопку, вы соглашаетесь на обратный звонок в рабочее время.
          </p>
        </form>
      </div>
    </div>
  );
}