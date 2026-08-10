import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Save, RotateCcw, Plus, Trash2, AlertCircle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminSession } from "@/lib/admin/use-admin-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SERVICE_PRICING } from "@/data/pricing";
import type { PriceGroup, ServicePricing } from "@/data/pricing/types";
import { listPriceRowRefs } from "@/data/pricing/derive";
import { mergePricing, type PricingOverride } from "@/lib/site-content/store";
import {
  listPricingOverrides,
  savePricingOverride,
  resetPricingOverride,
} from "@/lib/admin/site-content.functions";

export const Route = createFileRoute("/admin/site-prices")({
  head: () => ({
    meta: [
      { title: "Прайс сайта — Админ-панель" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: AdminSitePricesPage,
});

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function AdminSitePricesPage() {
  const session = useAdminSession();
  const [slug, setSlug] = useState(SERVICE_PRICING[0]!.slug);
  const [overrides, setOverrides] = useState<Record<string, PricingOverride>>({});
  const [draft, setDraft] = useState<ServicePricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const canWrite = useMemo(
    () => session.status === "authenticated" && session.admin.permissions.includes("admin.catalog.write"),
    [session],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await listPricingOverrides();
        if (!alive) return;
        const map: Record<string, PricingOverride> = {};
        for (const r of rows) map[r.slug] = JSON.parse(r.data_json) as PricingOverride;
        setOverrides(map);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Не удалось загрузить прайс");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    const base = SERVICE_PRICING.find((s) => s.slug === slug)!;
    setDraft(clone(mergePricing(base, overrides[slug])));
    setSaved(null);
  }, [slug, loading, overrides]);

  function patch(next: Partial<ServicePricing>) {
    setDraft((d) => (d ? { ...d, ...next } : d));
    setSaved(null);
  }

  function patchGroups(fn: (groups: PriceGroup[]) => PriceGroup[]) {
    setDraft((d) => (d ? { ...d, groups: fn(clone(d.groups)) } : d));
    setSaved(null);
  }

  async function handleSave() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const payload: PricingOverride = {
        priceHeadline: draft.priceHeadline,
        priceHeadlineNote: draft.priceHeadlineNote,
        lead: draft.lead,
        baseConditions: draft.baseConditions,
        groups: draft.groups,
        calc: draft.calc,
      };
      await savePricingOverride({ data: { slug: draft.slug, data_json: JSON.stringify(payload) } });
      setOverrides((o) => ({ ...o, [draft.slug]: payload }));
      setSaved("Сохранено. Новые цены уже применены на сайте и в калькуляторе.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!draft) return;
    if (!window.confirm("Вернуть исходные цены этого направления?")) return;
    setBusy(true);
    setError(null);
    try {
      await resetPricingOverride({ data: { slug: draft.slug } });
      setOverrides((o) => {
        const next = { ...o };
        delete next[draft.slug];
        return next;
      });
      setSaved("Возвращены исходные цены.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сбросить");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminLayout
      admin={session.status === "authenticated" ? session.admin : null}
      title="Прайс сайта"
      breadcrumbs={[{ label: "Админ", to: "/admin/dashboard" }, { label: "Прайс сайта" }]}
    >
      <p className="max-w-3xl text-sm text-muted-foreground">
        Редактирование прайса по направлениям. После сохранения цены обновляются на странице услуги,
        в общем прайсе и в калькуляторе.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {SERVICE_PRICING.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => setSlug(s.slug)}
            className={
              "min-h-10 rounded-lg border px-3 py-2 text-sm font-medium transition-colors " +
              (s.slug === slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-primary")
            }
          >
            {s.shortName}
            {overrides[s.slug] ? " •" : ""}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      ) : null}
      {saved ? (
        <p className="mt-4 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">{saved}</p>
      ) : null}

      {loading || !draft ? (
        <p className="mt-6 text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <div className="mt-6 space-y-8">
          <section className="space-y-3 rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Цена на первом экране</h2>
            <Field label="Заголовок цены (например «550 ₽/м² за работу»)">
              <Input value={draft.priceHeadline} onChange={(e) => patch({ priceHeadline: e.target.value })} />
            </Field>
            <Field label="Пояснение под ценой">
              <Textarea rows={2} value={draft.priceHeadlineNote} onChange={(e) => patch({ priceHeadlineNote: e.target.value })} />
            </Field>
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">Таблицы прайса</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canWrite}
                onClick={() => patchGroups((g) => [...g, { title: "Новая группа", rows: [] }])}
              >
                <Plus className="mr-1 h-4 w-4" /> Группа
              </Button>
            </div>

            {draft.groups.map((group, gi) => (
              <div key={gi} className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <Field label="Название группы" className="min-w-60 flex-1">
                    <Input
                      value={group.title}
                      onChange={(e) =>
                        patchGroups((gs) => {
                          gs[gi]!.title = e.target.value;
                          return gs;
                        })
                      }
                    />
                  </Field>
                  <Field label="Подпись (необязательно)" className="min-w-60 flex-1">
                    <Input
                      value={group.caption ?? ""}
                      onChange={(e) =>
                        patchGroups((gs) => {
                          gs[gi]!.caption = e.target.value;
                          return gs;
                        })
                      }
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!canWrite}
                    onClick={() => patchGroups((gs) => gs.filter((_, i) => i !== gi))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="p-2">Позиция</th>
                        <th className="w-24 p-2">Ед.</th>
                        <th className="w-28 p-2">Работа, ₽</th>
                        <th className="p-2">Пояснение</th>
                        <th className="w-10 p-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row, ri) => (
                        <tr key={ri} className="border-t border-border align-top">
                          <td className="p-2">
                            <Input
                              value={row.name}
                              onChange={(e) =>
                                patchGroups((gs) => {
                                  gs[gi]!.rows[ri]!.name = e.target.value;
                                  return gs;
                                })
                              }
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={row.unit}
                              onChange={(e) =>
                                patchGroups((gs) => {
                                  gs[gi]!.rows[ri]!.unit = e.target.value;
                                  return gs;
                                })
                              }
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              inputMode="numeric"
                              value={row.work ?? ""}
                              onChange={(e) =>
                                patchGroups((gs) => {
                                  const v = e.target.value.replace(/[^\d]/g, "");
                                  gs[gi]!.rows[ri]!.work = v ? Number(v) : null;
                                  return gs;
                                })
                              }
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={row.note ?? ""}
                              onChange={(e) =>
                                patchGroups((gs) => {
                                  gs[gi]!.rows[ri]!.note = e.target.value;
                                  return gs;
                                })
                              }
                            />
                          </td>
                          <td className="p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={!canWrite}
                              onClick={() =>
                                patchGroups((gs) => {
                                  gs[gi]!.rows = gs[gi]!.rows.filter((_, i) => i !== ri);
                                  return gs;
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canWrite}
                  onClick={() =>
                    patchGroups((gs) => {
                      gs[gi]!.rows.push({ name: "Новая позиция", unit: "м²", work: 0, material: null });
                      return gs;
                    })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" /> Позиция
                </Button>
              </div>
            ))}
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Калькулятор</h2>
            <p className="text-sm text-muted-foreground">
              Калькулятор считает по таблице прайса выше. Выберите, какая позиция прайса является базовой ценой и к какой
              позиции привязана каждая опция — суммы пересчитаются автоматически после сохранения.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={`Базовая позиция прайса (цена за ${draft.calc.unit})`}>
                <select
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                  value={draft.calc.baseRowKey ?? ""}
                  disabled={!canWrite}
                  onChange={(e) => patch({ calc: { ...draft.calc, baseRowKey: e.target.value || undefined } })}
                >
                  <option value="">Первая позиция прайса ({draft.calc.baseWork} ₽)</option>
                  {priceRowRefs.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label} — {r.work} ₽
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Объём по умолчанию">
                <Input
                  inputMode="numeric"
                  value={draft.calc.defaultQty}
                  onChange={(e) =>
                    patch({ calc: { ...draft.calc, defaultQty: Number(e.target.value.replace(/[^\d]/g, "")) || 0 } })
                  }
                />
              </Field>
              <Field label="Надбавка за малый объём, ₽/ед.">
                <Input
                  inputMode="numeric"
                  value={draft.calc.smallVolume?.add ?? 0}
                  onChange={(e) =>
                    patch({
                      calc: {
                        ...draft.calc,
                        smallVolume: {
                          threshold: draft.calc.smallVolume?.threshold ?? 0,
                          add: Number(e.target.value.replace(/[^\d]/g, "")) || 0,
                        },
                      },
                    })
                  }
                />
              </Field>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Опции калькулятора</p>
              {draft.calc.options.map((opt, oi) => (
                <div key={opt.id} className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-3">
                  <Field label="Название" className="min-w-60 flex-1">
                    <Input
                      value={opt.label}
                      onChange={(e) => {
                        const options = clone(draft.calc.options);
                        options[oi]!.label = e.target.value;
                        patch({ calc: { ...draft.calc, options } });
                      }}
                    />
                  </Field>
                  <Field label="Позиция прайса" className="min-w-60 flex-1">
                    <select
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                      value={opt.priceRowKey ?? ""}
                      disabled={!canWrite}
                      onChange={(e) => {
                        const options = clone(draft.calc.options);
                        options[oi]!.priceRowKey = e.target.value || undefined;
                        patch({ calc: { ...draft.calc, options } });
                      }}
                    >
                      <option value="">Своя надбавка</option>
                      {priceRowRefs.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.label} — {r.work} ₽
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Надбавка, ₽/ед." className="w-40">
                    <Input
                      inputMode="numeric"
                      disabled={Boolean(opt.priceRowKey)}
                      value={opt.addTurnkey}
                      onChange={(e) => {
                        const options = clone(draft.calc.options);
                        options[oi]!.addTurnkey = Number(e.target.value.replace(/[^\d]/g, "")) || 0;
                        patch({ calc: { ...draft.calc, options } });
                      }}
                    />
                  </Field>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={!canWrite || busy} onClick={handleSave}>
              <Save className="mr-1.5 h-4 w-4" /> Сохранить и опубликовать
            </Button>
            <Button type="button" variant="outline" disabled={!canWrite || busy || !overrides[draft.slug]} onClick={handleReset}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Вернуть исходные цены
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={"block " + (className ?? "")}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}