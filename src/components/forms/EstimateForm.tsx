/**
 * Форма предварительного расчёта (§12.10 ТЗ + уточнения 2, 13).
 *
 * Этап 1: данные сохраняются ТОЛЬКО в localStorage, никаких ложных
 * сообщений «Заявка отправлена / Менеджер получил». После submit
 * показывается честный toast о демо-режиме. Кнопка «Очистить
 * сохранённые данные» очищает localStorage и форму. Загрузка
 * файлов визуально подготовлена, но файлы никуда не уходят.
 * Локальный режим удаляется на Этапе 3 после подключения Cloud.
 */
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Loader2, Trash2, Paperclip, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { isPublicDataCollectionEnabled, CONSENT_VERSION } from "@/lib/operator-configuration";

const STORAGE_KEY = "shadov:estimate-draft";

const OBJECT_TYPES = [
  "Квартира",
  "Частный дом",
  "Многоквартирный дом",
  "Коммерческое помещение",
  "Отдельная конструкция",
] as const;

const SERVICES = [
  "Строительство дома",
  "Ремонт квартиры/дома",
  "Монолитные работы",
  "Кладочные работы",
  "Кровельные работы",
  "Фасадные работы",
  "Электромонтаж",
  "Сантехника",
  "Отопление",
  "Укладка плитки",
  "Другая услуга",
] as const;

const UNITS = ["м²", "м³", "погонные метры", "количество точек"] as const;

const STATES = [
  "Свободная планировка / новостройка",
  "Вторичка под чистовую отделку",
  "Требуется демонтаж старой отделки",
  "Готовый проект",
  "Без отделки / коробка",
] as const;

const STARTS = [
  "В ближайший месяц",
  "В течение 1–3 месяцев",
  "В этом году",
  "Сроки гибкие",
] as const;

