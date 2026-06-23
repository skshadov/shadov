import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAdminSession, hasPermission } from "@/lib/admin/use-admin-session";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  listCameras, upsertCamera, deleteCamera, configureCameraSource,
  type CameraItem, type CameraStatus,
} from "@/lib/admin/communications.functions";

export const Route = createFileRoute("/admin/projects/$id/cameras")({
  head: () => ({ meta: [{ title: "Камеры — Админ-панель" }, { name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  component: ProjectCamerasPage,
});

const STATUSES: CameraStatus[] = ["active", "paused", "offline", "archived"];

function ProjectCamerasPage() {
  const session = useAdminSession();
  const { id } = useParams({ from: "/admin/projects/$id/cameras" });
  const [items, setItems] = useState<CameraItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const reload = useCallback(() => {
    listCameras({ data: { project_id: id } })
      .then(setItems)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, [id]);
  useEffect(() => { if (session.status === "authenticated") reload(); }, [session.status, reload]);

  if (session.status !== "authenticated") return null;
  if (!hasPermission(session, "admin.cameras.read")) {
    return <AdminLayout admin={session.admin} title="Камеры" breadcrumbs={[{ label: "Админ-панель", to: "/admin" }]}><p>Нет доступа.</p></AdminLayout>;
  }
  const canWrite = hasPermission(session, "admin.cameras.write");
  const canConfigure = hasPermission(session, "admin.cameras.configure");

  return (
    <AdminLayout admin={session.admin} title="Камеры стройплощадки"
      breadcrumbs={[
        { label: "Админ-панель", to: "/admin" },
        { label: "Проекты", to: "/admin/projects" },
        { label: "Проект", to: `/admin/projects/${id}` },
        { label: "Камеры" },
      ]}>
      {error ? <div role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}

      {canWrite ? (
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>{adding ? "Отмена" : "Добавить камеру"}</Button>
          {adding ? (
            <>
              <Input className="max-w-xs" placeholder="Название (например: «Северный фасад»)"
                value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Button size="sm" disabled={!newName.trim()} onClick={async () => {
                try {
                  await upsertCamera({ data: {
                    project_id: id, name: newName,
                    sort_order: (items?.at(-1)?.sort_order ?? -1) + 1,
                  } });
                  setNewName(""); setAdding(false); reload();
                } catch (e) { alert(e instanceof Error ? e.message : "Ошибка"); }
              }}>Создать</Button>
            </>
          ) : null}
        </div>
      ) : null}

      {items === null ? <p className="text-sm text-muted-foreground">Загрузка…</p>
        : items.length === 0 ? <p className="text-sm text-muted-foreground">Камер нет.</p>
        : (
          <ul className="space-y-3">
            {items.map((c) => (
              <CameraCard key={c.id} cam={c}
                canWrite={canWrite} canConfigure={canConfigure}
                onChanged={reload} />
            ))}
          </ul>
        )}

      <p className="mt-6 text-xs text-muted-foreground">
        Реквизиты RTSP/RTMP и токены здесь не хранятся: пользователю доступен лишь идентификатор камеры у провайдера.
        Поле «Configuration reference» зарезервировано под безопасную ссылку (например, имя записи в защищённом хранилище).
      </p>
      <p className="mt-4 text-xs"><Link to="/admin/projects/$id" params={{ id }} className="underline">← К проекту</Link></p>
    </AdminLayout>
  );
}

function CameraCard({ cam, canWrite, canConfigure, onChanged }: {
  cam: CameraItem; canWrite: boolean; canConfigure: boolean; onChanged: () => void;
}) {
  const [name, setName] = useState(cam.name);
  const [description, setDescription] = useState(cam.description ?? "");
  const [status, setStatus] = useState<CameraStatus>(cam.status);
  const [provider, setProvider] = useState(cam.provider ?? "");
  const [providerCamId, setProviderCamId] = useState(cam.provider_camera_id ?? "");
  const [configRef, setConfigRef] = useState(cam.configuration_reference ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <li className="rounded-lg border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Название</label>
          <Input disabled={!canWrite} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Статус</label>
          <select disabled={!canWrite} value={status} onChange={(e) => setStatus(e.target.value as CameraStatus)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-muted-foreground">Описание</label>
          <Textarea disabled={!canWrite} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Провайдер</label>
          <Input disabled={!canConfigure} placeholder="ivideon | dahua | rtsp-proxy" value={provider} onChange={(e) => setProvider(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">ID камеры у провайдера</label>
          <Input disabled={!canConfigure} value={providerCamId} onChange={(e) => setProviderCamId(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-muted-foreground">Configuration reference (без секретов и URL)</label>
          <Input disabled={!canConfigure} value={configRef} onChange={(e) => setConfigRef(e.target.value)} maxLength={200} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canWrite ? (
          <Button size="sm" disabled={busy} onClick={async () => {
            setBusy(true); setMsg(null);
            try {
              await upsertCamera({ data: { id: cam.id, project_id: cam.project_id, name, description: description || null, status, sort_order: cam.sort_order } });
              setMsg("Сохранено"); onChanged();
            } catch (e) { setMsg(e instanceof Error ? e.message : "Ошибка"); }
            finally { setBusy(false); }
          }}>Сохранить</Button>
        ) : null}
        {canConfigure ? (
          <Button size="sm" variant="outline" disabled={busy || !provider || !providerCamId} onClick={async () => {
            setBusy(true); setMsg(null);
            try {
              await configureCameraSource({ data: {
                camera_id: cam.id, provider, provider_camera_id: providerCamId,
                configuration_reference: configRef || null,
              } });
              setMsg("Источник обновлён"); onChanged();
            } catch (e) { setMsg(e instanceof Error ? e.message : "Ошибка"); }
            finally { setBusy(false); }
          }}>Привязать источник</Button>
        ) : null}
        {canWrite ? (
          <Button size="sm" variant="ghost" disabled={busy} onClick={async () => {
            if (!confirm(`Удалить камеру «${cam.name}»?`)) return;
            try { await deleteCamera({ data: { id: cam.id } }); onChanged(); }
            catch (e) { alert(e instanceof Error ? e.message : "Ошибка"); }
          }}>Удалить</Button>
        ) : null}
        {msg ? <span className="text-xs text-muted-foreground">{msg}</span> : null}
        {cam.last_checked_at ? <span className="ml-auto text-xs text-muted-foreground">Проверено: {new Date(cam.last_checked_at).toLocaleString("ru-RU")}</span> : null}
      </div>
    </li>
  );
}