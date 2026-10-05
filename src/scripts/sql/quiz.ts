// Quiz page: level select, then one question at a time with instant feedback; score and best per level (localStorage).
import { sqlUi } from './i18n';
import { play } from './fx';

const root = document.querySelector<HTMLElement>('.sql-quiz')!;
const ui = sqlUi[document.documentElement.lang === 'fr' ? 'fr' : 'en'];
const levels = [...root.querySelectorAll<HTMLElement>('.quiz-level')];
const tabs = [...root.querySelectorAll<HTMLAnchorElement>('[data-level-tab]')];
const store = {
  get: (k: string) => { try { return localStorage.getItem(`cv:sql:quiz:${k}`); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(`cv:sql:quiz:${k}`, v); } catch { /* private mode */ } },
};
const $ = <T extends HTMLElement = HTMLElement>(el: HTMLElement, sel: string) => el.querySelector<T>(sel)!;
const questions = (level: HTMLElement) => [...level.querySelectorAll<HTMLElement>('.quiz-q')];
let current: HTMLElement | undefined;

function paintBest() {
  tabs.forEach((a) => { $(a, '[data-best-tab]').textContent = store.get(a.dataset.levelTab!) ?? '–'; });
  levels.forEach((l) => { $(l, '[data-best]').textContent = store.get(l.id) ?? '–'; });
}

// '' shows the level select; a level id starts that level from question 1.
function show(id: string, focus = false) {
  const prev = current?.id;
  current = levels.find((l) => l.id === id);
  root.dataset.screen = current ? 'play' : 'select';
  levels.forEach((l) => l.classList.toggle('is-current', l === current));
  history.replaceState(null, '', current ? `#${current.id}` : location.pathname);
  if (current) reset(current);
  else if (focus) (tabs.find((a) => a.dataset.levelTab === prev) ?? tabs[0]).focus({ preventScroll: true });
  if (root.getBoundingClientRect().top < 0) root.scrollIntoView();
}

// Shuffles the options so the answer position can't be memorised.
function reset(level: HTMLElement) {
  questions(level).forEach((q) => {
    const box = $(q, '.quiz-options');
    [...box.children].sort(() => Math.random() - 0.5).forEach((o) => box.append(o));
    q.querySelectorAll<HTMLInputElement>('input').forEach((i) => { i.checked = false; i.disabled = false; });
    q.querySelectorAll('label').forEach((l) => delete l.dataset.state);
    $(q, '.quiz-why').hidden = true;
    delete q.dataset.done;
  });
  $(level, '[data-score]').textContent = '0';
  $(level, '.quiz-end').hidden = true;
  step(level, 0);
}

function step(level: HTMLElement, n: number) {
  const qs = questions(level);
  qs.forEach((q, i) => q.classList.toggle('is-current', i === n));
  $(level, '[data-step]').textContent = String(n + 1);
  level.style.setProperty('--p', String(n / qs.length));
  $(level, '[data-next]').hidden = true;
  if (level.getBoundingClientRect().top < 0) level.scrollIntoView();
  if (qs[n]) play($(qs[n], 'legend'));
}

function answer(level: HTMLElement, q: HTMLElement, input: HTMLInputElement) {
  if (q.dataset.done) return;
  q.dataset.done = input.value === q.dataset.answer ? 'ok' : 'ko';
  q.querySelectorAll<HTMLInputElement>('input').forEach((i) => {
    i.disabled = true;
    if (i.value === q.dataset.answer) i.closest('label')!.dataset.state = 'ok';
  });
  if (q.dataset.done === 'ko') input.closest('label')!.dataset.state = 'ko';
  const why = $(q, '.quiz-why');
  $(why, 'strong').textContent = q.dataset.done === 'ok' ? ui.correct : ui.wrong;
  why.hidden = false;
  play($(why, 'span'), 150);

  const qs = questions(level);
  $(level, '[data-score]').textContent = String(qs.filter((x) => x.dataset.done === 'ok').length);
  level.style.setProperty('--p', String((qs.indexOf(q) + 1) / qs.length));
  const next = $<HTMLButtonElement>(level, '[data-next]');
  next.textContent = qs.at(-1) === q ? `${ui.results} →` : `${ui['next.q']} →`;
  next.hidden = false;
  next.focus({ preventScroll: true });
}

function finish(level: HTMLElement) {
  const qs = questions(level);
  const score = qs.filter((x) => x.dataset.done === 'ok').length;
  if (score > Number(store.get(level.id) ?? -1)) store.set(level.id, String(score));
  paintBest();
  qs.forEach((q) => q.classList.remove('is-current'));
  $(level, '[data-next]').hidden = true;
  $(level, '[data-final]').textContent = String(score);
  const msg = $(level, '[data-msg]');
  msg.textContent = score === qs.length ? ui['end.top'] : score >= qs.length / 2 ? ui['end.mid'] : ui['end.low'];
  delete msg.dataset.split; // new text: split it again
  const end = $(level, '.quiz-end');
  end.hidden = false;
  play(msg, 300);
  $<HTMLButtonElement>(end, '[data-retry]').focus({ preventScroll: true });
}

root.classList.add('is-js');
levels.forEach((level) => {
  level.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    answer(level, input.closest<HTMLElement>('.quiz-q')!, input);
  });
  $(level, '[data-next]').addEventListener('click', () => {
    const qs = questions(level);
    const n = qs.findIndex((q) => q.classList.contains('is-current'));
    if (n < qs.length - 1) step(level, n + 1); else finish(level);
  });
  $(level, '[data-retry]').addEventListener('click', () => reset(level));
  level.querySelectorAll('[data-levels]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); show('', true); }));
});
tabs.forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); show(a.dataset.levelTab!); }));

// 1–4 pick an option of the current question, Esc goes back to the level select.
document.addEventListener('keydown', (e) => {
  if (!current || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === 'Escape') { show('', true); return; }
  const q = current.querySelector<HTMLElement>('.quiz-q.is-current');
  const input = q?.querySelectorAll<HTMLInputElement>('input')[Number(e.key) - 1];
  if (input && !q!.dataset.done) { input.checked = true; input.dispatchEvent(new Event('change', { bubbles: true })); }
});

paintBest();
show(location.hash.slice(1));
