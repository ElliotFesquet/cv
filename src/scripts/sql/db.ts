// DuckDB-WASM engine, self-hosted (no CDN). Loaded with import() so it only downloads on game pages.
import * as duckdb from '@duckdb/duckdb-wasm';
import wasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import workerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import { schema, tables } from './schema';

export interface Result { columns: string[]; rows: unknown[][]; ms: number }

const dataUrl = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}apps/sql/`;
let conn: duckdb.AsyncDuckDBConnection;

export async function openDb() {
  const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), new Worker(workerUrl));
  await db.instantiate(wasmUrl);
  await db.open({ query: { castBigIntToDouble: true, castDecimalToDouble: true } });
  await Promise.all(tables.map(async (t) => {
    const res = await fetch(`${dataUrl}${t}.csv`);
    await db.registerFileText(`${t}.csv`, await res.text());
  }));
  conn = await db.connect();
  for (const s of ['SET autoinstall_known_extensions = false', 'SET autoload_known_extensions = false']) {
    try { await conn.query(s); } catch { /* setting unavailable in this build */ }
  }
  await resetDb();
}

// (Re)creates every table from its CSV, undoing anything the player changed.
export async function resetDb() {
  for (const t of tables) {
    const cols = schema[t].map(([c, ty]) => `'${c}': '${ty}'`).join(', ');
    await conn.query(`CREATE OR REPLACE TABLE ${t} AS SELECT * FROM read_csv('${t}.csv', header = true, columns = {${cols}})`);
  }
}

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (ms: number, time: boolean) => {
  const d = new Date(ms);
  const day = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  return time ? `${day} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}` : day;
};

// Converts Arrow values to plain JS: dates as ISO text, nested values as JSON.
const toJs = (v: unknown, type: string): unknown => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && /^(Timestamp|Date)/.test(type)) return fmtDate(v, type.startsWith('Timestamp'));
  if (v instanceof Date) return fmtDate(v.getTime(), type.startsWith('Timestamp'));
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'object') return JSON.stringify(v, (_, x) => (typeof x === 'bigint' ? Number(x) : x));
  return v;
};

export async function run(sql: string): Promise<Result> {
  const t0 = performance.now();
  const table = await conn.query(sql);
  const fields = table.schema.fields;
  // Read by column position: duplicate names (SELECT a.name, b.name) must not collapse.
  const cols = fields.map((f, i) => ({ vec: table.getChildAt(i)!, type: String(f.type) }));
  const rows = Array.from({ length: table.numRows }, (_, r) => cols.map((c) => toJs(c.vec.get(r), c.type)));
  return { columns: fields.map((f) => f.name), rows, ms: Math.round(performance.now() - t0) };
}
