/**
 * Форма отправки отзыва посетителем сайта без регистрации.
 * Защита: арифметическая капча с серверной подписью + лимит на количество отправок.
 * Отзыв попадает в админку со статусом «на проверке» и публикуется только после одобрения.
 */
import { useCallback, useEffect, useState } from "react";
import { Star, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { getReviewCaptcha, submitReview } from "@/lib/reviews-public.functions";

const SERVICES = [
  { value: "", label: "— не указывать —" },
  { value: "mekhanizirovannaya-shtukaturka", label: "Механизированная штукатурка" },
  { value: "styazhka-pola", label: "Мокрая стяжка пола" },
  { value: "polusuhaya-styazhka", label: "Полусухая стяжка пола" },
  { value: "teplyy-pol", label: "Тёплый пол" },
  { value: "razvodka-elektriki", label: "Разводка электрики" },
  { value: "razvodka-santehniki", label: "Разводка сантехники" },
  { value: "ukladka-plitki", label: "Укладка плитки" },
];

const ERRORS: Record<string, string> = {
  captcha_failed: "Неверный ответ на проверочный вопрос. Попробуйте ещё раз.",
  rate_limited: "Слишком много отправок с одного адреса. Попробуйте позже.",
};

export function ReviewForm() {
  const [captcha, setCaptcha] = useState<{ question: string; token: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCaptcha = useCallback(async () => {
    try {
      setCaptcha(await getReviewCaptcha());
    } catch {
      setCaptcha(null);
    }
  }, []);

  useEffect(() => {
    void loadCaptcha();
  }, [loadCaptcha]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!captcha) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSending(true);
    setError(null);
    try {
      await submitReview({
        data: {
          author_name: String(fd.get("author_name") ?? ""),
          author_role: String(fd.get("author_role") ?? ""),
          contact: String(fd.get("contact") ?? ""),
          service_slug: String(fd.get("service_slug") ?? ""),
          rating,
          body: String(fd.get("body") ?? ""),
          consent: true,
          captcha_token: captcha.token,
          captcha_answer: String(fd.get("captcha_answer") ?? ""),
        },
      });
      setDone(true);
      form.reset();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const key = Object.keys(ERRORS).find((k) => raw.includes(k));
      setError(key ? ERRORS[key]! : "Не удалось отправить отзыв. Проверьте поля и попробуйте ещё раз.");
      void loadCaptcha();
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
        <div>
          <p className="font-semibold">Спасибо, отзыв отправлен на проверку</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Мы публикуем отзывы после проверки: сверяем объект и работы по своей базе. Обычно это занимает 1–2 рабочих дня.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setDone(false)}>
            Оставить ещё один отзыв
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rv-name">Имя *</Label>
          <Input id="rv-name" name="author_name" required minLength={2} maxLength={80} placeholder="Как вас подписать" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rv-role">Объект (необязательно)</Label>
          <Input id="rv-role" name="author_role" maxLength={120} placeholder="Например: квартира 74 м², Мытищи" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rv-contact">Телефон или e-mail (не публикуется)</Label>
          <Input id="rv-contact" name="contact" maxLength={160} placeholder="Для проверки отзыва" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rv-service">Направление работ</Label>
          <select
            id="rv-service"
            name="service_slug"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {SERVICES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Оценка *</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`Оценка ${n} из 5`}
              className="rounded p-1 text-primary transition-transform hover:scale-110"
            >
              <Star className="h-6 w-6" fill={n <= rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rv-body">Отзыв *</Label>
        <Textarea
          id="rv-body"
          name="body"
          required
          minLength={30}
          maxLength={3000}
          rows={6}
          placeholder="Что делали, как прошли работы, что понравилось или к чему были вопросы"
        />
        <p className="text-xs text-muted-foreground">Минимум 30 символов.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rv-captcha">Проверка: {captcha?.question ?? "загрузка…"} *</Label>
        <div className="flex items-center gap-2">
          <Input id="rv-captcha" name="captcha_answer" required inputMode="numeric" maxLength={6} className="max-w-32" />
          <Button type="button" variant="ghost" size="icon" onClick={() => void loadCaptcha()} aria-label="Обновить вопрос">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <Checkbox required id="rv-consent" className="mt-0.5" />
        <span className="text-muted-foreground">
          Соглашаюсь на обработку персональных данных и публикацию отзыва после проверки модератором.
        </span>
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={sending || !captcha}>
        {sending ? "Отправляем…" : "Отправить отзыв"}
      </Button>
    </form>
  );
}
