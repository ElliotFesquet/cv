// Practice / challenges page: task navigation, editor, run, submit, progress (localStorage).
import type { EditorView } from '@codemirror/view';
import { createEditor, setDoc } from './editor';
import { grade, renderTable } from './grade';
import { sqlUi, type SqlKey } from './i18n';
import type { Result } from './db';

const bench = document.querySelector<HTMLElement>('.sql-bench')!;
const lang = document.documentElement.lang === 'fr' ? 'fr' : 'en';
const t = (k: SqlKey, vars: Record<string, unknown> = {}) =>
  sqlUi[lang][k].replace(/\{(\w)\}/g, (_, v) => String(vars[v]));
const $ = <T extends HTMLElement>(sel: string) => bench.querySelector<T>(sel)!;

const store = {
  get: (k: string) => { try { return localStorage.getItem(`cv:sql:${k}`); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(`cv:sql:${k}`, v); } catch { /* private mode */ } },
};
const solved = new Set<string>(JSON.parse(store.get('solved') ?? '[]'));

const tasks = [...bench.querySelectorAll<HTMLElement>('.sql-task')];
const links = [...bench.querySelectorAll<HTMLAnchorElement>('[data-task]')];
const status = $('.sql-status'), output = $('.sql-result');
const expectedCache = new Map<string, Result>();
let current = tasks[0];
let view: EditorView;
let db: typeof import('./db') | undefined;

function say(text: string, kind: '' | 'ok' | 'error' = '') {
  status.textContent = text;
  status.dataset.kind = kind;
}

function paintProgress() {
  links.forEach((a) => a.classList.toggle('is-solved', solved.has(a.dataset.task!)));
  $('[data-solved]').textContent = String(tasks.filter((x) => solved.has(x.dataset.id!)).length);
}

function select(id: string | undefined) {
  current = tasks.find((x) => x.dataset.id === id) ?? tasks[0];
  tasks.forEach((x) => x.classList.toggle('is-current', x === current));
  links.forEach((a) => a.setAttribute('aria-current', String(a.dataset.task === current.dataset.id)));
  setDoc(view, store.get(`draft:${current.dataset.id}`) ?? '');
  output.replaceChildren();
  if (db) say(t('ready'));
  history.replaceState(null, '', `#${current.dataset.id}`);
}

function show(r: Result) {
  const cut = renderTable(output, r);
  return r.rows.length ? `${r.rows.length} ${t('rows')}${cut ? ` (${t('truncated')} ${cut})` : ''} · ${r.ms} ${t('ms')}` : t('noRows');
}

async function guarded(fn: () => Promise<void>) {
  if (!db) return;
  try { await fn(); } catch (e) { output.replaceChildren(); say(String((e as Error).message ?? e), 'error'); }
}

async function expected() {
  const id = current.dataset.id!;
  if (!expectedCache.has(id)) expectedCache.set(id, await db!.run(current.dataset.solution!));
  return expectedCache.get(id)!;
}

const doc = () => view.state.doc.toString().trim();
const actions: Record<string, () => Promise<void>> = {
  run: () => guarded(async () => { if (doc()) say(show(await db!.run(doc()))); }),
  check: () => guarded(async () => {
    if (!doc()) return;
    const got = await db!.run(doc());
    show(got);
    const res = grade(await expected(), got, current.dataset.ordered === 'true');
    if (res.verdict === 'ok') { solved.add(current.dataset.id!); store.set('solved', JSON.stringify([...solved])); paintProgress(); }
    say(t(res.verdict, res), res.verdict === 'ok' ? 'ok' : 'error');
  }),
  expected: () => guarded(async () => say(`${t('expected')}: ${show(await expected())}`)),
  reset: () => guarded(async () => { await db!.resetDb(); expectedCache.clear(); say(t('resetDone')); }),
  prev: async () => select(tasks[Math.max(0, tasks.indexOf(current) - 1)].dataset.id),
  next: async () => select(tasks[Math.min(tasks.length - 1, tasks.indexOf(current) + 1)].dataset.id),
};

view = createEditor($('.sql-editor'), '', () => actions.run(), (s) => store.set(`draft:${current.dataset.id}`, s));
bench.classList.add('is-js');
$('.sql-console').hidden = false;
links.forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); select(a.dataset.task); view.focus(); }));
bench.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((b) =>
  b.addEventListener('click', () => actions[b.dataset.action!]()));
select(location.hash.slice(1));
paintProgress();
say(t('loading'));

import('./db').then(async (mod) => {
  await mod.openDb();
  db = mod;
  bench.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((b) => (b.disabled = false));
  say(t('ready'));
}).catch((e) => say(String(e), 'error'));
