// Arena background music (components/Music.astro): generated live with Web Audio, starts on the first key or
// click (browsers block audio before that), mute toggle remembered in localStorage, paused while the tab is hidden.
// Plays a random song of the page's genre, then crossfades to another random one every BARS bars.
import { breakcore } from './breakcore';
import { chillstep } from './chillstep';
import type { Song, Step } from './synth';

const KEY = 'cv:music:on';
const VOLUME = 0.45;
const AHEAD = 0.15; // seconds scheduled in advance
const BARS = 64;    // about 1.5 to 2 minutes per song

const root = document.querySelector<HTMLElement>('[data-music]');
if (root && 'AudioContext' in window) init(root);

function init(root: HTMLElement) {
  const songs = root.dataset.music === 'breakcore' ? breakcore : chillstep;
  const btn = root.querySelector('button')!;
  const state = root.querySelector('[data-music-state]')!;
  const title = root.querySelector('[data-music-song]')!;
  const shuffle = (prev?: Song) => {
    const pool = songs.filter((s) => s !== prev);
    return pool[Math.floor(Math.random() * pool.length)];
  };
  let song = shuffle();
  let on = true, started = false, timer = 0, next = 0, n = 0;
  let ctx: AudioContext | undefined, master: GainNode, track: GainNode | undefined, step: Step, d = 0;
  try { on = localStorage.getItem(KEY) !== '0'; } catch {}

  const paint = () => {
    btn.setAttribute('aria-pressed', String(on));
    state.textContent = (on ? root.dataset.on : root.dataset.off) ?? '';
    title.textContent = song.name;
  };
  // Each song gets its own gain node so the previous one can fade out and be disconnected.
  const load = (s: Song) => {
    const c = ctx!, old = track;
    if (old) {
      old.gain.setTargetAtTime(0, c.currentTime, 0.6);
      setTimeout(() => old.disconnect(), 4000);
    }
    song = s;
    d = 60 / s.bpm / 4;
    n = 0;
    track = c.createGain();
    track.gain.setValueAtTime(0, c.currentTime);
    track.gain.setTargetAtTime(1, c.currentTime, old ? 0.8 : 0.01);
    track.connect(master);
    step = s.build(c, track, d);
    paint();
  };
  const tick = () => {
    for (; next < ctx!.currentTime + AHEAD; next += d) {
      if (n === BARS * 16) load(shuffle(song));
      step(n++, next);
    }
  };
  const play = () => {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.createDynamicsCompressor()).connect(ctx.destination);
      load(song);
    }
    ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(VOLUME, ctx.currentTime, 0.4);
    if (!timer) {
      next = Math.max(next, ctx.currentTime + 0.05);
      timer = window.setInterval(tick, 25);
    }
  };
  const pause = () => {
    if (!ctx || !timer) return;
    clearInterval(timer);
    timer = 0;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    setTimeout(() => !timer && ctx!.suspend(), 500);
  };
  const sync = () => (on && started && !document.hidden ? play() : pause());

  const first = (e: Event) => {
    if (root.contains(e.target as Node)) return; // the toggle handles its own click
    started = true;
    sync();
    for (const ev of ['pointerdown', 'keydown']) document.removeEventListener(ev, first, true);
  };
  for (const ev of ['pointerdown', 'keydown']) document.addEventListener(ev, first, true);
  document.addEventListener('visibilitychange', sync);
  btn.addEventListener('click', () => {
    on = !on;
    started = true;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch {}
    paint();
    sync();
  });
  paint();
  root.hidden = false;
}
