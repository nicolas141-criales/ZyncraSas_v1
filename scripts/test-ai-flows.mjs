/**
 * E2E test suite for the Zyncra AI booking agent.
 * Requires: Next.js dev server running + Ollama running with the configured model.
 * Usage: node scripts/test-ai-flows.mjs
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// ── Load .env.local ───────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch { /* no .env.local — rely on existing env */ }
}
loadEnv();

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL   = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const AI_SECRET  = process.env.AI_API_SECRET ?? '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Barbería Pipe — tenant with real services, professionals, and clients
const TENANT_ID    = 'db477f77-b0bf-4852-ab72-92c9e815573d';
const SERVICE_ID   = 'a0eec2d7-7b33-4615-9b16-6412c3270bb5'; // Corte Basico, 30 min
const PROF_ID      = '6fb43e45-6a11-466e-b2f9-41e980890dd7'; // Nicolas Criales

// Isolated test phones — not real Colombian numbers, won't conflict with prod clients
const PHONE_CANCEL     = '5719000000091';
const PHONE_RESCHEDULE = '5719000000092';
const PHONE_BOOK       = '5719000000093';

const db = createClient(SUPABASE_URL, SERVICE_KEY);

// Dates
const bogota   = new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' });
const today    = new Date(bogota);
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
const TOMORROW  = tomorrow.toISOString().slice(0, 10);
const DAY_AFTER = dayAfter.toISOString().slice(0, 10);

// ── Test state ────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function pass(msg) {
  passed++;
  console.log(`    ✓  ${msg}`);
}

function fail(msg) {
  failed++;
  failures.push(msg);
  console.log(`    ✗  ${msg}`);
}

function assertToolCalled(toolCalls, toolName, context) {
  if ((toolCalls ?? []).includes(toolName)) pass(`${context} — ${toolName} called`);
  else fail(`${context} — ${toolName} NOT called  (got: [${(toolCalls ?? []).join(', ')}])`);
}

