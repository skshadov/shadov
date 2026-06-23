import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const outDir = '.audit/stage-4C-final-v4';
const finalRunId = '7b857074-2fb9-42f9-b676-8cfcee42a44f';
const runTag = `stage4c-v4-${finalRunId.slice(0,8)}-${Date.now()}`;
const url = process.env.SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!url || !service || !anon) throw new Error('Missing backend env');
const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
const publicAdmin = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
const password = `S4cV4!${crypto.randomUUID()}aA1`;
const email = (name) => `${runTag}-${name}@example.test`;

async function must(label, p) {
  const { data, error } = await p;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}
async function maybe(label, p) {
  const { data, error } = await p;
  if (error) console.error(label, error.message);
  return { data, error };
}
async function createUser(name, role) {
  const { data, error } = await admin.auth.admin.createUser({ email: email(name), password, email_confirm: true, user_metadata: { stage4c: runTag, actor: name } });
  if (error) throw new Error(`createUser ${name}: ${error.message}`);
  const id = data.user.id;
  await must(`profile ${name}`, admin.from('profiles').upsert({ id, display_name: name }));
  await must(`role ${name}`, admin.from('user_roles').insert({ user_id: id, role }));
  const sign = await publicAdmin.auth.signInWithPassword({ email: email(name), password });
  if (sign.error) throw new Error(`signIn ${name}: ${sign.error.message}`);
  return { name, email: email(name), id, access_token: sign.data.session.access_token };
}
const actors = {
  adminTest: await createUser('adminTest', 'admin'),
  clientA: await createUser('clientA', 'client'),
  clientB: await createUser('clientB', 'client'),
};

