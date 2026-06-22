import { useEffect, useState } from "react";
import type { DailyReportRow } from "@/lib/client-portal/api";
import { listReports } from "@/lib/client-portal/api";

export function ReportsTab({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<DailyReportRow[] | null>(null);
  useEffect(() => { listReports(projectId).then(setItems).catch(() => setItems([])); }, [projectId]);
  if (items === null) return <p className="text-sm text-muted-foreground">Загружаем отчёты…</p>;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Опубликованных отчётов пока нет.</p>;
  return (
    <ul className="grid gap-3">
      {items.map((r) => (
        <li key={r.id} className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{r.report_date}</p>
          <h3 className="mt-1 font-display text-base font-semibold">{r.title}</h3>
          <p className="mt-2 whitespace-pre-line text-sm">{r.summary}</p>
          {r.work_completed.length ? <Section title="Выполненные работы" items={r.work_completed} /> : null}
          {r.next_steps.length ? <Section title="Следующие шаги" items={r.next_steps} /> : null}
          {r.issues.length ? <Section title="Вопросы и ограничения" items={r.issues} /> : null}
        </li>
      ))}
    </ul>
  );
}
function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
      <ul className="mt-1 list-inside list-disc text-sm">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  );
}