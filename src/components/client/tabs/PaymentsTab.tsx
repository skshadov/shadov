import { useEffect, useState } from "react";
import type { PaymentRow } from "@/lib/client-portal/api";
import { listPayments } from "@/lib/client-portal/api";

const fmt = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
const STATUS: Record<string, string> = { planned: "Запланирована", invoiced: "Выставлена", paid: "Оплачена", cancelled: "Отменена" };

export function PaymentsTab({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<PaymentRow[] | null>(null);
  useEffect(() => { listPayments(projectId).then(setItems).catch(() => setItems([])); }, [projectId]);
  if (items === null) return <p className="text-sm text-muted-foreground">Загружаем…</p>;
  return (
    <div>
      <p className="mb-3 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        Раздел носит информационный характер. Оплата через сайт не производится. Фактические расчёты и подтверждающие документы определяются договором и платёжными документами.
      </p>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Записей пока нет.</p> : (
        <ul className="grid gap-2">
          {items.map((p) => (
            <li key={p.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{p.title}</p>
                  {p.description ? <p className="mt-1 text-sm text-muted-foreground">{p.description}</p> : null}
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs">{STATUS[p.status] ?? p.status}</span>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                <div><dt>Сумма</dt><dd>{p.amount != null ? fmt.format(Number(p.amount)) : "—"}</dd></div>
                <div><dt>Срок</dt><dd>{p.due_date ?? "—"}</dd></div>
                <div><dt>Оплачено</dt><dd>{p.paid_at ? new Date(p.paid_at).toLocaleDateString("ru-RU") : "—"}</dd></div>
                <div><dt>Валюта</dt><dd>{p.currency}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}