async function insert(table, row) {
  const data = await must(`insert ${table}`, admin.from(table).insert(row).select('*'));
  return Array.isArray(data) ? data[0] : data;
}
const today = new Date().toISOString().slice(0,10);
const now = new Date().toISOString();
const projectA = await insert('projects', { title: `${runTag} clientA project`, status: 'active', description: 'Stage 4C v4 clientA fixture', is_demo: false });
const projectB = await insert('projects', { title: `${runTag} clientB foreign project`, status: 'active', description: 'Stage 4C v4 clientB fixture', is_demo: false });
await insert('project_members', { project_id: projectA.id, user_id: actors.clientA.id, member_role: 'client' });
await insert('project_members', { project_id: projectB.id, user_id: actors.clientB.id, member_role: 'client' });
const stageA = await insert('project_stages', { project_id: projectA.id, sort_order: 1, title: `${runTag} pending stage`, description: 'AcceptanceDialog fixture', status: 'waiting_acceptance', planned_start: today, planned_end: today });
const stageB = await insert('project_stages', { project_id: projectB.id, sort_order: 1, title: `${runTag} foreign stage`, description: 'Foreign fixture', status: 'in_progress' });
const acceptanceA = await insert('project_stage_acceptances', { stage_id: stageA.id, attempt_number: 1, status: 'pending', requested_by: actors.adminTest.id });
const acceptanceB = await insert('project_stage_acceptances', { stage_id: stageB.id, attempt_number: 1, status: 'pending', requested_by: actors.adminTest.id });
const reportA = await insert('project_daily_reports', { project_id: projectA.id, report_date: today, title: `${runTag} report A`, summary: 'Published report A', work_completed: ['work'], next_steps: ['next'], issues: [], created_by: actors.adminTest.id, published_at: now });
const reportB = await insert('project_daily_reports', { project_id: projectB.id, report_date: today, title: `${runTag} report B`, summary: 'Published report B', work_completed: ['work'], next_steps: ['next'], issues: [], created_by: actors.adminTest.id, published_at: now });
const storagePath = `${runTag}/clientA-document.txt`;
await maybe('storage upload', admin.storage.from('project-documents').upload(storagePath, new Blob(['stage 4c v4 document'], { type: 'text/plain' }), { contentType: 'text/plain', upsert: true }));
const docA = await insert('project_documents', { project_id: projectA.id, storage_path: storagePath, file_name: 'clientA-document.txt', mime_type: 'text/plain', size_bytes: 20, document_category: 'audit', uploaded_by: actors.adminTest.id, title: `${runTag} doc A`, description: 'Visible fixture', document_date: today, is_visible_to_client: true });
const docB = await insert('project_documents', { project_id: projectB.id, storage_path: `${runTag}/clientB-document.txt`, file_name: 'clientB-document.txt', mime_type: 'text/plain', size_bytes: 20, document_category: 'audit', uploaded_by: actors.adminTest.id, title: `${runTag} doc B`, description: 'Foreign fixture', document_date: today, is_visible_to_client: true });
await insert('project_daily_report_documents', { report_id: reportA.id, document_id: docA.id, sort_order: 1 });
await insert('project_daily_report_documents', { report_id: reportB.id, document_id: docB.id, sort_order: 1 });
const cameraA = await insert('project_cameras', { project_id: projectA.id, name: `${runTag} camera A`, description: 'Camera fixture', status: 'online', sort_order: 1, last_checked_at: now });
const cameraB = await insert('project_cameras', { project_id: projectB.id, name: `${runTag} camera B`, description: 'Camera foreign fixture', status: 'online', sort_order: 1, last_checked_at: now });
const cameraNoSource = await insert('project_cameras', { project_id: projectA.id, name: `${runTag} camera no source`, description: 'Insert deny target', status: 'not_configured', sort_order: 2 });
await insert('project_camera_sources', { camera_id: cameraA.id, provider: 'audit', provider_camera_id: `${runTag}-provider-A`, configuration_reference: 'fixture-A' });
await insert('project_camera_sources', { camera_id: cameraB.id, provider: 'audit', provider_camera_id: `${runTag}-provider-B`, configuration_reference: 'fixture-B' });
const messageA = await insert('project_messages', { project_id: projectA.id, sender_id: actors.adminTest.id, message_type: 'system', body: `${runTag} message A` });
const messageB = await insert('project_messages', { project_id: projectB.id, sender_id: actors.adminTest.id, message_type: 'system', body: `${runTag} message B` });
const paymentA = await insert('project_payments', { project_id: projectA.id, stage_id: stageA.id, title: `${runTag} payment A`, description: 'Payment fixture', amount: 1000, currency: 'RUB', status: 'planned', due_date: today });
const paymentB = await insert('project_payments', { project_id: projectB.id, stage_id: stageB.id, title: `${runTag} payment B`, description: 'Payment foreign fixture', amount: 1000, currency: 'RUB', status: 'planned', due_date: today });

function headers(token, prefer = true) {
  const h = { apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (prefer) h.Prefer = 'return=representation';
  return h;
}
async function rest(actor, table, method, query = '', body = undefined) {
  const target = `${url}/rest/v1/${table}${query ? `?${query}` : ''}`;
  const res = await fetch(target, { method, headers: headers(actor.access_token), body: body === undefined ? undefined : JSON.stringify(body) });
  let parsed = null;
  const text = await res.text();
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: res.status, ok: res.ok, body: parsed };
}
function rows(r) { return Array.isArray(r.body) ? r.body : []; }
const scenarios = [];
function record(actor, table, operation, expected, r, passLogic, extra = {}) {
  const actual = passLogic(r) ? expected : (expected === 'allow' ? 'deny' : 'allow');
  scenarios.push({ actor: actor.name, table, operation, expected, actual, httpStatus: r.status, passed: actual === expected, ...extra });
}
const q = (parts) => parts.join('&');
const eq = (name, value) => `${name}=eq.${encodeURIComponent(value)}`;

