/**
 * Этап 4 — типизированные обёртки над Supabase для личного кабинета.
 * Защита данных полностью обеспечивается RLS. Эти функции не используют
 * service role и не доверяют URL параметрам.
 */
import { supabase } from "@/integrations/supabase/client";

export type ProjectRow = {
  id: string;
  title: string;
  status: string;
  description: string | null;
  is_demo: boolean;
};

export type StageRow = {
  id: string;
  project_id: string;
  sort_order: number;
  title: string;
  description: string | null;
  status: string;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
};

export type DailyReportRow = {
  id: string;
  project_id: string;
  report_date: string;
  title: string;
  summary: string;
  work_completed: string[];
  next_steps: string[];
  issues: string[];
  published_at: string | null;
};

export type AcceptanceRow = {
  id: string;
  stage_id: string;
  attempt_number: number;
  status: "pending" | "accepted" | "changes_requested" | "cancelled";
  requested_at: string;
  responded_at: string | null;
  client_comment: string | null;
};

export type CameraRow = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: "not_configured" | "online" | "offline" | "maintenance";
  sort_order: number;
  last_checked_at: string | null;
};

export type MessageRow = {
  id: string;
  project_id: string;
  sender_id: string | null;
  message_type: "user" | "system";
  body: string;
  created_at: string;
};

export type PaymentRow = {
  id: string;
  project_id: string;
  stage_id: string | null;
  title: string;
  description: string | null;
  amount: number | null;
  currency: string;
  status: "planned" | "invoiced" | "paid" | "cancelled";
  due_date: string | null;
  paid_at: string | null;
};

export type DocumentRow = {
  id: string;
  project_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  document_category: string | null;
  title: string | null;
  description: string | null;
  document_date: string | null;
  is_visible_to_client: boolean;
  created_at: string;
};

const PROJECT_COLS =
  "id,title,status,description,is_demo";
const STAGE_COLS =
  "id,project_id,sort_order,title,description,status,planned_start,planned_end,actual_start,actual_end";
const REPORT_COLS =
  "id,project_id,report_date,title,summary,work_completed,next_steps,issues,published_at";
const ACC_COLS =
  "id,stage_id,attempt_number,status,requested_at,responded_at,client_comment";
const CAM_COLS =
  "id,project_id,name,description,status,sort_order,last_checked_at";
const MSG_COLS = "id,project_id,sender_id,message_type,body,created_at";
const PAY_COLS =
  "id,project_id,stage_id,title,description,amount,currency,status,due_date,paid_at";
const DOC_COLS =
  "id,project_id,storage_path,file_name,mime_type,size_bytes,document_category,title,description,document_date,is_visible_to_client,created_at";

export async function listMyProjects(): Promise<ProjectRow[]> {
  // RLS на projects: пользователь видит только проекты, где состоит в project_members
  // (политика существует с этапа 3B). Если её нет — клиент получит пустой список.
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectRow[];
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_COLS)
    .eq("id", id)
    .maybeSingle();
  return (data as ProjectRow | null) ?? null;
}

export async function listStages(projectId: string): Promise<StageRow[]> {
  const { data, error } = await supabase
    .from("project_stages")
    .select(STAGE_COLS)
    .eq("project_id", projectId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as StageRow[];
}

export async function listReports(projectId: string): Promise<DailyReportRow[]> {
  const { data, error } = await supabase
    .from("project_daily_reports")
    .select(REPORT_COLS)
    .eq("project_id", projectId)
    .not("published_at", "is", null)
    .order("report_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DailyReportRow[];
}

export async function listAcceptances(stageIds: string[]): Promise<AcceptanceRow[]> {
  if (stageIds.length === 0) return [];
  const { data, error } = await supabase
    .from("project_stage_acceptances")
    .select(ACC_COLS)
    .in("stage_id", stageIds)
    .order("requested_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AcceptanceRow[];
}

export async function listCameras(projectId: string): Promise<CameraRow[]> {
  const { data, error } = await supabase
    .from("project_cameras")
    .select(CAM_COLS)
    .eq("project_id", projectId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as CameraRow[];
}

export async function listMessages(projectId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("project_messages")
    .select(MSG_COLS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function sendMessage(projectId: string, body: string, senderId: string): Promise<MessageRow> {
  const { data, error } = await supabase
    .from("project_messages")
    .insert({ project_id: projectId, body, sender_id: senderId, message_type: "user" })
    .select(MSG_COLS)
    .single();
  if (error) throw error;
  return data as MessageRow;
}

export async function listPayments(projectId: string): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from("project_payments")
    .select(PAY_COLS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PaymentRow[];
}

export async function listDocuments(projectId: string): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from("project_documents")
    .select(DOC_COLS)
    .eq("project_id", projectId)
    .eq("is_visible_to_client", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocumentRow[];
}

export async function respondToAcceptance(
  acceptanceId: string,
  decision: "accepted" | "changes_requested",
  comment: string | null,
): Promise<{ status: string; stage_status: string }> {
  const { data, error } = await supabase.rpc("respond_to_stage_acceptance", {
    acceptance_id: acceptanceId,
    decision,
    comment,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { status: row?.status_out as string, stage_status: row?.stage_status_out as string };
}

export async function requestDocumentSignedUrl(documentId: string): Promise<{ url: string; expires_in: number }> {
  const { data, error } = await supabase.functions.invoke("get-project-document-url", {
    body: { document_id: documentId },
  });
  if (error) throw error;
  return data as { url: string; expires_in: number };
}

export async function requestCameraSession(cameraId: string): Promise<
  { success: true; viewer_url: string; expires_in: number } | { success: false; code: string }
> {
  const { data, error } = await supabase.functions.invoke("get-project-camera-session", {
    body: { camera_id: cameraId },
  });
  if (error) throw error;
  return data as never;
}