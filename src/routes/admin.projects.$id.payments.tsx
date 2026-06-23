import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAdminSession, hasPermission } from "@/lib/admin/use-admin-session";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  listPayments, upsertPayment, deletePayment,
  type PaymentItem, type PaymentStatus,
} from "@/lib/admin/communications.functions";

export const Route = createFileRoute("/admin/projects/$id/payments")({
  head: () => ({ meta: [{ title: "Платежи — Админ-панель" }, { name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  component: ProjectPaymentsPage,
});

const STATUSES: PaymentStatus[] = ["draft", "pending", "invoiced", "paid", "overdue", "cancelled"];

function ProjectPaymentsPage() {
  const session = useAdminSession();
  const { id } = useParams({ from: "/admin/projects/$id/payments" });
  const [items, setItems] = useState<PaymentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<PaymentItem> | null>(null);

  const reload = useCallback(() => {
    listPayments({ data: { project_id: id } })
      .then(setItems)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, [id]);
  useEffect(() => { if (session.status === "authenticated") reload(); }, [session.status, reload]);

  if (session.status !== "authenticated") return null;
  if (!hasPermission(session, "admin.payments.read")) {
    return <AdminLayout admin={session.admin} title="Платежи" breadcrumbs={[{ label: "Админ-панель", to: "/admin" }]}><p>Нет доступа.</p></AdminLayout>;
  }
  const canWrite = hasPermission(session, "admin.payments.write");
  const canDelete = hasPermission(session, "admin.payments.delete");
  const total = (items ?? []).reduce((acc, p) => acc + (p.amount ?? 0), 0);

  return (
    <AdminLayout admin={session.admin} title="Платежи"
      breadcrumbs={[
        { label: "Админ-панель", to: "/admin" },
        { label: "Проекты", to: "/admin/projects" },
        { label: "Проект", to: `/admin/projects/${id}` },
        { label: "Платежи" },
      ]}>
      {error ? <div role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}

      {canWrite ? (
        <div className="mb-4">
          {editing ? (
            <PaymentForm projectId={id} initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
          ) : (
            <Button size="sm" onClick={() => setEditing({ status: "draft", currency: "RUB" })}>Новый платёж</Button>
          )}
        </div>
      ) : null}

      {items === null ? <p className="text-sm text-muted-foreground">Загрузка…</p>
        : items.length === 0 ? <p className="text-sm text-muted-foreground">Платежей нет.</p>
        : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Назначение</th>
                    <th className="px-3 py-2">Этап</th>
                    <th className="px-3 py-2 text-right">Сумма</th>
                    <th className="px-3 py-2">Статус</th>
                    <th className="px-3 py-2">Срок</th>
                    <th className="px-3 py-2">Оплачен</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2">
                        <div className="font-medium">{p.title}</div>
                        {p.description ? <div className="text-xs text-muted-foreground">{p.description}</div> : null}
                      </td>
                      <td className="px-3 py-2 text-xs">{p.stage_title ?? "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {p.amount === null ? "—" : `${p.amount.toLocaleString("ru-RU")} ${p.currency}`}
                      </td>
                      <td className="px-3 py-2 text-xs"><span className="font-mono">{p.status}</span></td>
                      <td className="px-3 py-2 text-xs">{p.due_date ?? "—"}</td>
                      <td className="px-3 py-2 text-xs">{p.paid_at ? new Date(p.paid_at).toLocaleDateString("ru-RU") : "—"}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          {canWrite ? <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Изм.</Button> : null}
                          {canDelete ? <Button size="sm" variant="ghost" onClick={async () => {
                            if (!confirm(`Удалить платёж «${p.title}»?`)) return;
                            try { await deletePayment({ data: { id: p.id } }); reload(); }
                            catch (e) { alert(e instanceof Error ? e.message : "Ошибка"); }
                          }}>×</Button> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-right text-sm text-muted-foreground">
              Итого: <span className="font-mono text-foreground">{total.toLocaleString("ru-RU")} RUB</span>
            </p>
          </>
        )}
      <p className="mt-4 text-xs"><Link to="/admin/projects/$id" params={{ id }} className="underline">← К проекту</Link></p>
    </AdminLayout>
  );
}

function PaymentForm({ projectId, initial, onClose, onSaved }: {
  projectId: string; initial: Partial<PaymentItem>;
  onClose: () => void; onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [amount, setAmount] = useState(initial.amount?.toString() ?? "");
  const [currency, setCurrency] = useState(initial.currency ?? "RUB");
  const [status, setStatus] = useState<PaymentStatus>((initial.status as PaymentStatus) ?? "draft");
  const [dueDate, setDueDate] = useState(initial.due_date ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form className="space-y-3 rounded-lg border border-border p-4"
      onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr(null);
        try {
          await upsertPayment({ data: {
            id: initial.id, project_id: projectId, title,
            description: description || null,
            amount: amount ? Number(amount.replace(",", ".")) : null,
            currency, status,
            due_date: dueDate || null,
          } });
          onSaved();
        } catch (e) { setErr(e instanceof Error ? e.message : "Ошибка"); }
        finally { setBusy(false); }
      }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="t" className="mb-1 block text-xs text-muted-foreground">Назначение</label>
          <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="s" className="mb-1 block text-xs text-muted-foreground">Статус</label>
          <select id="s" value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="a" className="mb-1 block text-xs text-muted-foreground">Сумма</label>
          <Input id="a" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" />
        </div>
        <div>
          <label htmlFor="c" className="mb-1 block text-xs text-muted-foreground">Валюта</label>
          <Input id="c" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} />
        </div>
        <div>
          <label htmlFor="d" className="mb-1 block text-xs text-muted-foreground">Срок</label>
          <Input id="d" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div>
        <label htmlFor="ds" className="mb-1 block text-xs text-muted-foreground">Комментарий</label>
        <Textarea id="ds" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>{busy ? "Сохранение…" : "Сохранить"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>Отмена</Button>
      </div>
    </form>
  );
}