async function adminCrud(table, payload, filterParts, patch) {
  const actor = actors.adminTest;
  let r = await rest(actor, table, 'POST', 'select=*', payload);
  record(actor, table, 'INSERT', 'allow', r, x => x.ok && rows(x).length > 0, { adminCrud: true });
  r = await rest(actor, table, 'GET', q(['select=*', ...filterParts]));
  record(actor, table, 'SELECT', 'allow', r, x => x.ok && rows(x).length > 0, { adminCrud: true });
  r = await rest(actor, table, 'PATCH', q(['select=*', ...filterParts]), patch);
  record(actor, table, 'UPDATE', 'allow', r, x => x.ok && rows(x).length > 0, { adminCrud: true });
  r = await rest(actor, table, 'DELETE', q(['select=*', ...filterParts]));
  record(actor, table, 'DELETE', 'allow', r, x => x.ok && rows(x).length > 0, { adminCrud: true });
}

const crudProjectId = crypto.randomUUID();
await adminCrud('projects', { id: crudProjectId, title: `${runTag} admin crud project`, status: 'draft', description: 'admin insert', is_demo: false }, [eq('id', crudProjectId)], { description: 'admin update' });
const pmProject = await insert('projects', { title: `${runTag} pm prereq`, status: 'active', is_demo: false });
await adminCrud('project_members', { project_id: pmProject.id, user_id: actors.clientB.id, member_role: 'viewer' }, [eq('project_id', pmProject.id), eq('user_id', actors.clientB.id)], { member_role: 'client' });
const stProject = await insert('projects', { title: `${runTag} stage prereq`, status: 'active', is_demo: false });
const stId = crypto.randomUUID();
await adminCrud('project_stages', { id: stId, project_id: stProject.id, sort_order: 10, title: `${runTag} admin stage`, description: 'admin insert', status: 'planned' }, [eq('id', stId)], { description: 'admin update' });
const repProject = await insert('projects', { title: `${runTag} report prereq`, status: 'active', is_demo: false });
const repId = crypto.randomUUID();
await adminCrud('project_daily_reports', { id: repId, project_id: repProject.id, report_date: today, title: `${runTag} admin report`, summary: 'admin insert', work_completed: ['a'], next_steps: ['b'], issues: [], created_by: actors.adminTest.id, published_at: now }, [eq('id', repId)], { summary: 'admin update' });
const joinProject = await insert('projects', { title: `${runTag} join prereq`, status: 'active', is_demo: false });
const joinReport = await insert('project_daily_reports', { project_id: joinProject.id, report_date: today, title: `${runTag} join report`, summary: 'join', work_completed: [], next_steps: [], issues: [], published_at: now });
const joinDoc = await insert('project_documents', { project_id: joinProject.id, storage_path: `${runTag}/join.txt`, file_name: 'join.txt', mime_type: 'text/plain', size_bytes: 1, title: 'join', is_visible_to_client: true });
await adminCrud('project_daily_report_documents', { report_id: joinReport.id, document_id: joinDoc.id, sort_order: 1 }, [eq('report_id', joinReport.id), eq('document_id', joinDoc.id)], { sort_order: 2 });
const accProject = await insert('projects', { title: `${runTag} acc prereq`, status: 'active', is_demo: false });
const accStage = await insert('project_stages', { project_id: accProject.id, sort_order: 1, title: `${runTag} acc stage`, status: 'waiting_acceptance' });
const accId = crypto.randomUUID();
await adminCrud('project_stage_acceptances', { id: accId, stage_id: accStage.id, attempt_number: 1, status: 'pending', requested_by: actors.adminTest.id }, [eq('id', accId)], { client_comment: 'admin update comment' });
const msgProject = await insert('projects', { title: `${runTag} msg prereq`, status: 'active', is_demo: false });
const msgId = crypto.randomUUID();
await adminCrud('project_messages', { id: msgId, project_id: msgProject.id, sender_id: actors.adminTest.id, message_type: 'system', body: 'admin insert' }, [eq('id', msgId)], { body: 'admin update' });
const payProject = await insert('projects', { title: `${runTag} pay prereq`, status: 'active', is_demo: false });
const payId = crypto.randomUUID();
await adminCrud('project_payments', { id: payId, project_id: payProject.id, title: `${runTag} admin payment`, description: 'admin insert', amount: 1, currency: 'RUB', status: 'planned', due_date: today }, [eq('id', payId)], { description: 'admin update' });
const docProject = await insert('projects', { title: `${runTag} doc prereq`, status: 'active', is_demo: false });
const docId = crypto.randomUUID();
await adminCrud('project_documents', { id: docId, project_id: docProject.id, storage_path: `${runTag}/admin-doc.txt`, file_name: 'admin-doc.txt', mime_type: 'text/plain', size_bytes: 1, document_category: 'audit', uploaded_by: actors.adminTest.id, title: `${runTag} admin doc`, is_visible_to_client: true }, [eq('id', docId)], { title: `${runTag} admin doc updated` });
const camProject = await insert('projects', { title: `${runTag} cam prereq`, status: 'active', is_demo: false });
const camId = crypto.randomUUID();
await adminCrud('project_cameras', { id: camId, project_id: camProject.id, name: `${runTag} admin camera`, description: 'admin insert', status: 'not_configured', sort_order: 1 }, [eq('id', camId)], { description: 'admin update' });
const srcProject = await insert('projects', { title: `${runTag} src prereq`, status: 'active', is_demo: false });
const srcCam = await insert('project_cameras', { project_id: srcProject.id, name: `${runTag} source camera`, status: 'not_configured', sort_order: 1 });
await adminCrud('project_camera_sources', { camera_id: srcCam.id, provider: 'audit', provider_camera_id: `${runTag}-crud-source`, configuration_reference: 'admin insert' }, [eq('camera_id', srcCam.id)], { configuration_reference: 'admin update' });

