import { useEffect, useState } from "react";
import type { ProjectRow, StageRow, DailyReportRow, AcceptanceRow } from "@/lib/client-portal/api";
import { listStages, listReports, listAcceptances } from "@/lib/client-portal/api";

export function OverviewTab({ project }: { project: ProjectRow }) {
  const [stages, setStages] = useState<StageRow[]>([]);
  const [reports, setReports] = useState<DailyReportRow[]>([]);
  const [acceptances, setAcceptances] = useState<AcceptanceRow[]>([]);
  useEffect(() => {
    let active = true;
    (async () => {
      const s = await listStages(project.id);
      if (!active) return;
      setStages(s);
      const [r, a] = await Promise.all([listReports(project.id), listAcceptances(s.map((x) => x.id))]);
      if (!active) return;
      setReports(r); setAcceptances(a);
    })().catch(() => undefined);
    return () => { active = false; };
  }, [project.id]);
  const acceptedCount = stages.filter((s) => s.status === "accepted").length;
  const lastReport = reports[0];
  const pending = acceptances.find((a) => a.status === "pending");
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card title="Состояние проекта">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Статус</dt><dd>{project.status}</dd>
          <dt className="text-muted-foreground">Этапов</dt><dd>{stages.length}</dd>
          <dt className="text-muted-foreground">Принято</dt><dd>{acceptedCount} из {stages.length}</dd>
        </dl>
        {project.description ? <p className="mt-3 text-sm text-muted-foreground">{project.description}</p> : null}
      </Card>
      <Card title="Последний отчёт">
        {lastReport ? (
          <>
            <p className="text-xs text-muted-foreground">{lastReport.report_date}</p>
            <p className="mt-1 font-medium">{lastReport.title}</p>
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{lastReport.summary}</p>
          </>
        ) : <p className="text-sm text-muted-foreground">Опубликованных отчётов пока нет.</p>}
      </Card>
      <Card title="Ожидает решения">
        {pending ? <p className="text-sm">По одному из этапов требуется ваше решение. Перейдите во вкладку «Этапы».</p>
          : <p className="text-sm text-muted-foreground">Сейчас ожидающих приёмок нет.</p>}
      </Card>
      <Card title="Документы">
        <p className="text-sm text-muted-foreground">Открытые документы по проекту — во вкладке «Документы».</p>
      </Card>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}