function assertToolCalledInTurns(turns, toolName, context) {
  const all = turns.flatMap(t => t.tool_calls ?? []);
  if (all.includes(toolName)) pass(`${context} — ${toolName} called`);
  else fail(`${context} — ${toolName} NOT called across turns  (got: [${all.join(', ')}])`);
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function turn(phone, text, reset = false) {
  // Small pause between turns so the server can release resources from the previous Ollama call
  if (!reset) await new Promise(r => setTimeout(r, 3000));

  const res = await fetch(`${BASE_URL}/api/ai/test-turn`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_SECRET}` },
    body:    JSON.stringify({ tenant_id: TENANT_ID, phone, text, reset }),
    signal:  AbortSignal.timeout(420_000), // 7 min per turn — qwen3-coder on CPU can be slow
  });
  const body = await res.json();
  if (!res.ok || !body.ok) throw new Error(`test-turn failed: ${body.error ?? res.status}`);
  return body;
}

function logTurn(n, text, result) {
  const tools = (result.tool_calls ?? []).filter(Boolean);
  console.log(`\n  [Turn ${n}] "${text}"`);
  console.log(`   Reply  : ${result.reply.slice(0, 180)}${result.reply.length > 180 ? '…' : ''}`);
  console.log(`   Tools  : [${tools.join(', ')}]`);
  console.log(`   Time   : ${result.elapsed_ms}ms`);
}

// ── Fixture helpers ───────────────────────────────────────────────────────────
async function createTestClient(phone, name) {
  const { data, error } = await db
    .from('clients')
    .insert({ tenant_id: TENANT_ID, name, phone })
    .select('id')
    .single();
  if (error) throw new Error(`createTestClient: ${error.message}`);
  return data.id;
}

async function createTestAppointment(clientId, date, time) {
  const { data, error } = await db
    .from('appointments')
    .insert({ tenant_id: TENANT_ID, client_id: clientId, service_id: SERVICE_ID, professional_id: PROF_ID, appointment_date: date, appointment_time: time, status: 'pending' })
    .select('id')
    .single();
  if (error) throw new Error(`createTestAppointment: ${error.message}`);
  return data.id;
}

async function getAppointment(id) {
  const { data } = await db.from('appointments').select('id,status,appointment_date,appointment_time').eq('id', id).single();
  return data;
}

async function cleanup(phone) {
  const { data: clients } = await db.from('clients').select('id').eq('tenant_id', TENANT_ID).eq('phone', phone);
  for (const c of (clients ?? [])) {
    await db.from('appointments').delete().eq('tenant_id', TENANT_ID).eq('client_id', c.id);
    await db.from('clients').delete().eq('id', c.id);
  }
  await db.from('ai_conversations').delete().eq('tenant_id', TENANT_ID).eq('phone', phone);
}

// ── TEST 1: CANCEL ────────────────────────────────────────────────────────────
async function testCancel() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  TEST 1 — CANCEL FLOW                        ║');
  console.log('╚══════════════════════════════════════════════╝');

  await cleanup(PHONE_CANCEL);
  const clientId = await createTestClient(PHONE_CANCEL, 'Test Cancel');
  const apptId   = await createTestAppointment(clientId, TOMORROW, '14:00:00');
  console.log(`  Setup : client ${clientId}`);
  console.log(`  Appt  : ${apptId}  —  ${TOMORROW} 14:00  (Corte Basico / Nicolas Criales)`);

  const turns = [];

  try {
    // Turn 1 — initiate
    const t1 = await turn(PHONE_CANCEL, 'Hola, quiero cancelar mi cita', true);
    logTurn(1, 'Hola, quiero cancelar mi cita', t1);
    turns.push(t1);
    assertToolCalled(t1.tool_calls, 'get_client', 'Turn 1');

    // Turn 2 — confirm
    const t2 = await turn(PHONE_CANCEL, 'Sí, cancela esa cita por favor');
    logTurn(2, 'Sí, cancela esa cita por favor', t2);
    turns.push(t2);

    // Allow up to one more turn if model asked "¿estás seguro?"
    let cancelCalled = (t2.tool_calls ?? []).includes('cancel_appointment');
    if (!cancelCalled) {
      const t3 = await turn(PHONE_CANCEL, 'Confirmo, cancela la cita');
      logTurn(3, 'Confirmo, cancela la cita', t3);
      turns.push(t3);
    }

    assertToolCalledInTurns(turns.slice(1), 'cancel_appointment', 'Turns 2-3');

    // DB verification
    const appt = await getAppointment(apptId);
    if (appt?.status === 'cancelled') pass(`DB verify — status = "cancelled"`);
    else fail(`DB verify — status = "${appt?.status}" (expected "cancelled")`);

  } finally {
    await cleanup(PHONE_CANCEL);
  }
}

// ── TEST 2: RESCHEDULE ────────────────────────────────────────────────────────
async function testReschedule() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  TEST 2 — RESCHEDULE FLOW                    ║');
  console.log('╚══════════════════════════════════════════════╝');

  await cleanup(PHONE_RESCHEDULE);
  const clientId = await createTestClient(PHONE_RESCHEDULE, 'Test Reschedule');
  const apptId   = await createTestAppointment(clientId, TOMORROW, '10:00:00');
  console.log(`  Setup : client ${clientId}`);
  console.log(`  Appt  : ${apptId}  —  ${TOMORROW} 10:00  (moving to ${DAY_AFTER})`);

  const turns = [];

  try {
    // Turn 1 — initiate
    const msg1 = `Hola, quiero mover mi cita para el ${DAY_AFTER}`;
    const t1 = await turn(PHONE_RESCHEDULE, msg1, true);
    logTurn(1, msg1, t1);
    turns.push(t1);
    assertToolCalled(t1.tool_calls, 'get_client', 'Turn 1');

    // Turn 2 — pick slot / trigger availability check
    const t2 = await turn(PHONE_RESCHEDULE, 'A las 11:00, el mismo profesional');
    logTurn(2, 'A las 11:00, el mismo profesional', t2);
    turns.push(t2);

    // check_availability may appear in turn 1 or 2
    assertToolCalledInTurns(turns, 'check_availability', 'Turns 1-2');

    // Turn 3 — confirm
    const t3 = await turn(PHONE_RESCHEDULE, 'Sí, confirmo el cambio');
    logTurn(3, 'Sí, confirmo el cambio', t3);
    turns.push(t3);

    let rescheduleCalled = turns.some(t => (t.tool_calls ?? []).includes('reschedule_appointment'));
    if (!rescheduleCalled) {
      const t4 = await turn(PHONE_RESCHEDULE, 'Confirmo');
      logTurn(4, 'Confirmo', t4);
      turns.push(t4);
    }

    assertToolCalledInTurns(turns.slice(1), 'reschedule_appointment', 'Turns 2-4');

    // DB verification
    const appt = await getAppointment(apptId);
    if (appt?.appointment_date === DAY_AFTER) pass(`DB verify — date updated to ${DAY_AFTER}`);
    else fail(`DB verify — date = "${appt?.appointment_date}" (expected "${DAY_AFTER}")`);

  } finally {
    await cleanup(PHONE_RESCHEDULE);
  }
}

// ── TEST 3: BOOK ──────────────────────────────────────────────────────────────
async function testBook() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  TEST 3 — BOOK FLOW                          ║');
  console.log('╚══════════════════════════════════════════════╝');

  await cleanup(PHONE_BOOK);
  console.log(`  Phone : ${PHONE_BOOK}  (new client, no prior appointments)`);

  const turns = [];

  try {
    // Turn 1 — initiate
    const t1 = await turn(PHONE_BOOK, 'Hola, quiero sacar una cita para un corte de cabello', true);
    logTurn(1, 'Hola, quiero sacar una cita para un corte de cabello', t1);
    turns.push(t1);
    assertToolCalled(t1.tool_calls, 'get_client', 'Turn 1');

    // Turn 2 — date
    const msg2 = `Para ${TOMORROW}, con cualquier profesional disponible`;
    const t2 = await turn(PHONE_BOOK, msg2);
    logTurn(2, msg2, t2);
    turns.push(t2);

    // check_availability or list_services should appear by turn 2
    const tools12 = turns.flatMap(t => t.tool_calls ?? []);
    const hasAvail = tools12.includes('check_availability') || tools12.includes('list_services');
    if (hasAvail) pass('Turns 1-2 — list_services / check_availability called');
    else fail(`Turns 1-2 — list_services / check_availability NOT called  (got: [${tools12.join(', ')}])`);

    // Turn 3 — pick first slot and provide name
    const t3 = await turn(PHONE_BOOK, 'El primer horario disponible. Me llamo Juan Prueba');
    logTurn(3, 'El primer horario disponible. Me llamo Juan Prueba', t3);
    turns.push(t3);

    // Turn 4 — confirm (or 5 if model still asks)
    let bookCalled = turns.some(t => (t.tool_calls ?? []).includes('book_appointment'));
    if (!bookCalled) {
      const t4 = await turn(PHONE_BOOK, 'Sí, confirmo');
      logTurn(4, 'Sí, confirmo', t4);
      turns.push(t4);
      bookCalled = (t4.tool_calls ?? []).includes('book_appointment');
    }
    if (!bookCalled) {
      const t5 = await turn(PHONE_BOOK, 'Confirmo la reserva');
      logTurn(5, 'Confirmo la reserva', t5);
      turns.push(t5);
    }

    assertToolCalledInTurns(turns.slice(1), 'book_appointment', 'Turns 2-5');

    // DB verification — look for appointment linked to any client with this phone
    const { data: clients } = await db.from('clients').select('id').eq('tenant_id', TENANT_ID).eq('phone', PHONE_BOOK);
    if (!clients?.length) {
      fail('DB verify — client not created');
    } else {
      const { data: appts } = await db
        .from('appointments')
        .select('id,status,appointment_date')
        .in('client_id', clients.map(c => c.id))
        .eq('tenant_id', TENANT_ID)
        .order('created_at', { ascending: false })
        .limit(1);
      if (appts?.length) pass(`DB verify — appointment created: ${appts[0].id}  (${appts[0].appointment_date})`);
      else fail('DB verify — no appointment found in DB');
    }

  } finally {
    await cleanup(PHONE_BOOK);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const startAll = Date.now();

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Zyncra AI Agent — E2E Test Suite           ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  Base URL : ${BASE_URL}`);
  console.log(`  Tenant   : Barbería Pipe (${TENANT_ID})`);
  console.log(`  Dates    : tomorrow=${TOMORROW}, day_after=${DAY_AFTER}`);
  console.log(`  Started  : ${new Date().toISOString()}`);

  // Health check — abort early if app is not up
  try {
    const h = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (!h.ok) throw new Error(`HTTP ${h.status}`);
    console.log('\n  ✓ App server reachable');
  } catch (e) {
    console.error(`\n  ✗ App server not reachable at ${BASE_URL}: ${e.message}`);
    console.error('    → Start the dev server first: npm run dev');
    process.exit(1);
  }

  await testCancel();
  await testReschedule();
  await testBook();

  const elapsed = ((Date.now() - startAll) / 1000).toFixed(1);

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   RESULTS                                    ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  Passed  : ${passed}`);
  console.log(`  Failed  : ${failed}`);
  console.log(`  Time    : ${elapsed}s`);
  if (failures.length) {
    console.log('\n  Failures:');
    for (const f of failures) console.log(`    • ${f}`);
  }
  console.log(failed === 0 ? '\n  ✓ ALL TESTS PASSED' : '\n  ✗ SOME TESTS FAILED');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