async function clientSelect(actor, label, table, filterParts, expected, needRows = true) {
  const r = await rest(actor, table, 'GET', q(['select=*', ...filterParts]));
  const pass = expected === 'allow' ? (x) => x.ok && (!needRows || rows(x).length > 0) : (x) => x.ok && rows(x).length === 0;
  record(actor, table, label, expected, r, pass, { clientScenario: true, rowCount: rows(r).length });
}
async function clientWrite(actor, operation, table, method, filterParts, payload, expected) {
  const r = await rest(actor, table, method, q(['select=*', ...filterParts]), payload);
  const pass = expected === 'allow' ? (x) => x.ok && rows(x).length > 0 : (x) => !x.ok || rows(x).length === 0;
  record(actor, table, operation, expected, r, pass, { clientScenario: true, rowCount: rows(r).length });
}
const own = [
  ['projects', [eq('id', projectA.id)], [eq('id', projectB.id)], { title: `${runTag} client project insert`, status: 'draft', is_demo: false }, [eq('id', projectA.id)], { description: 'client update denied' }],
  ['project_members', [eq('project_id', projectA.id), eq('user_id', actors.clientA.id)], [eq('project_id', projectB.id)], { project_id: projectA.id, user_id: actors.adminTest.id, member_role: 'client' }, [eq('project_id', projectA.id), eq('user_id', actors.clientA.id)], { member_role: 'viewer' }],
  ['project_stages', [eq('id', stageA.id)], [eq('id', stageB.id)], { project_id: projectA.id, sort_order: 99, title: 'client denied stage', status: 'planned' }, [eq('id', stageA.id)], { description: 'client update denied' }],
  ['project_daily_reports', [eq('id', reportA.id)], [eq('id', reportB.id)], { project_id: projectA.id, report_date: today, title: 'client denied report', summary: 'denied', work_completed: [], next_steps: [], issues: [], published_at: now }, [eq('id', reportA.id)], { summary: 'client update denied' }],
  ['project_daily_report_documents', [eq('report_id', reportA.id), eq('document_id', docA.id)], [eq('report_id', reportB.id), eq('document_id', docB.id)], { report_id: reportA.id, document_id: docB.id, sort_order: 9 }, [eq('report_id', reportA.id), eq('document_id', docA.id)], { sort_order: 9 }],
  ['project_stage_acceptances', [eq('id', acceptanceA.id)], [eq('id', acceptanceB.id)], { stage_id: stageA.id, attempt_number: 99, status: 'pending' }, [eq('id', acceptanceA.id)], { client_comment: 'client update denied' }],
  ['project_messages', [eq('id', messageA.id)], [eq('id', messageB.id)], { project_id: projectA.id, sender_id: actors.clientA.id, message_type: 'user', body: `${runTag} client own insert allowed` }, [eq('id', messageA.id)], { body: 'client update denied' }],
  ['project_payments', [eq('id', paymentA.id)], [eq('id', paymentB.id)], { project_id: projectA.id, title: 'client denied payment', amount: 10, currency: 'RUB', status: 'planned' }, [eq('id', paymentA.id)], { description: 'client update denied' }],
  ['project_documents', [eq('id', docA.id)], [eq('id', docB.id)], { project_id: projectA.id, storage_path: `${runTag}/client-denied-doc.txt`, file_name: 'client-denied-doc.txt', mime_type: 'text/plain', size_bytes: 1, title: 'client denied doc', is_visible_to_client: true }, [eq('id', docA.id)], { title: 'client update denied' }],
  ['project_cameras', [eq('id', cameraA.id)], [eq('id', cameraB.id)], { project_id: projectA.id, name: 'client denied camera', status: 'not_configured', sort_order: 99 }, [eq('id', cameraA.id)], { description: 'client update denied' }],
  ['project_camera_sources', [eq('camera_id', cameraA.id)], [eq('camera_id', cameraB.id)], { camera_id: cameraNoSource.id, provider: 'audit', provider_camera_id: `${runTag}-client-denied`, configuration_reference: 'denied' }, [eq('camera_id', cameraA.id)], { configuration_reference: 'client update denied' }],
];
for (const [table, ownFilter, foreignFilter, payload, updFilter, patch] of own) {
  const ownExpected = table === 'project_camera_sources' ? 'deny' : 'allow';
  await clientSelect(actors.clientA, 'SELECT_OWN', table, ownFilter, ownExpected);
  await clientSelect(actors.clientA, 'SELECT_FOREIGN', table, foreignFilter, 'deny');
  const insertExpected = table === 'project_messages' ? 'allow' : 'deny';
  await clientWrite(actors.clientA, 'INSERT_OWN', table, 'POST', [], payload, insertExpected);
  await clientWrite(actors.clientA, 'UPDATE_OWN', table, 'PATCH', updFilter, patch, 'deny');
  await clientWrite(actors.clientA, 'DELETE_OWN', table, 'DELETE', updFilter, undefined, 'deny');
}
await clientWrite(actors.clientA, 'INSERT_FOREIGN', 'project_messages', 'POST', [], { project_id: projectB.id, sender_id: actors.clientA.id, message_type: 'user', body: 'foreign denied' }, 'deny');

