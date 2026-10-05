// Result comparison and rendering, shared by practice and challenges.
import type { Result } from './db';

export type Verdict = 'ok' | 'ko.cols' | 'ko.rows' | 'ko.values' | 'ko.order';

// Column names are ignored; numbers are compared at 2 decimals so 51.3 == 51.30 and INT == DOUBLE.
const norm = (v: unknown) =>
  v === null ? '∅' : typeof v === 'number' ? String(Math.round(v * 100) / 100 || 0) : String(v);
const keys = (r: Result) => r.rows.map((row) => row.map(norm).join('␟'));

export function grade(expected: Result, got: Result, ordered: boolean): { verdict: Verdict; e?: number; g?: number } {
  if (expected.columns.length !== got.columns.length)
    return { verdict: 'ko.cols', e: expected.columns.length, g: got.columns.length };
  if (expected.rows.length !== got.rows.length)
    return { verdict: 'ko.rows', e: expected.rows.length, g: got.rows.length };
  const a = keys(expected), b = keys(got);
  if (a.every((k, i) => k === b[i])) return { verdict: 'ok' };
  const same = [...a].sort().join('\n') === [...b].sort().join('\n');
  if (!same) return { verdict: 'ko.values' };
  return { verdict: ordered ? 'ko.order' : 'ok' };
}

const MAX_ROWS = 200;
const cell = (tag: string, v: unknown) => {
  const el = document.createElement(tag);
  if (v === null) { el.textContent = 'NULL'; el.className = 'sql-null'; }
  else { el.textContent = String(v); if (typeof v === 'number') el.className = 'sql-num'; }
  return el;
};

// Builds the result table (first MAX_ROWS rows) inside `host`.
export function renderTable(host: HTMLElement, r: Result) {
  const table = document.createElement('table');
  const head = table.createTHead().insertRow();
  r.columns.forEach((c, i) => {
    const th = head.appendChild(cell('th', c));
    if (typeof r.rows[0]?.[i] === 'number') th.className = 'sql-num';
  });
  const body = table.createTBody();
  r.rows.slice(0, MAX_ROWS).forEach((row) => {
    const tr = body.insertRow();
    row.forEach((v) => tr.append(cell('td', v)));
  });
  host.replaceChildren(table);
  return r.rows.length > MAX_ROWS ? MAX_ROWS : 0;
}
