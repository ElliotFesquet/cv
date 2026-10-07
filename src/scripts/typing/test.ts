// Speed test: the clock starts on the first key and runs for the chosen duration; text is refilled as you go.
// Hooks on .ty-test: data-state (ready | run | end), --clock (time left, 0–1), data-urgent (< 5 s left).
import { createTyper, wpm, perMin, accuracy } from './engine';
import { bots } from './bots';
import { deck, lang, store, t, textLang } from './common';
import type { TypingKey } from './i18n';

const root = document.querySelector<HTMLElement>('.ty-test')!;
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
const radios = [...root.querySelectorAll<HTMLInputElement>('[data-time] input[type="radio"]')];
const custom = $<HTMLInputElement>('.ty-custom input[type="number"]');
const modal = $<HTMLDialogElement>('.ty-modal');

type Score = { d: string; s: number; l: string; w: number; c: number; a: number };
let ms = 60000, t0 = 0, timer = 0, next = () => '';
const typer = createTyper($('.ty-box'), { onKey, onEscape: reset });
const pickLang = textLang(reset);
const name = (id: string) => t(`bot.${id}` as TypingKey);
const span = (secs: number) => (secs < 60 ? `${secs} s` : `${+(secs / 60).toFixed(1)} min`);

function readTime() {
  const r = radios.find((x) => x.checked);
  const isCustom = r?.value === 'custom';
  const secs = isCustom ? Math.min(3600, Math.max(5, Math.round(Number(custom.value) || 60))) : Number(r?.value ?? 60);
  if (isCustom) custom.value = String(secs);
  store.set('time', isCustom ? `c${secs}` : String(secs));
  ms = secs * 1000;
}

// Live numbers are averaged over at least 5 s so the first words don't show absurd speeds.
function hud(left: number, used: number) {
  const s = typer.stats(), span = Math.max(used, 5000);
  $('[data-clock]').textContent = String(Math.max(0, Math.ceil(left / 1000)));
  $('[data-wpm]').textContent = String(wpm(s.chars, span));
  $('[data-cpm]').textContent = String(perMin(s.chars, span));
  $('[data-acc]').textContent = String(s.keys ? accuracy(s) : 0);
  root.style.setProperty('--clock', String(Math.max(0, left) / ms));
  root.toggleAttribute('data-urgent', left > 0 && left < 5000);
}

function reset() {
  clearInterval(timer);
  if (modal.open) modal.close();
  readTime();
  root.dataset.state = 'ready';
  next = deck(pickLang());
  typer.load(next());
  typer.setLive(true);
  hud(ms, 0);
  typer.focus();
}

function onKey() {
  if (root.dataset.state === 'ready') {
    root.dataset.state = 'run';
    t0 = performance.now();
    timer = window.setInterval(tick, 200);
  }
  if (typer.left < 60) typer.append(next());
}

function tick() {
  const used = performance.now() - t0;
  if (used >= ms) return end();
  hud(ms - used, used);
}

function end() {
  clearInterval(timer);
  typer.setLive(false);
  root.dataset.state = 'end';
  hud(0, ms);
  const st = typer.stats(), w = wpm(st.chars, ms), c = perMin(st.chars, ms), a = accuracy(st), secs = ms / 1000;
  const beaten = bots.filter((b) => b.wpm <= w).at(-1), target = bots.find((b) => b.wpm > w);
  $('[data-r-title]').textContent = beaten ? t('res.like', { b: name(beaten.id) }) : t('res.slow');
  $('[data-r-body]').innerHTML = t('res.body', { w: `<mark>${w} ${t('wpm')}</mark>`, c, a: `<strong>${a} %</strong>` });

  const best = Number(store.get(`best:${secs}`) ?? 0);
  if (w > best) store.set(`best:${secs}`, String(w));
  $('[data-r-best]').textContent = w > best && best > 0 ? t('res.newbest') : t('res.best', { t: span(secs), w: Math.max(w, best) });
  $('[data-r-rank]').textContent = [beaten && t('res.beat', { b: name(beaten.id) }),
    target ? t('res.next', { b: name(target.id), w: target.wpm }) : t('res.top')].filter(Boolean).join(' ');
  const race = $<HTMLAnchorElement>('[data-race]'), foe = target ?? bots.at(-1)!;
  race.textContent = t('res.race', { b: name(foe.id) });
  race.hash = foe.id;

  save({ d: new Date().toISOString(), s: secs, l: pickLang(), w, c, a });
  modal.showModal();
  $('[data-again]').focus();
}

// "My scores": the last 10 results and the best per duration, from localStorage.
const history = (): Score[] => { try { return JSON.parse(store.get('history') ?? '[]'); } catch { return []; } };
function save(score: Score) {
  store.set('history', JSON.stringify([score, ...history()].slice(0, 50)));
  paintScores();
}
function paintScores() {
  const list = history();
  if (!list.length) return;
  const date = new Intl.DateTimeFormat(lang, { dateStyle: 'short', timeStyle: 'short' });
  const bests = [...new Set(list.map((x) => x.s))].sort((x, y) => x - y)
    .map((secs) => `${span(secs)} · ${Math.max(...list.filter((x) => x.s === secs).map((x) => x.w))} ${t('wpm')}`);
  const rows = list.slice(0, 10).map((x) => `<tr><td>${date.format(new Date(x.d))}</td><td>${span(x.s)}</td>` +
    `<td>${x.l.toUpperCase()}</td><td>${x.w}</td><td>${x.c}</td><td>${x.a} %</td></tr>`).join('');
  $('[data-scores]').innerHTML = `<p><strong>${t('scores.best')}</strong> · ${bests.join(' · ')}</p>
    <table><thead><tr><th>${t('scores.date')}</th><th>${t('scores.time')}</th><th>${t('scores.text')}</th>
    <th>${t('hud.wpm')}</th><th>${t('hud.cpm')}</th><th>${t('hud.acc')}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// Restore the last duration, then wire the settings: any change starts a fresh test.
const saved = store.get('time');
if (saved) {
  const isCustom = saved.startsWith('c');
  radios.forEach((r) => { r.checked = isCustom ? r.value === 'custom' : r.value === saved; });
  if (isCustom) custom.value = saved.slice(1);
}
radios.forEach((r) => r.addEventListener('change', reset));
custom.addEventListener('focus', () => { radios.find((r) => r.value === 'custom')!.checked = true; });
custom.addEventListener('change', reset);
$('.ty-settings').addEventListener('submit', (e) => { e.preventDefault(); reset(); });
$('[data-again]').addEventListener('click', reset);
$('[data-close]').addEventListener('click', () => modal.close());
root.classList.add('is-js');
paintScores();
reset();
