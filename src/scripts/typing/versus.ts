// Versus: you and a bot type the same passage; first to the last character wins. Bot speeds: bots.ts.
// Hooks on .ty-versus: data-screen (setup | race | end), data-phase (countdown | live), data-result (won | lost);
// --you and --bot (progress, 0–1). The bot's position is the .is-ghost character in the text.
import { createTyper, wpm, accuracy } from './engine';
import { bots, schedule, type BotId } from './bots';
import { deck, store, t, textLang } from './common';
import type { TypingKey } from './i18n';

const root = document.querySelector<HTMLElement>('.ty-versus')!;
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pickLang = textLang(() => {});
const typer = createTyper($('.ty-box'), { strict: true, onKey: check, onEscape: quit });

let foe: (typeof bots)[number] = bots[0], times: number[] = [], t0 = 0, raf = 0, race = 0, botAt = 0;
const name = () => t(`bot.${foe.id}` as TypingKey);
const record = (id: string) => ({ w: 0, l: 0, ...JSON.parse(store.get(`versus:${id}`) ?? '{}') });
const paintRecords = () => root.querySelectorAll<HTMLElement>('[data-record]').forEach((el) => {
  const r = record(el.dataset.record!);
  el.textContent = r.w + r.l ? `· ${t('vs.record', r)}` : '';
});

function screen(s: 'setup' | 'race' | 'end') {
  root.dataset.screen = s;
  if (s === 'race') $('.ty-race').scrollIntoView(); // lanes and text on one screen
  else if (root.getBoundingClientRect().top < 0) root.scrollIntoView();
}

async function start(id: BotId) {
  foe = bots.find((b) => b.id === id)!;
  const text = deck(pickLang())();
  const me = ++race;
  times = schedule(foe.wpm, text); botAt = 0;
  typer.load(text); typer.setLive(false); typer.setGhost(0);
  $('[data-bot-name]').textContent = name();
  paint(0);
  delete root.dataset.result;
  root.dataset.phase = 'countdown';
  screen('race');
  typer.focus();
  const splash = $('[data-splash]');
  for (const s of ['3', '2', '1', t('vs.go')]) {
    if (me !== race) return; // left during the countdown
    splash.textContent = s;
    splash.classList.remove('is-tick'); void splash.offsetWidth; splash.classList.add('is-tick');
    await wait(s.length > 1 ? 400 : 700);
  }
  if (me !== race) return;
  root.dataset.phase = 'live';
  typer.setLive(true);
  typer.focus();
  t0 = performance.now();
  raf = requestAnimationFrame(tick);
}

function paint(used: number) {
  const total = typer.total;
  root.style.setProperty('--you', String(typer.pos / total));
  root.style.setProperty('--bot', String(botAt / total));
  $('[data-you-wpm]').textContent = String(wpm(typer.pos, used));
  $('[data-bot-wpm]').textContent = String(wpm(botAt, used));
}

function tick() {
  const used = performance.now() - t0;
  while (botAt < times.length && times[botAt] <= used) botAt++;
  typer.setGhost(botAt);
  paint(used);
  if (botAt >= typer.total) return end(false);
  raf = requestAnimationFrame(tick);
}

function check() {
  if (root.dataset.phase === 'live' && typer.left === 0) end(true);
}

function end(won: boolean) {
  cancelAnimationFrame(raf);
  typer.setLive(false);
  root.dataset.phase = '';
  const used = performance.now() - t0, s = typer.stats();
  paint(used);
  const r = record(foe.id);
  r[won ? 'w' : 'l']++;
  store.set(`versus:${foe.id}`, JSON.stringify(r));
  root.dataset.result = won ? 'won' : 'lost';
  $('[data-end-title]').textContent = t(won ? 'vs.won' : 'vs.lost');
  $('[data-end-stats]').textContent = t('vs.stats',
    { w: wpm(s.chars, used), a: accuracy(s), b: name(), bw: wpm(botAt, Math.min(used, times.at(-1)!)) });
  $('[data-end-msg]').textContent = won
    ? t('vs.won.msg', { b: name(), s: ((times.at(-1)! - used) / 1000).toFixed(1) })
    : t('vs.lost.msg', { b: name(), n: typer.total - typer.pos });
  paintRecords();
  screen('end');
  $('[data-rematch]').focus({ preventScroll: true });
}

function quit() {
  race++;
  cancelAnimationFrame(raf);
  typer.setLive(false);
  screen('setup');
  root.querySelector<HTMLElement>(`[data-bot="${foe.id}"]`)?.focus({ preventScroll: true });
}

root.querySelectorAll<HTMLElement>('[data-bot]').forEach((a) =>
  a.addEventListener('click', (e) => { e.preventDefault(); start(a.dataset.bot as BotId); }));
$('[data-rematch]').addEventListener('click', () => start(foe.id));
$('[data-change]').addEventListener('click', quit);
$('[data-quit]').addEventListener('click', (e) => { e.preventDefault(); quit(); });
root.classList.add('is-js');
paintRecords();
// Coming from a test result (#engineer): highlight that opponent.
const asked = location.hash.slice(1);
if (bots.some((b) => b.id === asked)) root.querySelector<HTMLElement>(`[data-bot="${asked}"]`)?.focus({ preventScroll: true });
