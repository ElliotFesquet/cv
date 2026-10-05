// Quiz page: level tabs, instant feedback, score and best score per level (localStorage).
import { sqlUi } from './i18n';

const root = document.querySelector<HTMLElement>('.sql-quiz')!;
const ui = sqlUi[document.documentElement.lang === 'fr' ? 'fr' : 'en'];
const levels = [...root.querySelectorAll<HTMLElement>('.quiz-level')];
const tabs = [...root.querySelectorAll<HTMLAnchorElement>('[data-level-tab]')];
const store = {
  get: (k: string) => { try { return localStorage.getItem(`cv:sql:quiz:${k}`); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(`cv:sql:quiz:${k}`, v); } catch { /* private mode */ } },
};

function open(id: string) {
  const level = levels.find((l) => l.id === id) ?? levels[0];
  levels.forEach((l) => l.classList.toggle('is-current', l === level));
  tabs.forEach((a) => a.setAttribute('aria-current', String(a.dataset.levelTab === level.id)));
  history.replaceState(null, '', `#${level.id}`);
}

function paintBest(level: HTMLElement) {
  level.querySelector('[data-best]')!.textContent = store.get(level.id) ?? '–';
}

// Shuffles the options so the answer position can't be memorised.
function reset(level: HTMLElement) {
  level.querySelectorAll<HTMLElement>('.quiz-q').forEach((q) => {
    const box = q.querySelector('.quiz-options')!;
    [...box.children].sort(() => Math.random() - 0.5).forEach((o) => box.append(o));
    q.querySelectorAll<HTMLInputElement>('input').forEach((i) => { i.checked = false; i.disabled = false; });
    q.querySelectorAll('label').forEach((l) => delete l.dataset.state);
    q.querySelector<HTMLElement>('.quiz-why')!.hidden = true;
    delete q.dataset.done;
  });
  level.querySelector('[data-score]')!.textContent = '0';
  paintBest(level);
}

function answer(level: HTMLElement, q: HTMLElement, input: HTMLInputElement) {
  if (q.dataset.done) return;
  q.dataset.done = input.value === q.dataset.answer ? 'ok' : 'ko';
  q.querySelectorAll<HTMLInputElement>('input').forEach((i) => {
    i.disabled = true;
    if (i.value === q.dataset.answer) i.closest('label')!.dataset.state = 'ok';
  });
  if (q.dataset.done === 'ko') input.closest('label')!.dataset.state = 'ko';
  const why = q.querySelector<HTMLElement>('.quiz-why')!;
  why.querySelector('strong')!.textContent = q.dataset.done === 'ok' ? ui.correct : ui.wrong;
  why.hidden = false;

  const qs = [...level.querySelectorAll<HTMLElement>('.quiz-q')];
  const score = qs.filter((x) => x.dataset.done === 'ok').length;
  level.querySelector('[data-score]')!.textContent = String(score);
  if (qs.every((x) => x.dataset.done)) {
    const best = Number(store.get(level.id) ?? -1);
    if (score > best) store.set(level.id, String(score));
    paintBest(level);
  }
}

root.classList.add('is-js');
levels.forEach((level) => {
  reset(level);
  level.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    answer(level, input.closest<HTMLElement>('.quiz-q')!, input);
  });
  level.querySelector('[data-retry]')!.addEventListener('click', () => { reset(level); level.scrollIntoView(); });
});
tabs.forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); open(a.dataset.levelTab!); }));
open(location.hash.slice(1));
