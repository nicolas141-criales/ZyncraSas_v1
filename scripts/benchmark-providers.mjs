/**
 * Provider benchmark: Ollama vs Groq.
 * Runs Cancel + Reschedule + Book flows for each provider and prints a comparison table.
 *
 * Requirements:
 *   - Next.js dev server running (npm run dev)
 *   - Ollama running with the configured model
 *   - GROQ_API_KEY set in .env.local (Groq provider skipped if missing)
 *
 * Usage:
 *   node scripts/benchmark-providers.mjs
 *   node scripts/benchmark-providers.mjs --providers groq        # Groq only
 *   node scripts/benchmark-providers.mjs --providers ollama,groq  # Both (default)
 */

import { readFileSync } from 'fs';
import { resolve }      from 'path';
import { createClient } from '@supabase/supabase-js';

// ── Load .env.local ───────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch { /* rely on existing env */ }
}
loadEnv();

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL     = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const AI_SECRET    = process.env.AI_API_SECRET ?? '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Barbería Pipe test fixtures
const TENANT_ID  = 'db477f77-b0bf-4852-ab72-92c9e815573d';
const SERVICE_ID = 'a0eec2d7-7b33-4615-9b16-6412c3270bb5'; // Corte Basico, 30 min
const PROF_ID    = '6fb43e45-6a11-466e-b2f9-41e980890dd7'; // Nicolas Criales

// Isolated phones — won't conflict with prod or test-ai-flows.mjs
const PHONE_CANCEL     = '5719000000094';
const PHONE_RESCHEDULE = '5719000000095';
const PHONE_BOOK       = '5719000000096';

// Groq pricing (llama-3.3-70b-versatile) — update if rates change
const GROQ_PRICE_INPUT  = 0.59 / 1_000_000;  // $ per token
const GROQ_PRICE_OUTPUT = 0.79 / 1_000_000;

const db = createClient(SUPABASE_URL, SERVICE_KEY);

// Dates
const bogota   = new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' });
const today    = new Date(bogota);
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
const TOMORROW  = tomorrow.toISOString().slice(0, 10);
const DAY_AFTER = dayAfter.toISOString().slice(0, 10);

// ── Fixture helpers ───────────────────────────────────────────────────────────
async function createTestClient(phone, name) {
  const { data, error } = await db.from('clients')
    .insert({ tenant_id: TENANT_ID, name, phone })
    .select('id').single();
  if (error) throw new Error(`createTestClient: ${error.message}`);
  return data.id;
}

async function createTestAppointment(clientId, date, time) {
  const { data, error } = await db.from('appointments')
    .insert({ tenant_id: TENANT_ID, client_id: clientId, service_id: SERVICE_ID,
              professional_id: PROF_ID, appointment_date: date, appointment_time: time,
              status: 'pending' })
    .select('id').single();
  if (error) throw new Error(`createTestAppointment: ${error.message}`);
  return data.id;
}

async function getAppointment(id) {
  const { data } = await db.from('appointments')
    .select('id,status,appointment_date,appointment_time').eq('id', id).single();
  return data;
}

async function cleanup(phone) {
  const { data: clients } = await db.from('clients').select('id')
    .eq('tenant_id', TENANT_ID).eq('phone', phone);
  for (const c of (clients ?? [])) {
    await db.from('appointments').delete().eq('tenant_id', TENANT_ID).eq('client_id', c.id);
    await db.from('clients').delete().eq('id', c.id);
  }
  await db.from('ai_conversations').delete().eq('tenant_id', TENANT_ID).eq('phone', phone);
}

