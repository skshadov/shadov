import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
const URL_ = process.env.SUPABASE_URL!;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY!;
const admin = createClient(URL_, SR, { auth: { persistSession: false } });
const stamp = Date.now();
const email = `s4c-dlg-${stamp}@stage4c.local`;
const pwd = "Stage4C-" + stamp;
const u = await admin.auth.admin.createUser({ email, password: pwd, email_confirm: true });
if (u.error) throw u.error;
const uid = u.data.user!.id;
const proj = await admin.from("projects").insert({ title: "s4c-dlg-proj", status: "active" }).select("id").single();
if (proj.error) throw proj.error;
const projectId = proj.data.id;
await admin.from("project_members").insert({ project_id: projectId, user_id: uid, member_role: "client" });
const st = await admin.from("project_stages").insert({ project_id: projectId, sort_order: 1, title: "Stage 4C dialog", status: "waiting_acceptance" }).select("id").single();
if (st.error) throw st.error;
const stageId = st.data.id;
const acc = await admin.from("project_stage_acceptances").insert({ stage_id: stageId, attempt_number: 1, status: "pending", requested_at: new Date().toISOString() }).select("id").single();
if (acc.error) throw acc.error;
// sign in to mint session
const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
const s = await anon.auth.signInWithPassword({ email, password: pwd });
if (s.error || !s.data.session) throw s.error || new Error("no session");
writeFileSync("/tmp/browser/dialog/state.json", JSON.stringify({
  email, uid, projectId, stageId, acceptanceId: acc.data.id,
  session: s.data.session,
}));
console.log("setup ok", projectId);
