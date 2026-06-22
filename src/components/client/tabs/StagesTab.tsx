import { useEffect, useState, useCallback } from "react";
import type { StageRow, AcceptanceRow } from "@/lib/client-portal/api";
import { listStages, listAcceptances } from "@/lib/client-portal/api";
import { AcceptanceDialog } from "@/components/client/AcceptanceDialog";

const STATUS: Record<string, string> = {
  planned: "Запланирован", in_progress: "Выполняется", waiting_acceptance: "Ожидает приёмки",
  accepted: "Принят", completed: "Завершён", cancelled: "Отменён",
};

export function StagesTab({ projectId }: { projectId: string }) {
  const [stages, setStages] = useState<StageRow[]>([]);
  const [acceptances, setAcceptances] = useState<AcceptanceRow[]>([]);
  const [openAcc, setOpenAcc] = useState<AcceptanceRow | null>(null);
  const refresh = useCallback(async () => {
    const s = await listStages(projectId); setStages(s);
    const a = await listAcceptances(s.map((x) => x.id)); setAcceptances(a);
  }, [projectId]);
  useEffect(() => { refresh().catch(() => undefined); }, [refresh]);
  return (
    <div>
      <ul className="grid gap-3">
        {stages.map((s) => {
          const pending = acceptances.find((a) => a.stage_id === s.id && a.status === "pending");
          return (
            <li key={s.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Этап {s.sort_order}</p>
                  <h3 className="font-display text-base font-semibold">{s.title}</h3>
                  {s.description ? <p className="mt-1 text-sm text-muted-foreground">{s.description}</p> : null}
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs">{STATUS[s.status] ?? s.status}</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                <div><dt>План начала</dt><dd>{s.planned_start ?? "—"}</dd></div>
                <div><dt>План завершения</dt><dd>{s.planned_end ?? "—"}</dd></div>
                <div><dt>Факт начала</dt><dd>{s.actual_start ?? "—"}</dd></div>
                <div><dt>Факт завершения</dt><dd>{s.actual_end ?? "—"}</dd></div>
              </dl>
              {pending ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="min-h-11 rounded-md bg-primary px-3 text-sm text-primary-foreground" onClick={() => setOpenAcc(pending)}>
                    Ответить на приёмку
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {openAcc ? (
        <AcceptanceDialog acceptance={openAcc} onClose={() => setOpenAcc(null)} onResolved={async () => { setOpenAcc(null); await refresh(); }} />
      ) : null}
    </div>
  );
}