// ── API turn ──────────────────────────────────────────────────────────────────
async function turn(phone, text, provider, reset = false) {
  if (!reset) await new Promise(r => setTimeout(r, 2000));

  const res = await fetch(`${BASE_URL}/api/ai/test-turn`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_SECRET}` },
    body:    JSON.stringify({ tenant_id: TENANT_ID, phone, text, reset, provider }),
    signal:  AbortSignal.timeout(420_000),
  });
  const body = await res.json();
  if (!res.ok || !body.ok) throw new Error(`test-turn failed: ${body.error ?? res.status}`);
  return body;
}

function logTurn(n, text, result, provider) {
  const tools = (result.tool_calls ?? []).filter(Boolean);
  const u     = result.usage ?? {};
  console.log(`\n  [${provider.toUpperCase()} Turn ${n}] "${text}"`);
  console.log(`   Reply  : ${result.reply.slice(0, 160)}${result.reply.length > 160 ? '…' : ''}`);
  console.log(`   Tools  : [${tools.join(', ')}]`);
  console.log(`   Time   : ${result.elapsed_ms}ms`);
  console.log(`   Tokens : ${u.promptTokens ?? '?'} prompt / ${u.completionTokens ?? '?'} completion`);
}

// ── Per-flow benchmarks ───────────────────────────────────────────────────────

async function benchCancel(provider) {
  await cleanup(PHONE_CANCEL);
  const clientId = await createTestClient(PHONE_CANCEL, 'Bench Cancel');
  const apptId   = await createTestAppointment(clientId, TOMORROW, '14:00:00');

  const turns = [];
  let passed = 0, failed = 0;
  const failures = [];

  const check = (cond, msg) => { if (cond) { passed++; } else { failed++; failures.push(msg); } };
  const allTools = ts => ts.flatMap(t => t.tool_calls ?? []);

  try {
    const t1 = await turn(PHONE_CANCEL, 'Hola, quiero cancelar mi cita', provider, true);
    logTurn(1, 'Hola, quiero cancelar mi cita', t1, provider);
    turns.push(t1);
    check((t1.tool_calls ?? []).includes('get_client'), 'T1: get_client');

    const t2 = await turn(PHONE_CANCEL, 'Sí, cancela esa cita por favor', provider);
    logTurn(2, 'Sí, cancela esa cita por favor', t2, provider);
    turns.push(t2);

    let cancelCalled = (t2.tool_calls ?? []).includes('cancel_appointment');
    if (!cancelCalled) {
      const t3 = await turn(PHONE_CANCEL, 'Confirmo, cancela la cita', provider);
      logTurn(3, 'Confirmo, cancela la cita', t3, provider);
      turns.push(t3);
    }

    check(allTools(turns.slice(1)).includes('cancel_appointment'), 'Turns 2-3: cancel_appointment');

    const appt = await getAppointment(apptId);
    check(appt?.status === 'cancelled', `DB: status=cancelled (got "${appt?.status}")`);
  } finally {
    await cleanup(PHONE_CANCEL);
  }

  return { turns, passed, failed, failures };
}

async function benchReschedule(provider) {
  await cleanup(PHONE_RESCHEDULE);
  const clientId = await createTestClient(PHONE_RESCHEDULE, 'Bench Reschedule');
  const apptId   = await createTestAppointment(clientId, TOMORROW, '10:00:00');

  const turns = [];
  let passed = 0, failed = 0;
  const failures = [];

  const check = (cond, msg) => { if (cond) { passed++; } else { failed++; failures.push(msg); } };
  const allTools = ts => ts.flatMap(t => t.tool_calls ?? []);

  try {
    const msg1 = `Hola, quiero mover mi cita para el ${DAY_AFTER}`;
    const t1 = await turn(PHONE_RESCHEDULE, msg1, provider, true);
    logTurn(1, msg1, t1, provider);
    turns.push(t1);
    check((t1.tool_calls ?? []).includes('get_client'), 'T1: get_client');

    const t2 = await turn(PHONE_RESCHEDULE, 'A las 11:00, el mismo profesional', provider);
    logTurn(2, 'A las 11:00, el mismo profesional', t2, provider);
    turns.push(t2);

    check(allTools(turns).includes('check_availability'), 'Turns 1-2: check_availability');

    const t3 = await turn(PHONE_RESCHEDULE, 'Sí, confirmo el cambio', provider);
    logTurn(3, 'Sí, confirmo el cambio', t3, provider);
    turns.push(t3);

    if (!allTools(turns.slice(1)).includes('reschedule_appointment')) {
      const t4 = await turn(PHONE_RESCHEDULE, 'Confirmo', provider);
      logTurn(4, 'Confirmo', t4, provider);
      turns.push(t4);
    }

    check(allTools(turns.slice(1)).includes('reschedule_appointment'), 'Turns 2-4: reschedule_appointment');

    const appt = await getAppointment(apptId);
    check(appt?.appointment_date === DAY_AFTER, `DB: date=${DAY_AFTER} (got "${appt?.appointment_date}")`);
  } finally {
    await cleanup(PHONE_RESCHEDULE);
  }

  return { turns, passed, failed, failures };
}

async function benchBook(provider) {
  await cleanup(PHONE_BOOK);

  const turns = [];
  let passed = 0, failed = 0;
  const failures = [];

  const check = (cond, msg) => { if (cond) { passed++; } else { failed++; failures.push(msg); } };
  const allTools = ts => ts.flatMap(t => t.tool_calls ?? []);

  try {
    const t1 = await turn(PHONE_BOOK, 'Hola, quiero sacar una cita para un corte de cabello', provider, true);
    logTurn(1, 'Hola, quiero sacar una cita para un corte de cabello', t1, provider);
    turns.push(t1);
    check((t1.tool_calls ?? []).includes('get_client'), 'T1: get_client');

    const msg2 = `Para ${TOMORROW}, con cualquier profesional disponible`;
    const t2 = await turn(PHONE_BOOK, msg2, provider);
    logTurn(2, msg2, t2, provider);
    turns.push(t2);

    const tools12 = allTools(turns);
    check(
      tools12.includes('check_availability') || tools12.includes('list_services'),
      'Turns 1-2: check_availability or list_services',
    );

    const t3 = await turn(PHONE_BOOK, 'El primer horario disponible. Me llamo Juan Prueba', provider);
    logTurn(3, 'El primer horario disponible. Me llamo Juan Prueba', t3, provider);
    turns.push(t3);

    if (!allTools(turns.slice(1)).includes('book_appointment')) {
      const t4 = await turn(PHONE_BOOK, 'Sí, confirmo', provider);
      logTurn(4, 'Sí, confirmo', t4, provider);
      turns.push(t4);
    }
    if (!allTools(turns.slice(1)).includes('book_appointment')) {
      const t5 = await turn(PHONE_BOOK, 'Confirmo la reserva', provider);
      logTurn(5, 'Confirmo la reserva', t5, provider);
      turns.push(t5);
    }

    check(allTools(turns.slice(1)).includes('book_appointment'), 'Turns 2-5: book_appointment');

    const { data: clients } = await db.from('clients').select('id')
      .eq('tenant_id', TENANT_ID).eq('phone', PHONE_BOOK);
    if (!clients?.length) {
      failed++; failures.push('DB: client not created');
    } else {
      const { data: appts } = await db.from('appointments').select('id,status,appointment_date')
        .in('client_id', clients.map(c => c.id)).eq('tenant_id', TENANT_ID)
        .order('created_at', { ascending: false }).limit(1);
      check(appts?.length > 0, `DB: appointment created`);
    }
  } finally {
    await cleanup(PHONE_BOOK);
  }

  return { turns, passed, failed, failures };
}

// ── Stats helpers ─────────────────────────────────────────────────────────────
function sumTurns(turns) {
  return turns.reduce((acc, t) => {
    acc.elapsed_ms        += t.elapsed_ms ?? 0;
    acc.promptTokens      += t.usage?.promptTokens ?? 0;
    acc.completionTokens  += t.usage?.completionTokens ?? 0;
    return acc;
  }, { elapsed_ms: 0, promptTokens: 0, completionTokens: 0 });
}

function groqCost(promptTokens, completionTokens) {
  return promptTokens * GROQ_PRICE_INPUT + completionTokens * GROQ_PRICE_OUTPUT;
}

function fmtCost(provider, pt, ct) {
  if (provider === 'ollama') return '$0.00 (local)';
  const c = groqCost(pt, ct);
  return `$${c.toFixed(5)}`;
}

function fmtMs(ms) {
  return ms >= 60000 ? `${(ms/60000).toFixed(1)}m` : `${(ms/1000).toFixed(1)}s`;
}

// ── Run one provider ──────────────────────────────────────────────────────────
async function runProvider(provider) {
  console.log(`\n${'═'.repeat(58)}`);
  console.log(` PROVIDER: ${provider.toUpperCase()}`);
  console.log(`${'═'.repeat(58)}`);

  const results = {};

  console.log('\n── CANCEL ──────────────────────────────────────────────');
  results.cancel = await benchCancel(provider);

  console.log('\n── RESCHEDULE ──────────────────────────────────────────');
  results.reschedule = await benchReschedule(provider);

  console.log('\n── BOOK ────────────────────────────────────────────────');
  results.book = await benchBook(provider);

  return results;
}

// ── Comparison table ──────────────────────────────────────────────────────────
function printTable(allResults, providers) {
  console.log('\n\n' + '╔' + '═'.repeat(72) + '╗');
  console.log('║' + '   BENCHMARK RESULTS — PROVIDER COMPARISON'.padEnd(72) + '║');
  console.log('╚' + '═'.repeat(72) + '╝');

  const flows  = ['cancel', 'reschedule', 'book'];
  const labels = { cancel: 'Cancel', reschedule: 'Reschedule', book: 'Book' };

  // Per-flow table
  for (const flow of flows) {
    console.log(`\n┌── ${labels[flow].toUpperCase()} ${'─'.repeat(66 - labels[flow].length)}┐`);

    // Header
    const hdr = 'Metric'.padEnd(22) + providers.map(p => p.padEnd(24)).join('');
    console.log(`│ ${hdr.padEnd(70)} │`);
    console.log(`│ ${'─'.repeat(70)} │`);

    const stats = providers.map(p => {
      const r = allResults[p]?.[flow];
      if (!r) return null;
      return { ...sumTurns(r.turns), turns: r.turns.length, passed: r.passed, failed: r.failed, failures: r.failures };
    });

    const rows = [
      ['Turns', stats.map(s => s ? `${s.turns}` : 'N/A')],
      ['Total time', stats.map(s => s ? fmtMs(s.elapsed_ms) : 'N/A')],
      ['Prompt tokens', stats.map(s => s ? `${s.promptTokens.toLocaleString()}` : 'N/A')],
      ['Completion tok', stats.map(s => s ? `${s.completionTokens.toLocaleString()}` : 'N/A')],
      ['Cost', stats.map((s, i) => s ? fmtCost(providers[i], s.promptTokens, s.completionTokens) : 'N/A')],
      ['Assertions', stats.map(s => s ? `${s.passed}/${s.passed + s.failed}${s.failed ? ' ✗' : ' ✓'}` : 'N/A')],
    ];

    for (const [label, values] of rows) {
      const row = label.padEnd(22) + values.map(v => v.padEnd(24)).join('');
      console.log(`│ ${row.padEnd(70)} │`);
    }

    // Failures
    for (let i = 0; i < providers.length; i++) {
      if (stats[i]?.failures?.length) {
        console.log(`│ ${'─'.repeat(70)} │`);
        console.log(`│  ${providers[i]} failures:${' '.repeat(58)} │`);
        for (const f of stats[i].failures) {
          console.log(`│    ✗ ${f.slice(0, 64).padEnd(64)} │`);
        }
      }
    }
    console.log(`└${'─'.repeat(72)}┘`);
  }

  // Grand totals
  console.log('\n┌── TOTALS ' + '─'.repeat(62) + '┐');
  const hdr = 'Metric'.padEnd(22) + providers.map(p => p.padEnd(24)).join('');
  console.log(`│ ${hdr.padEnd(70)} │`);
  console.log(`│ ${'─'.repeat(70)} │`);

  const totals = providers.map(p => {
    const r = allResults[p];
    if (!r) return null;
    return flows.reduce((acc, f) => {
      const s = sumTurns(r[f]?.turns ?? []);
      acc.elapsed_ms       += s.elapsed_ms;
      acc.promptTokens     += s.promptTokens;
      acc.completionTokens += s.completionTokens;
      acc.passed           += r[f]?.passed ?? 0;
      acc.total            += (r[f]?.passed ?? 0) + (r[f]?.failed ?? 0);
      return acc;
    }, { elapsed_ms: 0, promptTokens: 0, completionTokens: 0, passed: 0, total: 0 });
  });

  const totalRows = [
    ['Total time (3 flows)', totals.map(t => t ? fmtMs(t.elapsed_ms) : 'N/A')],
    ['Total prompt tokens', totals.map(t => t ? `${t.promptTokens.toLocaleString()}` : 'N/A')],
    ['Total completion tok', totals.map(t => t ? `${t.completionTokens.toLocaleString()}` : 'N/A')],
    ['Total cost', totals.map((t, i) => t ? fmtCost(providers[i], t.promptTokens, t.completionTokens) : 'N/A')],
    ['Assertions', totals.map(t => t ? `${t.passed}/${t.total}${t.passed < t.total ? ' ✗' : ' ✓'}` : 'N/A')],
  ];

  for (const [label, values] of totalRows) {
    const row = label.padEnd(22) + values.map(v => v.padEnd(24)).join('');
    console.log(`│ ${row.padEnd(70)} │`);
  }
  console.log(`└${'─'.repeat(72)}┘`);

  // Recommendation
  console.log('\n── RECOMMENDATION ──────────────────────────────────────────────────\n');
  if (providers.length < 2) {
    console.log('  Run with both providers to get a recommendation.');
    return;
  }

  const [pA, pB] = providers;
  const tA = totals[0], tB = totals[1];
  if (tA && tB) {
    const speedup = (tA.elapsed_ms / tB.elapsed_ms).toFixed(1);
    const winner  = tA.elapsed_ms > tB.elapsed_ms ? pB : pA;
    const loser   = winner === pA ? pB : pA;
    const wCost   = fmtCost(winner, totals[providers.indexOf(winner)].promptTokens, totals[providers.indexOf(winner)].completionTokens);
    const qualityOk = totals.every(t => t && t.passed === t.total);

    console.log(`  Speed  : ${winner.toUpperCase()} is ${speedup}x faster than ${loser.toUpperCase()}`);
    console.log(`  Cost   : ${winner.toUpperCase()} all 3 flows = ${wCost}`);
    console.log(`  Quality: ${qualityOk ? 'Both providers passed all assertions ✓' : 'See failures above ✗'}`);
    console.log('');
    if (winner === 'groq') {
      console.log('  → Production recommendation: GROQ');
      console.log('    Set LLM_PROVIDER=groq in .env.local (or Vercel env).');
      console.log('    Cost per real WhatsApp conversation (~3 turns): < $0.001.');
      console.log('    Fallback: keep OLLAMA_* vars to switch back offline if needed.');
    } else {
      console.log(`  → ${winner.toUpperCase()} is faster. Update LLM_PROVIDER in .env.local.`);
    }
  }
  console.log('');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Parse --providers arg
  const providerArg = process.argv.find(a => a.startsWith('--providers=')) ??
                      process.argv[process.argv.indexOf('--providers') + 1];
  const requested   = (typeof providerArg === 'string' && !providerArg.startsWith('--'))
    ? providerArg.split(',').map(p => p.trim().toLowerCase())
    : ['ollama', 'groq'];

  // Filter Groq if no API key
  const providers = requested.filter(p => {
    if (p === 'groq' && !process.env.GROQ_API_KEY) {
      console.warn('\n  ⚠ Skipping groq — GROQ_API_KEY not set in .env.local');
      return false;
    }
    return true;
  });

  if (!providers.length) {
    console.error('No providers available. Set GROQ_API_KEY or include "ollama".');
    process.exit(1);
  }

  const startAll = Date.now();
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   Zyncra AI — Provider Benchmark                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Providers : ${providers.join(', ')}`);
  console.log(`  Base URL  : ${BASE_URL}`);
  console.log(`  Tenant    : Barbería Pipe (${TENANT_ID})`);
  console.log(`  Dates     : tomorrow=${TOMORROW}, day_after=${DAY_AFTER}`);

  // Health check
  try {
    const h = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (!h.ok) throw new Error(`HTTP ${h.status}`);
    console.log('  ✓ Server reachable\n');
  } catch (e) {
    console.error(`  ✗ Server not reachable at ${BASE_URL}: ${e.message}`);
    console.error('    → Start the dev server first: npm run dev');
    process.exit(1);
  }

  const allResults = {};
  for (const provider of providers) {
    allResults[provider] = await runProvider(provider);
  }

  printTable(allResults, providers);

  console.log(`\n  Total benchmark time: ${fmtMs(Date.now() - startAll)}\n`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
