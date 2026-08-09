/**
 * Компактная форма заявки внутри калькулятора: имя, телефон, местоположение,
 * комментарий. Расчёт подставляется автоматически.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { CONSENT_VERSION } from "@/lib/operator-configuration";
import { readUtm, formatUtmForMessage, reachMetrikaGoal } from "@/lib/utm";

const phoneRegex = /^(\+7|7|8)?[\s\-(]*\d{3}[\s\-)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}$/;

const schema = z.object({
  name: z.string().trim().min(2, { message: "Укажите имя" }).max(80),
  phone: z.string().trim().regex(phoneRegex, { message: "Введите корректный номер телефона" }),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  comment: z.string().max(1000).optional().or(z.literal("")),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Подтвердите согласие на обработку персональных данных" }),
  }),
});

type Values = z.infer<typeof schema>;

export function CalculatorLeadForm({ summary }: { summary: string }) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", location: "", comment: "", consent: false as unknown as true },
    mode: "onBlur",
  });
  const watched = watch();

  const onSubmit = async (values: Values) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const utmSuffix = formatUtmForMessage(readUtm());
      const message = [
        summary,
        values.location ? `Местоположение: ${values.location}` : "",
        values.comment ? `Комментарий: ${values.comment}` : "",
      ]
        .filter(Boolean)
        .join("\n")
        .concat(utmSuffix)
        .slice(0, 1000);

      const submissionId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}-0000-0000-000000000000`;

      const { data, error } = await supabase.functions.invoke("submit-estimate-request", {
        body: {
          submission_id: submissionId,
          source_path: typeof window !== "undefined" ? window.location.pathname : "/",
          service_slug: null,
          contact_name: values.name,
          phone: values.phone,
          email: null,
          message,
          consent_accepted: true,
          consent_version: CONSENT_VERSION,
          website: "",
        },
      });

      if (error || !data || (data as { success?: boolean }).success !== true) {
        toast.error("Не удалось отправить заявку", {
          description: "Попробуйте ещё раз или позвоните нам.",
        });
        return;
      }

      const requestNumber = (data as { requestNumber?: string }).requestNumber ?? "";
      reset({ name: "", phone: "", location: "", comment: "", consent: false as unknown as true });
      reachMetrikaGoal("estimate_submitted");
      toast.success("Заявка отправлена инженеру", {
        description: requestNumber ? `Номер заявки: ${requestNumber}` : undefined,
        duration: 10000,
      });
    } finally {
      setTimeout(() => setSubmitting(false), 400);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 border-t border-border pt-6">
      <div>
        <h3 className="font-display text-base font-semibold">Отправить расчёт инженеру</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Расчёт выше уйдёт вместе с заявкой — заполнять параметры заново не нужно.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lead-name" className="text-sm font-medium">
            Имя<span aria-hidden="true" className="ml-0.5 text-[color:var(--error)]">*</span>
          </Label>
          <Input id="lead-name" type="text" autoComplete="name" placeholder="Как к вам обращаться" {...register("name")} />
          {errors.name ? <p role="alert" className="text-xs text-[color:var(--error)]">{errors.name.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lead-phone" className="text-sm font-medium">
            Телефон<span aria-hidden="true" className="ml-0.5 text-[color:var(--error)]">*</span>
          </Label>
          <Input id="lead-phone" type="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" {...register("phone")} />
          {errors.phone ? <p role="alert" className="text-xs text-[color:var(--error)]">{errors.phone.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="lead-location" className="text-sm font-medium">Местоположение</Label>
          <Input id="lead-location" type="text" placeholder="Город, район или адрес объекта" {...register("location")} />
          {errors.location ? <p role="alert" className="text-xs text-[color:var(--error)]">{errors.location.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="lead-comment" className="text-sm font-medium">Комментарий</Label>
          <Textarea
            id="lead-comment"
            rows={3}
            maxLength={1000}
            placeholder="Сроки, особенности объекта, пожелания"
            {...register("comment")}
          />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-md border border-border bg-card/40 p-3 text-sm">
        <Checkbox
          checked={watched.consent}
          onCheckedChange={(v) => setValue("consent", Boolean(v) as unknown as true, { shouldValidate: isSubmitted })}
          aria-label="Согласие с обработкой персональных данных"
          className="mt-0.5"
        />
        <span className="leading-snug text-muted-foreground">
          Я согласен(на) с{" "}
          <Link to="/personal-data-consent" className="text-primary underline underline-offset-2">
            обработкой персональных данных
          </Link>{" "}
          и{" "}
          <Link to="/privacy" className="text-primary underline underline-offset-2">
            политикой конфиденциальности
          </Link>
          .
        </span>
      </label>
      {errors.consent ? <p className="text-sm text-[color:var(--error)]">{errors.consent.message}</p> : null}

      <Button type="submit" size="lg" disabled={submitting} className="min-h-12 w-full sm:w-auto">
        {submitting ? (
          <>
            <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
            Отправляем…
          </>
        ) : (
          "Отправить расчёт инженеру"
        )}
      </Button>
    </form>
  );
}
