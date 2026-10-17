// Tiny Web Audio instruments for the generative arena music: everything is synthesised, no audio files.
export type Step = (n: number, t: number) => void; // n = 16th-note index, t = start time (s)
export interface Song { name: string; bpm: number; build(ctx: AudioContext, out: AudioNode, d: number): Step }

export const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
export const pick = <T>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];

// Chord = [semitones above the key, quality]; returns a bass root (octave 1-2) and a pad voicing between E3 and E4.
const QUALITY = { m: [0, 3, 7], M: [0, 4, 7], m7: [0, 3, 7, 10], M7: [0, 4, 7, 11], m9: [0, 3, 7, 14], add9: [0, 4, 7, 14] };
export type Chord = [number, keyof typeof QUALITY];
export function chord(key: number, [step, q]: Chord) {
  const root = ((key + step) % 12) + 24; // C1..B1
  return { bass: root < 28 ? root + 12 : root, pad: QUALITY[q].map((i) => 52 + ((root + i - 52 + 120) % 12) + (i >= 12 ? 12 : 0)) };
}
// Minor pentatonic of the key, two octaves from `low`.
export const penta = (key: number, low: number) =>
  [0, 3, 5, 7, 10, 12, 15, 17, 19, 22].map((i) => low + ((key - low + 120) % 12) + i);

const noises = new WeakMap<BaseAudioContext, AudioBuffer>();
function noise(ctx: BaseAudioContext) {
  let b = noises.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noises.set(ctx, b);
  }
  return b;
}

// Percussive envelope: fast attack, exponential decay to silence.
function hit(ctx: BaseAudioContext, out: AudioNode, t: number, peak: number, decay: number) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  g.connect(out);
  return g;
}

function burst(ctx: BaseAudioContext, out: AudioNode, t: number, type: BiquadFilterType, freq: number, peak: number, decay: number, rate = 1) {
  const n = ctx.createBufferSource();
  n.buffer = noise(ctx);
  n.playbackRate.value = rate;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  n.connect(f).connect(hit(ctx, out, t, peak, decay));
  n.start(t, Math.random() * 0.5);
  n.stop(t + decay + 0.05);
}

export function kick(ctx: BaseAudioContext, out: AudioNode, t: number, peak = 0.9) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(160, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  o.connect(hit(ctx, out, t, peak, 0.32));
  o.start(t);
  o.stop(t + 0.4);
}

export function snare(ctx: BaseAudioContext, out: AudioNode, t: number, peak = 0.5, decay = 0.16, pitch = 1) {
  burst(ctx, out, t, 'highpass', 1200 * pitch, peak, decay, pitch);
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(210 * pitch, t);
  o.frequency.exponentialRampToValueAtTime(130 * pitch, t + 0.08);
  o.connect(hit(ctx, out, t, peak * 0.7, 0.1));
  o.start(t);
  o.stop(t + 0.15);
}

export const hat = (ctx: BaseAudioContext, out: AudioNode, t: number, peak = 0.1, decay = 0.04) =>
  burst(ctx, out, t, 'highpass', 7500, peak, decay);

interface NoteOpts { type?: OscillatorType; peak?: number; attack?: number; release?: number; cutoff?: number; detune?: number }
// Held note: two detuned oscillators through a low-pass, linear attack and release.
export function note(ctx: BaseAudioContext, out: AudioNode, t: number, freq: number, dur: number, o: NoteOpts = {}) {
  const { type = 'sine', peak = 0.2, attack = 0.01, release = 0.1, cutoff = 2000, detune = 0 } = o;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = cutoff;
  const g = ctx.createGain();
  const a = Math.min(attack, dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, t + dur);
  g.gain.linearRampToValueAtTime(0, t + dur + release);
  f.connect(g).connect(out);
  for (const cents of detune ? [-detune, detune] : [0]) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = cents;
    osc.connect(f);
    osc.start(t);
    osc.stop(t + dur + release + 0.05);
  }
}

// Synthetic reverb: stereo noise impulse with a decaying tail.
export function reverb(ctx: BaseAudioContext, seconds: number, decay: number) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const b = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay;
  }
  const v = ctx.createConvolver();
  v.buffer = b;
  return v;
}

export function drive(ctx: BaseAudioContext, k: number) {
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(k * (i / 512 - 1));
  const w = ctx.createWaveShaper();
  w.curve = curve;
  return w;
}

// Gain node routed to `dry` at full level and to `send` at `amount` (e.g. a reverb).
export function bus(ctx: BaseAudioContext, dry: AudioNode, send: AudioNode, amount: number, level = 1) {
  const g = ctx.createGain();
  g.gain.value = level;
  const s = ctx.createGain();
  s.gain.value = amount;
  g.connect(dry);
  g.connect(s).connect(send);
  return g;
}
