import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminSession, hasPermission } from "@/lib/admin/use-admin-session";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  listProjectDocuments, createDocumentUploadUrl, registerUploadedDocument,
  updateDocumentMeta, deleteDocument, getDocumentDownloadUrl,
  type DocumentItem,
} from "@/lib/admin/documents.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/projects/$id/documents")({
  head: () => ({ meta: [{ title: "Документы проекта — Админ-панель" }, { name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  component: ProjectDocumentsPage,
});

const CATEGORIES = ["", "contract", "estimate", "permit", "act", "photo", "report", "other"];

function ProjectDocumentsPage() {
  const session = useAdminSession();
  const { id } = useParams({ from: "/admin/projects/$id/documents" });
  const [items, setItems] = useState<DocumentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    listProjectDocuments({ data: { project_id: id } })
      .then(setItems)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, [id]);
  useEffect(() => { if (session.status === "authenticated") reload(); }, [session.status, reload]);

  if (session.status !== "authenticated") return null;
  if (!hasPermission(session, "admin.documents.read")) {
    return <AdminLayout admin={session.admin} title="Документы" breadcrumbs={[{ label: "Админ-панель", to: "/admin" }, { label: "Проекты", to: "/admin/projects" }]}><p>Нет доступа.</p></AdminLayout>;
  }
  const canWrite = hasPermission(session, "admin.documents.write");

  return (
    <AdminLayout admin={session.admin} title="Документы проекта"
      breadcrumbs={[
        { label: "Админ-панель", to: "/admin" },
        { label: "Проекты", to: "/admin/projects" },
        { label: "Проект", to: "/admin/projects/$id", params: { id } },
        { label: "Документы" },
      ]}>
      {error ? <div role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}
      {canWrite ? <Uploader projectId={id} onUploaded={reload} /> : null}
      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Файл</th>
              <th className="px-3 py-2">Категория</th>
              <th className="px-3 py-2">Размер</th>
              <th className="px-3 py-2">Клиенту</th>
              <th className="px-3 py-2">Загружен</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items === null ? <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Загрузка…</td></tr>
              : items.length === 0 ? <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Документов нет.</td></tr>
              : items.map((d) => <DocRow key={d.id} doc={d} canWrite={canWrite} onChanged={reload} />)}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Файлы хранятся в защищённом bucket. Скачивание выдаётся как одноразовая подписанная ссылка на 5 минут.
      </p>
      <p className="mt-2 text-xs">
        <Link to="/admin/projects/$id" params={{ id }} className="underline">← К проекту</Link>
      </p>
    </AdminLayout>
  );
}

function Uploader({ projectId, onUploaded }: { projectId: string; onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [category, setCategory] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      const upload = await createDocumentUploadUrl({ data: {
        project_id: projectId, file_name: file.name, mime_type: file.type || "application/octet-stream", size_bytes: file.size,
      } });
      const { error: upErr } = await supabase.storage.from(upload.bucket)
        .uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type || undefined });
      if (upErr) throw upErr;
      await registerUploadedDocument({ data: {
        project_id: projectId, storage_path: upload.path, file_name: file.name,
        mime_type: file.type || "application/octet-stream", size_bytes: file.size,
        document_category: category || undefined, is_visible_to_client: visible,
      } });
      setMsg("Загружено");
      onUploaded();
    } catch (err) { setMsg(err instanceof Error ? err.message : "Ошибка загрузки"); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  return (
    <section className="rounded-lg border border-dashed border-border p-4">
      <h2 className="text-base font-semibold">Загрузить документ</h2>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground" htmlFor="cat">Категория</label>
          <select id="cat" value={category} onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c || "—"}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          Показывать клиенту
        </label>
        <Input ref={inputRef} type="file" onChange={onPick} disabled={busy} className="max-w-xs" />
        {busy ? <span className="text-xs text-muted-foreground">Загрузка…</span> : null}
        {msg ? <span className="text-xs">{msg}</span> : null}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">PDF / DOCX / XLSX / JPG / PNG / WEBP / TXT / CSV. До 50 МБ.</p>
    </section>
  );
}

function DocRow({ doc, canWrite, onChanged }: { doc: DocumentItem; canWrite: boolean; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(doc.title ?? "");
  const [category, setCategory] = useState(doc.document_category ?? "");
  const [visible, setVisible] = useState(doc.is_visible_to_client);
  const [busy, setBusy] = useState(false);

  async function download() {
    try {
      const { url } = await getDocumentDownloadUrl({ data: { id: doc.id } });
      window.open(url, "_blank", "noopener");
    } catch (e) { alert(e instanceof Error ? e.message : "Ошибка"); }
  }

  return (
    <tr>
      <td className="px-3 py-2">
        {editing ? <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={doc.file_name} />
          : <>
            <div className="font-medium">{doc.title || doc.file_name}</div>
            <div className="text-xs text-muted-foreground">{doc.file_name}</div>
          </>}
      </td>
      <td className="px-3 py-2 text-xs">
        {editing ? (
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c || "—"}</option>)}
          </select>
        ) : (doc.document_category ?? "—")}
      </td>
      <td className="px-3 py-2 text-xs">{(doc.size_bytes / 1024).toFixed(0)} КБ</td>
      <td className="px-3 py-2 text-xs">
        {editing ? <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          : (doc.is_visible_to_client ? "Да" : "Нет")}
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString("ru-RU")}</td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="outline" onClick={download}>Скачать</Button>
          {canWrite && !editing ? <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Изм.</Button> : null}
          {canWrite && editing ? (
            <>
              <Button size="sm" disabled={busy} onClick={async () => {
                setBusy(true);
                try {
                  await updateDocumentMeta({ data: { id: doc.id, title: title || null, document_category: category || null, is_visible_to_client: visible } });
                  setEditing(false); onChanged();
                } catch (e) { alert(e instanceof Error ? e.message : "Ошибка"); }
                finally { setBusy(false); }
              }}>OK</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Отм.</Button>
            </>
          ) : null}
          {canWrite ? <Button size="sm" variant="ghost" onClick={async () => {
            if (!confirm(`Удалить документ «${doc.title || doc.file_name}»?`)) return;
            try { await deleteDocument({ data: { id: doc.id } }); onChanged(); }
            catch (e) { alert(e instanceof Error ? e.message : "Ошибка"); }
          }}>×</Button> : null}
        </div>
      </td>
    </tr>
  );
}