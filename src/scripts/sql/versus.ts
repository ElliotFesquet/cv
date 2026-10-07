// Versus mode: 7 timed rounds against a bot. First correct answer takes the round's points.
// Rules and bot tuning: bots.ts. Question display and answer checks: versus-round.ts.
// Animation hooks on .sql-versus: data-screen, data-phase (countdown | live), data-outcome (you | bot | none),
// data-urgent (< 10 s left), data-result (won | lost | draw); --clock (time left) and --bot (opponent progress), 0–1.
import { sqlUi, type SqlKey } from './i18n';
import { attempt, phase, LIMIT, LOCK, ORDER, POINTS, type Attempt, type Kind, type Tier } from './bots';
import { mount, prepare, reveal, setLive, type Item } from './versus-round';

type Who = 'you' | 'bot' | 'none';
type Record3 = { w: number; l: number; d: number };
const root = document.querySelector<HTMLElement>('.sql-versus')!;
const lang = document.documentElement.lang === 'fr' ? 'fr' : 'en';
const t = (k: SqlKey, vars: Record<string, unknown> = {}) =>
  sqlUi[lang][k].replace(/\{(\w+)\}/g, (_, v) => String(vars[v]));
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
const store = {
  get: (k: string) => { try { return localStorage.getItem(`cv:sql:versus:${k}`); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(`cv:sql:versus:${k}`, v); } catch { /* private mode */ } },
};
const pool: Record<Tier, Record<Kind, Item[]>> = JSON.parse($('#vs-pool').textContent!);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const shuffle = <T>(a: T[]) => a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map(([, x]) => x);

let tier: Tier = 'junior', rounds: Item[] = [], n = 0, match = 0;
let score = { you: 0, bot: 0 }, results: Who[] = [];
let t0 = 0, timer = 0, youOut = false;
let bot: Attempt & { tries: number; out: boolean; lockUntil: number };
const botName = () => t(`bot.${tier}` as SqlKey);

function screen(s: 'setup' | 'play' | 'end') {
  root.dataset.screen = s;
  if (s === 'play') $('.vs-match').scrollIntoView(); // HUD and question on one screen
  else if (root.getBoundingClientRect().top < 0) root.scrollIntoView();
}

const record = (b: string): Record3 => ({ w: 0, l: 0, d: 0, ...JSON.parse(store.get(b) ?? '{}') });
const paintRecords = () => root.querySelectorAll<HTMLElement>('[data-record]').forEach((el) => {
  el.textContent = t('vs.record', record(el.dataset.record!));
});

function paintScore() {
  $('[data-you-score]').textContent = String(score.you);
  $('[data-bot-score]').textContent = String(score.bot);
  root.querySelectorAll<HTMLElement>('.vs-dots li').forEach((li, i) => {
    if (results[i]) li.dataset.state = results[i]; else delete li.dataset.state;
    li.toggleAttribute('data-current', i === n);
  });
}

function paintClock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  $('[data-clock]').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  root.style.setProperty('--clock', String(Math.max(0, ms) / (LIMIT[rounds[n].kind] * 1000)));
  root.toggleAttribute('data-urgent', ms > 0 && ms < 10000);
}

function paintBot(frac: number, key: SqlKey) {
  root.style.setProperty('--bot', String(Math.min(1, frac)));
  $('[data-bot-phase]').textContent = frac > 0 && frac < 1 ? `${t(key)} · ${Math.floor(frac * 100)}%` : t(key);
  $('.vs-opp-status').dataset.phase = key.slice(6);
}

function start(next: Tier) {
  tier = next;
  const picks = { quiz: shuffle(pool[tier].quiz), theory: shuffle(pool[tier].theory), problem: shuffle(pool[tier].problem) };
  const used = { quiz: 0, theory: 0, problem: 0 };
  rounds = ORDER.map((k) => picks[k][used[k]++]);
  n = -1; score = { you: 0, bot: 0 }; results = [];
  root.dataset.tier = tier;
  $('[data-bot-name]').textContent = botName();
  screen('play');
  nextRound(++match);
}