const CONTACT_PREF = [
  { value: "phone", label: "Звонок" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
] as const;

const phoneRegex = /^(\+7|7|8)?[\s\-(]*\d{3}[\s\-)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}$/;

const schema = z.object({
  objectType: z.string().min(1, { message: "Выберите тип объекта" }),
  service: z.string().min(1, { message: "Выберите услугу" }),
  area: z
    .string()
    .min(1, { message: "Укажите площадь или объём" })
    .refine((v) => Number(v.replace(",", ".")) > 0, {
      message: "Значение должно быть больше нуля",
    }),
  unit: z.string().min(1, { message: "Выберите единицу" }),
  state: z.string().optional(),
  location: z
    .string()
    .trim()
    .max(200, { message: "Не более 200 символов" })
    .optional()
    .or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  name: z
    .string()
    .trim()
    .min(2, { message: "Укажите имя (минимум 2 символа)" })
    .max(80, { message: "Не более 80 символов" }),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, { message: "Введите корректный номер телефона" }),
  contactPref: z.string().min(1, { message: "Выберите способ связи" }),
  comment: z
    .string()
    .max(1000, { message: "Не более 1000 символов" })
    .optional()
    .or(z.literal("")),
  consent: z.literal(true, {
    errorMap: () => ({
      message: "Подтвердите согласие на обработку персональных данных",
    }),
  }),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  objectType: "",
  service: "",
  area: "",
  unit: "м²",
  state: "",
  location: "",
  startDate: "",
  name: "",
  phone: "",
  contactPref: "phone",
  comment: "",
  consent: false as unknown as true,
};

export function EstimateForm() {
  const formId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const backendEnabled = isPublicDataCollectionEnabled();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitted },
  } = form;

  // Восстановление черновика
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FormValues>;
        reset({ ...DEFAULTS, ...parsed, consent: false as unknown as true });
        setHasDraft(true);
      }
    } catch {
      /* ignore — повреждённый JSON просто игнорируем */
    }
  }, [reset]);

  const watched = watch();

  const onSubmit = async (values: FormValues) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (backendEnabled) {
        const submissionId = (typeof crypto !== "undefined" && "randomUUID" in crypto)
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}-0000-0000-000000000000`;
        const { data, error } = await supabase.functions.invoke("submit-estimate-request", {
          body: {
            submission_id: submissionId,
            source_path: typeof window !== "undefined" ? window.location.pathname : "/",
            service_slug: values.service,
            contact_name: values.name,
            phone: values.phone,
            email: null,
            message: values.comment ?? null,
            consent_accepted: true,
            consent_version: CONSENT_VERSION,
            website: "", // honeypot
          },
        });
        if (error || !data || (data as { success?: boolean }).success !== true) {
          toast.error("Не удалось отправить заявку", {
            description: "Пожалуйста, попробуйте ещё раз или свяжитесь по телефону.",
          });
          return;
        }
        const requestNumber = (data as { requestNumber?: string }).requestNumber ?? "";
        window.localStorage.removeItem(STORAGE_KEY);
        reset(DEFAULTS);
        setHasDraft(false);
        toast.success("Заявка зарегистрирована", {
          description: `Номер заявки: ${requestNumber}`,
          duration: 10000,
        });
        return;
      }
      const { consent: _consent, ...persistable } = values;
      void _consent;
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...persistable, savedAt: new Date().toISOString() }),
      );
      setHasDraft(true);
      toast.success("Данные сохранены локально", {
        description:
          "Данные сохранены на этом устройстве в демонстрационном режиме. Отправка заявки будет подключена после настройки защищённой базы данных.",
        duration: 8000,
      });
    } finally {
      // Небольшая задержка, чтобы повторное нажатие не дёргало toast
      setTimeout(() => setSubmitting(false), 400);
    }
  };

  const clearDraft = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    reset(DEFAULTS);
    setHasDraft(false);
    toast("Сохранённые данные очищены", {
      description: "Локальный черновик удалён с этого устройства.",
    });
  };

  return (
    <form
      id={formId}
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-5"
    >
      <div className="flex items-center justify-between gap-3">
        {backendEnabled ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
            Защищённая отправка
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-[color:var(--warning)]">
            DEMO режим
          </span>
        )}
        {hasDraft ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearDraft}
            className="text-xs"
          >
            <Trash2 aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
            Очистить сохранённые данные
          </Button>
        ) : null}
      </div>

      {backendEnabled ? (
        <p className="rounded-md border border-border bg-muted/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          Данные отправляются в защищённую базу. Подробнее — в политике конфиденциальности.
        </p>
      ) : (
        <p className="rounded-md border border-border bg-muted/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          До подключения защищённой базы данных форма работает в демонстрационном режиме: введённые данные сохраняются только на этом устройстве, никуда не отправляются и не передаются третьим лицам.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Тип объекта" error={errors.objectType?.message} required>
          <Select
            value={watched.objectType || undefined}
            onValueChange={(v) => setValue("objectType", v, { shouldValidate: isSubmitted })}
          >
            <SelectTrigger aria-label="Тип объекта"><SelectValue placeholder="Выберите тип объекта" /></SelectTrigger>
            <SelectContent>
              {OBJECT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Нужная услуга" error={errors.service?.message} required>
          <Select
            value={watched.service || undefined}
            onValueChange={(v) => setValue("service", v, { shouldValidate: isSubmitted })}
          >
            <SelectTrigger aria-label="Нужная услуга"><SelectValue placeholder="Выберите услугу" /></SelectTrigger>
            <SelectContent>
              {SERVICES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Площадь или объём" error={errors.area?.message} required>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Например, 75"
            autoComplete="off"
            {...register("area")}
          />
        </Field>

        <Field label="Единица" error={errors.unit?.message} required>
          <Select
            value={watched.unit || undefined}
            onValueChange={(v) => setValue("unit", v, { shouldValidate: isSubmitted })}
          >
            <SelectTrigger aria-label="Единица измерения"><SelectValue placeholder="Выберите единицу" /></SelectTrigger>
            <SelectContent>
              {UNITS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Текущее состояние объекта" error={errors.state?.message}>
          <Select
            value={watched.state || undefined}
            onValueChange={(v) => setValue("state", v, { shouldValidate: isSubmitted })}
          >
            <SelectTrigger aria-label="Текущее состояние объекта"><SelectValue placeholder="Можно пропустить" /></SelectTrigger>
            <SelectContent>
              {STATES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Местоположение" error={errors.location?.message}>
          <Input
            type="text"
            placeholder="Город, район или адрес"
            autoComplete="off"
            {...register("location")}
          />
        </Field>

        <Field label="Планируемый срок начала" error={errors.startDate?.message}>
          <Select
            value={watched.startDate || undefined}
            onValueChange={(v) => setValue("startDate", v, { shouldValidate: isSubmitted })}
          >
            <SelectTrigger aria-label="Планируемый срок начала"><SelectValue placeholder="Когда планируете начать" /></SelectTrigger>
            <SelectContent>
              {STARTS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Имя" error={errors.name?.message} required>
          <Input
            type="text"
            placeholder="Как к вам обращаться"
            autoComplete="name"
            {...register("name")}
          />
        </Field>

        <Field label="Телефон" error={errors.phone?.message} required>
          <Input
            type="tel"
            placeholder="+7 (___) ___-__-__"
            autoComplete="tel"
            {...register("phone")}
          />
        </Field>

        <Field label="Предпочтительный способ связи" error={errors.contactPref?.message} required>
          <RadioGroup
            value={watched.contactPref}
            onValueChange={(v) => setValue("contactPref", v, { shouldValidate: isSubmitted })}
            className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4"
          >
            {CONTACT_PREF.map((c) => (
              <label
                key={c.value}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 text-sm hover:border-primary/60"
              >
                <RadioGroupItem value={c.value} />
                <span>{c.label}</span>
              </label>
            ))}
          </RadioGroup>
        </Field>
      </div>

      <Field label="Комментарий" error={errors.comment?.message}>
        <Textarea
          rows={4}
          maxLength={1000}
          placeholder="Кратко опишите задачу, особенности объекта, готовые проектные решения и т. д."
          {...register("comment")}
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {(watched.comment ?? "").length}/1000
        </p>
      </Field>

      <FileDropPlaceholder />

      <label className="flex items-start gap-3 rounded-md border border-border bg-card/40 p-3 text-sm">
        <Checkbox
          checked={watched.consent}
          onCheckedChange={(v) =>
            setValue("consent", Boolean(v) as unknown as true, { shouldValidate: isSubmitted })
          }
          aria-invalid={Boolean(errors.consent)}
          className="mt-0.5"
        />
        <span className="leading-snug text-muted-foreground">
          Я ознакомлен(а) и согласен(на) с{" "}
          <Link to="/personal-data-consent" className="text-primary underline-offset-2 hover:underline">
            условиями обработки персональных данных
          </Link>{" "}
          и{" "}
          <Link to="/privacy" className="text-primary underline-offset-2 hover:underline">
            политикой конфиденциальности
          </Link>
          .
        </span>
      </label>
      {errors.consent ? (
        <p className="text-sm text-[color:var(--error)]">{errors.consent.message}</p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
          Данные не покидают это устройство до подключения защищённой базы данных.
        </p>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="min-h-11"
        >
          {submitting ? (
            <>
              <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
              Сохраняем…
            </>
          ) : (
            "Сохранить расчёт (демо)"
          )}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? <span aria-hidden="true" className="ml-0.5 text-[color:var(--error)]">*</span> : null}
      </Label>
      {/* Children may not always accept id — Label htmlFor работает достаточно. */}
      <div id={id}>{children}</div>
      {error ? (
        <p role="alert" className="text-xs text-[color:var(--error)]">{error}</p>
      ) : null}
    </div>
  );
}

function FileDropPlaceholder() {
  return (
    <div className="rounded-md border border-dashed border-border bg-card/40 p-4 text-sm">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Paperclip aria-hidden="true" className="h-4 w-4" />
          </span>
          <div>
            <p className="font-medium">Загрузка проекта или фотографий</p>
            <p className="text-xs text-muted-foreground">
              Возможность подключим вместе с защищённой базой данных. На демо-этапе файлы не отправляются и не сохраняются.
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" disabled aria-disabled="true">
          Выбрать файлы
        </Button>
      </div>
    </div>
  );
}