const adminCrudScenarios = scenarios.filter(s => s.adminCrud).length;
const failed = scenarios.filter(s => !s.passed);
const rls = {
  finalRunId, runTag, generatedAt: new Date().toISOString(),
  requirements: { rlsRealScenariosMinimum: 90, adminCrudScenariosMinimum: 44, statusNullScenariosForbidden: true },
  totals: { rlsRealScenarios: scenarios.length, rlsPassed: scenarios.length - failed.length, rlsFailed: failed.length, rlsNaCount: 0, adminCrudScenarios, adminCrudPassed: adminCrudScenarios >= 44 && scenarios.filter(s => s.adminCrud).every(s => s.passed) },
  actors: Object.fromEntries(Object.entries(actors).map(([k,v]) => [k, { userId: v.id, email: v.email, role: k === 'adminTest' ? 'admin' : 'client' }])),
  scenarios,
  failed,
};
writeFileSync(`${outDir}/rls-test-matrix.json`, JSON.stringify(rls, null, 2));
const state = { finalRunId, runTag, password, actors, projectA, projectB, stageA, stageB, acceptanceA, acceptanceB, reportA, reportB, docA, docB, cameraA, cameraB, cameraNoSource, messageA, messageB, paymentA, paymentB, storagePaths: [storagePath] };
writeFileSync(`${outDir}/test-state.json`, JSON.stringify(state, null, 2));
if (failed.length || scenarios.length < 90 || adminCrudScenarios < 44) process.exit(2);