async function nextRound(id: number) {
  n++;
  if (n === rounds.length) return end();
  const item = rounds[n];
  delete root.dataset.outcome;
  $('.vs-verdict').hidden = true;
  mount(item, onAnswer);
  const pts = POINTS[item.kind];
  $('[data-kicker]').textContent = `${t('vs.round')} ${n + 1}/${rounds.length} · ${t(`vs.kind.${item.kind}`)} · ${pts} ${t(pts > 1 ? 'vs.pts' : 'vs.pt')}`;
  paintScore(); paintClock(LIMIT[item.kind] * 1000); paintBot(0, 'vs.ph.wait');
  root.dataset.phase = 'countdown';
  const splash = $('[data-splash]');
  splash.textContent = item.kind === 'problem' ? t('loading') : '';
  await prepare(item);
  for (const s of ['3', '2', '1', t('vs.go')]) {
    if (id !== match) return; // player quit during the countdown
    splash.textContent = s;
    splash.classList.remove('is-tick'); void splash.offsetWidth; splash.classList.add('is-tick');
    await wait(s.length > 1 ? 450 : 700);
  }
  if (id !== match) return;
  root.dataset.phase = 'live';
  t0 = performance.now(); youOut = false;
  bot = { ...attempt(tier, item.kind, item.diff ?? '', 0, t0), tries: 0, out: false, lockUntil: 0 };
  setLive(true);
  timer = window.setInterval(tick, 100);
}

function tick() {
  const now = performance.now(), kind = rounds[n].kind;
  const left = LIMIT[kind] * 1000 - (now - t0);
  paintClock(left);
  if (left <= 0) return finish('none');
  if (bot.out) return paintBot(0, 'vs.ph.out');
  if (now < bot.lockUntil) return paintBot(0, 'vs.ph.wrong');
  const frac = (now - bot.start) / bot.dur;
  if (frac < 1) return paintBot(frac, phase(kind, frac));
  if (bot.ok) return finish('bot');
  if (kind === 'quiz') { // the bot picked a wrong option
    bot.out = true;
    paintBot(0, 'vs.ph.out');
    if (youOut) finish('none');
    return;
  }
  bot.tries++;
  bot.lockUntil = now + LOCK;
  Object.assign(bot, attempt(tier, kind, rounds[n].diff ?? '', bot.tries, bot.lockUntil));
}

function onAnswer(ok: boolean) {
  if (ok) return finish('you');
  if (rounds[n].kind !== 'quiz') return; // theory/problem: versus-round.ts locks the player out
  youOut = true;
  if (bot.out) return finish('none');
  bot.dur = Math.min(bot.dur, performance.now() - bot.start + 2500); // no need to wait the bot's full time
}

function finish(who: Who) {
  clearInterval(timer);
  setLive(false);
  const item = rounds[n], elapsed = performance.now() - t0;
  if (who !== 'none') score[who] += POINTS[item.kind];
  results[n] = who;
  root.dataset.outcome = who;
  if (who === 'bot') paintBot(1, 'vs.ph.done');
  paintScore();
  const s = (elapsed / 1000).toFixed(1);
  $('[data-verdict-msg]').textContent = who === 'you' ? t('vs.win', { s }) : who === 'bot' ? t('vs.lose', { b: botName(), s })
    : elapsed >= LIMIT[item.kind] * 1000 ? t('vs.timeout') : t('vs.none');
  reveal();
  const next = $<HTMLButtonElement>('[data-next]');
  next.textContent = `${n === rounds.length - 1 ? t('vs.final') : t('vs.next')} →`;
  $('.vs-verdict').hidden = false;
  next.focus({ preventScroll: true });
}

function end() {
  const res = score.you > score.bot ? 'won' : score.you < score.bot ? 'lost' : 'draw';
  const rec = record(tier);
  rec[res[0] as keyof Record3]++;
  store.set(tier, JSON.stringify(rec));
  root.dataset.result = res;
  $('[data-end-title]').textContent = t(`vs.${res}`);
  $('[data-end-score]').textContent = `${score.you} – ${score.bot}`;
  $('[data-end-msg]').textContent = t(`vs.${res}.msg` as SqlKey, { b: botName() });
  paintRecords();
  screen('end');
  $<HTMLButtonElement>('[data-rematch]').focus({ preventScroll: true });
}

function quit() {
  match++;
  clearInterval(timer);
  setLive(false);
  screen('setup');
  root.querySelector<HTMLElement>(`[data-bot="${tier}"]`)?.focus({ preventScroll: true });
}

root.classList.add('is-js');
root.querySelectorAll<HTMLElement>('[data-bot]').forEach((a) =>
  a.addEventListener('click', (e) => { e.preventDefault(); start(a.dataset.bot as Tier); }));
$('[data-next]').addEventListener('click', () => nextRound(match));
$('[data-rematch]').addEventListener('click', () => start(tier));
$('[data-change]').addEventListener('click', quit);
$('[data-quit]').addEventListener('click', (e) => { e.preventDefault(); quit(); });
paintRecords();
