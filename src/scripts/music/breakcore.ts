// Breakcore for the versus modes: chopped breakbeats, snare-roll fills, distorted reese bass. One generator, five songs.
import { bus, chord, drive, hat, hz, kick, note, penta, pick, reverb, snare, type Chord, type Song } from './synth';

const BREAKS = {
  amen: { k: [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0], s: [0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1] },
  think: { k: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0], s: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0] },
  two: { k: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], s: [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0] },
  pound: { k: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], s: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1] },
};
interface Opts {
  name: string; bpm: number; key: number; prog: Chord[]; brk: keyof typeof BREAKS;
  chop: number; grit: number; lead: OscillatorType; pad: OscillatorType;
}

function make(o: Opts): Song {
  const chords = o.prog.map((c) => chord(o.key, c));
  const lead = penta(o.key, 69);
  const { k: KICK, s: SNARE } = BREAKS[o.brk];
  return {
    name: o.name,
    bpm: o.bpm,
    build(ctx, out, d) {
      const verb = reverb(ctx, 1.4, 3);
      verb.connect(out);
      const drums = drive(ctx, 2.5);
      drums.connect(bus(ctx, out, verb, 0.12, 0.8));
      const reese = drive(ctx, o.grit);
      const low = ctx.createBiquadFilter();
      low.type = 'lowpass';
      low.frequency.value = 700;
      reese.connect(low).connect(bus(ctx, out, verb, 0.05, 0.3));
      const synths = bus(ctx, out, verb, 0.5, 1);
      let mode = 0; // 0 = straight break, 1 = chopped, 2 = snare-roll fill

      return (n, t) => {
        const s = n % 16, bar = Math.floor(n / 16), c = chords[Math.floor(bar / 2) % chords.length];
        if (s === 0) mode = bar % 4 === 3 ? 2 : Math.random() < o.chop ? 1 : 0;

        if (mode === 2 && s >= 8) { // 32nd-note roll that climbs in pitch and level
          const r = (s - 8) / 8;
          snare(ctx, drums, t, 0.25 + r * 0.35, 0.07, 1 + r * 0.8);
          snare(ctx, drums, t + d / 2, 0.25 + r * 0.35, 0.07, 1.05 + r * 0.8);
        } else {
          const j = mode === 1 && s >= 8 ? (s * 7 + bar * 3) % 16 : s; // re-sequence the second half
          if (KICK[j]) kick(ctx, drums, t);
          if (SNARE[j]) snare(ctx, drums, t, 0.55, 0.14);
          else if (Math.random() < 0.12) snare(ctx, drums, t, 0.15, 0.06);
          if (mode === 1 && Math.random() < 0.2) snare(ctx, drums, t + d / 2, 0.3, 0.05, 1.3);
        }
        hat(ctx, drums, t, s % 2 ? 0.05 : 0.1, 0.03);

        if (s % 4 === 0) note(ctx, reese, t, hz(c.bass + (Math.random() < 0.2 ? 12 : 0)), d * 3.2,
          { type: 'sawtooth', peak: 0.6, detune: 18, cutoff: 1400, release: 0.05 });
        if (s === 0 && bar % 2 === 0) for (const m of c.pad)
          note(ctx, synths, t, hz(m), d * 30, { type: o.pad, peak: 0.03, attack: 0.5, release: 0.6, detune: 6, cutoff: 2500 });
        if (mode !== 0 && s % 2 === 0 && Math.random() < 0.5)
          note(ctx, synths, t, hz(pick(lead)), d * 0.8, { type: o.lead, peak: 0.035, cutoff: 3200, release: 0.04 });
      };
    },
  };
}

// key: 0 = C … 9 = A
export const breakcore: Song[] = [
  make({ name: 'Amen Riot', bpm: 180, key: 9, prog: [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']], brk: 'amen', chop: 0.4, grit: 5, lead: 'square', pad: 'triangle' }),
  make({ name: 'Glass Jungle', bpm: 174, key: 2, prog: [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']], brk: 'think', chop: 0.5, grit: 4, lead: 'sawtooth', pad: 'triangle' }),
  make({ name: 'Static Bloom', bpm: 190, key: 4, prog: [[0, 'm'], [8, 'M'], [5, 'm'], [7, 'M']], brk: 'amen', chop: 0.35, grit: 6, lead: 'triangle', pad: 'sawtooth' }),
  make({ name: 'Neon Collapse', bpm: 200, key: 6, prog: [[0, 'm'], [0, 'm'], [8, 'M'], [10, 'M']], brk: 'pound', chop: 0.6, grit: 8, lead: 'square', pad: 'sawtooth' }),
  make({ name: 'Cherry Overflow', bpm: 185, key: 0, prog: [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']], brk: 'two', chop: 0.3, grit: 3, lead: 'sine', pad: 'triangle' }),
];
