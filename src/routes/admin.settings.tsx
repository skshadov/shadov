import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminSession } from "@/lib/admin/use-admin-session";
import {
  getCompanySettings,
  updateCompanySettings,
  type CompanySettings,
  type UpdateCompanyInput,
} from "@/lib/admin/settings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Настройки оператора — Админ-панель" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: AdminSettingsPage,
});

interface FieldDef {
  key: keyof UpdateCompanyInput;
  label: string;
  placeholder?: string;
  hint?: string;
}

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Юридическое лицо",
    fields: [
      { key: "legal_name", label: "Полное наименование", placeholder: "ООО «...»" },
      { key: "brand_name", label: "Бренд" },
      { key: "brand_full", label: "Развёрнутое название бренда" },
      { key: "domain", label: "Домен", placeholder: "shadov.pro" },
      { key: "inn", label: "ИНН", hint: "10 или 12 цифр" },
      { key: "kpp", label: "КПП", hint: "9 цифр" },
      { key: "ogrn", label: "ОГРН/ОГРНИП", hint: "13 или 15 цифр" },
      { key: "legal_address", label: "Юридический адрес" },
      { key: "office_address", label: "Адрес офиса" },
    ],
  },
  {
    title: "Контакты",
    fields: [
      { key: "phone", label: "Телефон (отображаемый)" },
      { key: "phone_e164", label: "Телефон (E.164)", hint: "Например, +74951234567" },
      { key: "email", label: "Email" },
      { key: "telegram", label: "Telegram" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "working_hours", label: "Часы работы" },
    ],
  },
  {
    title: "СРО",
    fields: [
      { key: "sro_name", label: "Наименование СРО" },
      { key: "sro_number", label: "Номер в реестре СРО" },
      { key: "sro_registry_url", label: "Ссылка на реестр", hint: "должна начинаться с http:// или https://" },
    ],
  },
  {
    title: "Банковские реквизиты",
    fields: [
      { key: "bank_name", label: "Банк" },
      { key: "bank_bik", label: "БИК" },
      { key: "bank_account", label: "Расчётный счёт" },
      { key: "bank_corr_account", label: "Корреспондентский счёт" },
    ],
  },
];

function toInput(s: CompanySettings | null): UpdateCompanyInput {
  const empty: UpdateCompanyInput = { published: false };
  if (!s) return empty;
  return {
    legal_name: s.legal_name, brand_name: s.brand_name, brand_full: s.brand_full,
    domain: s.domain, inn: s.inn, kpp: s.kpp, ogrn: s.ogrn,
    legal_address: s.legal_address, office_address: s.office_address,
    phone: s.phone, phone_e164: s.phone_e164, email: s.email,
    telegram: s.telegram, whatsapp: s.whatsapp, working_hours: s.working_hours,
    sro_name: s.sro_name, sro_number: s.sro_number, sro_registry_url: s.sro_registry_url,
    bank_name: s.bank_name, bank_bik: s.bank_bik, bank_account: s.bank_account,
    bank_corr_account: s.bank_corr_account, published: s.published,
  };
}

function AdminSettingsPage() {
  const session = useAdminSession();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [form, setForm] = useState<UpdateCompanyInput>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canWrite = useMemo(
    () => session.status === "authenticated" && session.admin.permissions.includes("admin.settings.write"),
    [session]
  );

  useEffect(() => {
    if (session.status !== "authenticated") return;
    let active = true;
    setLoading(true);
    getCompanySettings()
      .then((s) => {
        if (!active) return;
        setSettings(s);
        setForm(toInput(s));
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Не удалось загрузить настройки.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session.status]);

  if (session.status !== "authenticated") return null;

  function update<K extends keyof UpdateCompanyInput>(key: K, value: UpdateCompanyInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSuccess(null);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true); setError(null); setSuccess(null);
    try {
      const updated = await updateCompanySettings({ data: form });
      setSettings(updated);
      setForm(toInput(updated));
      setSuccess("Изменения сохранены.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout
      admin={session.admin}
      title="Настройки оператора"
      breadcrumbs={[
        { label: "Админ-панель", to: "/admin" },
        { label: "Настройки" },
      ]}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <form onSubmit={onSave} className="space-y-6">
          {error ? (
            <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span>{error}</span>
            </div>
          ) : null}
          {success ? (
            <div role="status" className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
              <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          ) : null}

          <section className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold">Публикация</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Если выключено, публичная страница «Реквизиты» и футер скроют поля.
                  Включайте только после проверки данных.
                </p>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={!!form.published}
                  disabled={!canWrite}
                  onChange={(e) => update("published", e.target.checked)}
                />
                Опубликовано
              </label>
            </div>
          </section>

          {SECTIONS.map((section) => (
            <section key={section.title} className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-display text-base font-semibold">{section.title}</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {section.fields.map((f) => {
                  const id = `cs-${String(f.key)}`;
                  return (
                    <div key={String(f.key)} className="space-y-1">
                      <Label htmlFor={id}>{f.label}</Label>
                      <Input
                        id={id}
                        type="text"
                        value={(form[f.key] as string | undefined) ?? ""}
                        placeholder={f.placeholder}
                        disabled={!canWrite}
                        onChange={(e) => update(f.key, e.target.value as never)}
                      />
                      {f.hint ? (
                        <p className="text-xs text-muted-foreground">{f.hint}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              {settings
                ? `Последнее изменение: ${new Date(settings.updated_at).toLocaleString("ru-RU")}`
                : "Запись ещё не создана."}
            </p>
            <Button type="submit" disabled={!canWrite || saving}>
              <Save aria-hidden className="mr-1 h-4 w-4" />
              {saving ? "Сохранение…" : "Сохранить"}
            </Button>
          </div>

          {!canWrite ? (
            <p className="text-xs text-muted-foreground">
              У вашей роли нет права <code>admin.settings.write</code> — поля доступны только для просмотра.
            </p>
          ) : null}
        </form>
      )}
    </AdminLayout>
  );
}