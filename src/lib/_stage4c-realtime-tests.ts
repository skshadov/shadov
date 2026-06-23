import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "fs";

const URL_ = process.env.SUPABASE_URL!;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY!;
const admin = createClient(URL_, SR, { auth: { persistSession: false } });

type Event = { client: string; channel: string; project_id: string; message_id: string; event_type: string; body_length: number; foreign_keys_present: boolean };
const events: Event[] = [];

const stamp = Date.now();
const emailA = `s4c-rt-A-${stamp}@stage4c.local`;
const emailB = `s4c-rt-B-${stamp}@stage4c.local`;
const pwd = "Stage4C-" + stamp;

let uidA="", uidB="", projectA="", projectB="";

async function setup() {
  const uA = await admin.auth.admin.createUser({ email: emailA, password: pwd, email_confirm: true });
  if (uA.error) throw uA.error; uidA = uA.data.user!.id;
  const uB = await admin.auth.admin.createUser({ email: emailB, password: pwd, email_confirm: true });
  if (uB.error) throw uB.error; uidB = uB.data.user!.id;
  const pA = await admin.from("projects").insert({ title: "s4c-rt-A", status: "active" }).select("id").single();
  projectA = pA.data!.id;
  const pB = await admin.from("projects").insert({ title: "s4c-rt-B", status: "active" }).select("id").single();
  projectB = pB.data!.id;
  await admin.from("project_members").insert([
    { project_id: projectA, user_id: uidA, member_role: "client" },
    { project_id: projectB, user_id: uidB, member_role: "client" },
  ]);
}

async function signIn(email: string): Promise<string> {
  const c = createClient(URL_, ANON, { auth: { persistSession: false } });
  const r = await c.auth.signInWithPassword({ email, password: pwd });
  if (r.error || !r.data.session) throw new Error("signin: " + r.error?.message);
  return r.data.session.access_token;
}

function realtimeClient(token: string) {
  const c = createClient(URL_, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  c.realtime.setAuth(token);
  return c;
}

async function teardown() {
  await admin.from("project_messages").delete().in("project_id", [projectA, projectB]);
  await admin.from("project_members").delete().in("project_id", [projectA, projectB]);
  await admin.from("projects").delete().in("id", [projectA, projectB]);
  await admin.from("user_roles").delete().in("user_id", [uidA, uidB]);
  await admin.from("profiles").delete().in("id", [uidA, uidB]);
  for (const u of [uidA, uidB]) await admin.auth.admin.deleteUser(u);
}

await setup();
try {
  const tokenA = await signIn(emailA);
  const tokenB = await signIn(emailB);
  const cA = realtimeClient(tokenA);
  const cB = realtimeClient(tokenB);

  function subscribe(client: any, label: string, projectId: string) {
    return new Promise<any>((resolve) => {
      const ch = client.channel(`rt-${label}-${projectId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "project_messages", filter: `project_id=eq.${projectId}` }, (payload: any) => {
          const row = payload.new || payload.old || {};
          const body = typeof row.body === "string" ? row.body : "";
          events.push({
            client: label, channel: `rt-${label}-${projectId}`,
            project_id: row.project_id || "",
            message_id: row.id || "",
            event_type: payload.eventType || payload.event,
            body_length: body.length,
            foreign_keys_present: !!(row.sender_id && row.project_id),
          });
        })
        .subscribe((status: string) => { if (status === "SUBSCRIBED") resolve(ch); });
    });
  }

  const chA_A = await subscribe(cA, "clientA", projectA);
  const chB_A = await subscribe(cB, "clientB-on-A", projectA);
  const chB_B = await subscribe(cB, "clientB", projectB);
  // wait subscriptions
  await new Promise(r => setTimeout(r, 3000));

  // clientA inserts into projectA via authenticated client
  const httpA = createClient(URL_, ANON, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${tokenA}` } } });
  const msgA = await httpA.from("project_messages").insert({ project_id: projectA, sender_id: uidA, message_type: "user", body: "rt-test-A" }).select("id").single();
  if (msgA.error) throw new Error("insertA: " + msgA.error.message);

  // clientB inserts into projectB
  const httpB = createClient(URL_, ANON, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${tokenB}` } } });
  const msgB = await httpB.from("project_messages").insert({ project_id: projectB, sender_id: uidB, message_type: "user", body: "rt-test-B" }).select("id").single();
  if (msgB.error) throw new Error("insertB: " + msgB.error.message);

  // wait for events
  await new Promise(r => setTimeout(r, 6000));

  await cA.removeAllChannels();
  await cB.removeAllChannels();

  // Analyse
  const clientAEvents = events.filter(e => e.client === "clientA");
  const clientBOnAEvents = events.filter(e => e.client === "clientB-on-A");
  const clientBEvents = events.filter(e => e.client === "clientB");

  const clientAReceivedOwn = clientAEvents.some(e => e.project_id === projectA && e.message_id === msgA.data.id);
  const clientAReceivedForeign = clientAEvents.some(e => e.project_id === projectB);
  const clientBReceivedOwn = clientBEvents.some(e => e.project_id === projectB && e.message_id === msgB.data.id);
  const clientBReceivedForeign = clientBEvents.some(e => e.project_id === projectA);
  // clientB subscribed to projectA but is NOT a member — RLS should block delivery
  const clientBOnAReceivedAny = clientBOnAEvents.some(e => e.project_id === projectA);

  const result = {
    finalRunId: "623bbba1-8134-463d-8c21-7d295180e01b",
    generatedAt: new Date().toISOString(),
    executed: true,
    clientAReceivedOwn,
    clientBReceivedOwn,
    clientAReceivedForeign,
    clientBReceivedForeign,
    clientBSubscribedToForeignProjectGotEvent: clientBOnAReceivedAny,
    foreignPayloadReceived: clientAReceivedForeign || clientBReceivedForeign || clientBOnAReceivedAny,
    eventCounts: { clientA: clientAEvents.length, clientBOnA: clientBOnAEvents.length, clientB: clientBEvents.length },
    eventsAnonymized: events.map(e => ({ ...e })), // body_length only; no body text/jwt/PII
    passed: clientAReceivedOwn && clientBReceivedOwn && !clientAReceivedForeign && !clientBReceivedForeign && !clientBOnAReceivedAny,
  };
  mkdirSync(".audit/stage-4C/final", { recursive: true });
  writeFileSync(".audit/stage-4C/final/realtime-tests.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ passed: result.passed, counts: result.eventCounts, foreign: result.foreignPayloadReceived }, null, 2));
} finally {
  await teardown();
}
