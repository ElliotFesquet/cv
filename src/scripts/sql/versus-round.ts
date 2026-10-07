// Versus rounds: shows one question (quiz, theory or problem), checks the player's answers, reveals the solution.
// The match controller (versus.ts) owns the clock and the bot; this file only reports "right" or "wrong".
import type { EditorView } from '@codemirror/view';
import { createEditor, setDoc } from './editor';
import { grade, renderTable } from './grade';
import { sqlUi, type SqlKey } from './i18n';
import { LOCK, type Kind } from './bots';
import type { Result } from './db';

export interface Item {
  kind: Kind; q: string; why?: string;
  options?: string[]; answer?: number; // quiz (options are HTML, escaped at build time)
  accept?: string[]; // theory
  title?: string; hint?: string; solution?: string; ordered?: boolean; diff?: string; // problem
}

const root = document.querySelector<HTMLElement>('.sql-versus')!;
const lang = document.documentElement.lang === 'fr' ? 'fr' : 'en';
const t = (k: SqlKey, vars: Record<string, unknown> = {}) =>
  sqlUi[lang][k].replace(/\{(\w+)\}/g, (_, v) => String(vars[v]));
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
// Theory answers: case, accents, spaces and punctuation don't count.
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9_+]/g, '');

export const dbReady = import('./db').then(async (m) => { await m.openDb(); return m; });
let db: Awaited<typeof dbReady> | undefined;

const options = $('.vs-options'), form = $<HTMLFormElement>('.vs-theory');
const input = $<HTMLInputElement>('.vs-theory input'), feedback = $('[data-feedback]');
const status = $('.vs-console .sql-status'), output = $('.vs-console .sql-result');
const submits = [...root.querySelectorAll<HTMLButtonElement>('[data-submit]')];
const expected = new Map<Item, Result>();
let item: Item, live = false, lockedUntil = 0, onAnswer: (ok: boolean) => void = () => {};

function say(el: HTMLElement, text: string, kind: '' | 'ok' | 'error' = '') {
  el.textContent = text;
  el.dataset.kind = kind;
}

// After a wrong theory/problem answer: submit is disabled for LOCK ms, with a countdown on the button.
function lock() {
  lockedUntil = performance.now() + LOCK;
  const tick = () => {
    const left = live ? Math.ceil((lockedUntil - performance.now()) / 1000) : 0;
    root.toggleAttribute('data-locked', left > 0);
    submits.forEach((b) => { b.disabled = left > 0 || !live; b.textContent = left > 0 ? `${t('check')} · ${left}` : t('check'); });
    if (left > 0) setTimeout(tick, 200);
  };
  tick();
}

function answer(ok: boolean) {
  if (!live) return;
  onAnswer(ok);
  if (!ok && item.kind !== 'quiz' && live) lock();
}

export function mount(next: Item, cb: (ok: boolean) => void) {
  item = next; onAnswer = cb; live = false; lockedUntil = 0;
  root.dataset.kind = item.kind;
  $('[data-title]').textContent = item.title ?? '';
  $('[data-q]').innerHTML = item.q; // our own content, escaped at build time
  $('[data-hint]').innerHTML = item.hint ?? '';
  $<HTMLDetailsElement>('.vs-hint').open = false;
  $('.vs-hint').hidden = !item.hint;
  options.replaceChildren(...(item.options ?? []).map((html, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.i = String(i); b.innerHTML = html;
    return b;
  }).sort(() => Math.random() - 0.5));
  input.value = '';
  say(feedback, '');
  if (item.kind === 'problem') { setDoc(view, ''); output.replaceChildren(); say(status, ''); }
  setLive(false);
}

// Inputs only work while the round clock runs.
export function setLive(on: boolean) {
  live = on;
  options.querySelectorAll('button').forEach((b) => (b.disabled = !on || b.dataset.state !== undefined));
  input.disabled = !on;
  submits.forEach((b) => (b.disabled = !on || (b.dataset.action === 'check' && !db)));
  if (!on) return;
  if (item.kind === 'quiz') options.querySelector('button')?.focus({ preventScroll: true });
  else if (item.kind === 'theory') input.focus({ preventScroll: true });
  else view.focus();
}

// Problems: reload the tables and compute the expected result before the clock starts.
export async function prepare(next: Item) {
  if (next.kind !== 'problem') return;
  const m = await dbReady;
  await m.resetDb();
  if (!expected.has(next)) expected.set(next, await m.run(next.solution!));
}

export function reveal() {
  options.querySelector<HTMLElement>(`[data-i="${item.answer}"]`)?.setAttribute('data-state', 'ok');
  const answerHtml = item.kind === 'theory' ? `<p><strong>${t('vs.accepted')}</strong> <code>${esc(item.accept![0])}</code></p>`
    : item.kind === 'problem' ? `<pre><code>${esc(item.solution!)}</code></pre>` : '';
  $('.vs-reveal').innerHTML = answerHtml + (item.why ? `<p>${item.why}</p>` : '');
}

// Quiz: click or keys 1–4. One pick per round.
options.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!b || !live) return;
  const ok = Number(b.dataset.i) === item.answer;
  b.dataset.state = ok ? 'ok' : 'ko';
  options.querySelectorAll('button').forEach((x) => (x.disabled = true));
  answer(ok);
});
document.addEventListener('keydown', (e) => {
  if (!live || item.kind !== 'quiz' || e.altKey || e.ctrlKey || e.metaKey) return;
  options.querySelectorAll<HTMLButtonElement>('button')[Number(e.key) - 1]?.click();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!live || performance.now() < lockedUntil || !input.value.trim()) return;
  const ok = item.accept!.some((a) => norm(a) === norm(input.value));
  if (!ok) { say(feedback, t('vs.nope'), 'error'); input.select(); }
  answer(ok);
});

// Problems: same console as practice/challenges.
const doc = () => view.state.doc.toString().trim();
function show(r: Result) {
  const cut = renderTable(output, r);
  return r.rows.length ? `${r.rows.length} ${t('rows')}${cut ? ` (${t('truncated')} ${cut})` : ''} · ${r.ms} ${t('ms')}` : t('noRows');
}
async function guarded(fn: (m: Awaited<typeof dbReady>) => Promise<void>) {
  if (!db) return;
  try { await fn(db); } catch (e) { output.replaceChildren(); say(status, String((e as Error).message ?? e), 'error'); }
}
const actions: Record<string, () => Promise<void>> = {
  run: () => guarded(async (m) => { if (doc()) say(status, show(await m.run(doc()))); }),
  check: () => guarded(async (m) => {
    if (!live || !doc() || performance.now() < lockedUntil) return;
    const got = await m.run(doc());
    show(got);
    const res = grade(expected.get(item)!, got, !!item.ordered);
    say(status, t(res.verdict, res), res.verdict === 'ok' ? 'ok' : 'error');
    answer(res.verdict === 'ok');
  }),
  expected: () => guarded(async () => say(status, `${t('expected')}: ${show(expected.get(item)!)}`)),
};
const view: EditorView = createEditor($('.vs-console .sql-editor'), '', () => actions.run(), () => {}, () => actions.check());
root.querySelectorAll<HTMLButtonElement>('.vs-console [data-action]').forEach((b) =>
  b.addEventListener('click', () => actions[b.dataset.action!]()));

dbReady.then((m) => {
  db = m;
  root.querySelectorAll<HTMLButtonElement>('.vs-console [data-action]:not([data-submit])').forEach((b) => (b.disabled = false));
  if (live) setLive(true);
}).catch((e) => say(status, String(e), 'error'));
