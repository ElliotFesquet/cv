// Practice / challenges page: tasks one at a time in order (next unlocks once solved), editor, run, submit,
// progress (localStorage). Resumes at the first unsolved task.
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
const status = $('.sql-status'), output = $('.sql-result');
const next = $<HTMLButtonElement>('[data-action="next"]');
const expectedCache = new Map<string, Result>();
let current = tasks[0];
let view: EditorView;
let db: typeof import('./db') | undefined;

function say(text: string, kind: '' | 'ok' | 'error' = '') {
  status.textContent = text;
  status.dataset.kind = kind;
}

// HUD: task number, solved count, progress bar (filled up to the current task, or past it once solved).
function paintProgress() {
  const i = tasks.indexOf(current), done = solved.has(current.dataset.id!);
  $('[data-solved]').textContent = String(tasks.filter((x) => solved.has(x.dataset.id!)).length);
  $('[data-step]').textContent = String(i + 1);
  bench.style.setProperty('--p', String((i + Number(done)) / tasks.length));
  next.textContent = `${i === tasks.length - 1 ? t('finish') : t('next.q')} →`;
  next.hidden = !done;
}

function select(i: number) {
  current = tasks[i];
  delete bench.dataset.done;
  tasks.forEach((x) => x.classList.toggle('is-current', x === current));
  setDoc(view, store.get(`draft:${current.dataset.id}`) ?? '');
  output.replaceChildren();
  say(db ? t('ready') : t('loading'));
  paintProgress();
  if (bench.getBoundingClientRect().top < 0) bench.scrollIntoView();
}

function finish() {
  bench.dataset.done = '';
  tasks.forEach((x) => x.classList.remove('is-current'));
  bench.style.setProperty('--p', '1');
  bench.querySelector<HTMLElement>('.quiz-end')!.hidden = false;
  bench.querySelector<HTMLElement>('[data-restart]')!.focus({ preventScroll: true });
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
    say(t(res.verdict, res), res.verdict === 'ok' ? 'ok' : 'error');
    if (res.verdict === 'ok') {
      solved.add(current.dataset.id!);
      store.set('solved', JSON.stringify([...solved]));
      paintProgress();
      next.focus({ preventScroll: true });
    }
  }),
  expected: () => guarded(async () => say(`${t('expected')}: ${show(await expected())}`)),
  reset: () => guarded(async () => { await db!.resetDb(); expectedCache.clear(); say(t('resetDone')); }),
  next: async () => {
    const i = tasks.indexOf(current);
    if (i < tasks.length - 1) { select(i + 1); view.focus(); } else finish();
  },
};

view = createEditor($('.sql-editor'), '', () => actions.run(), (s) => store.set(`draft:${current.dataset.id}`, s));
bench.classList.add('is-js');
$('.sql-console').hidden = false;
bench.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((b) =>
  b.addEventListener('click', () => actions[b.dataset.action!]()));
bench.querySelector('[data-restart]')!.addEventListener('click', () => {
  tasks.forEach((x) => solved.delete(x.dataset.id!));
  store.set('solved', JSON.stringify([...solved]));
  bench.querySelector<HTMLElement>('.quiz-end')!.hidden = true;
  select(0);
});
const resume = tasks.findIndex((x) => !solved.has(x.dataset.id!));
if (resume < 0) { select(tasks.length - 1); finish(); } else select(resume);

import('./db').then(async (mod) => {
  await mod.openDb();
  db = mod;
  bench.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((b) => (b.disabled = false));
  say(t('ready'));
}).catch((e) => say(String(e), 'error'));
