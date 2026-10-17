// Chillstep for the SQL quiz, practice and challenges: half-time beat, warm pads, sub bass, echoing plucks. Five songs.
import { bus, chord, hat, hz, kick, note, penta, pick, reverb, snare, type Chord, type Song } from './synth';

interface Opts {
  name: string; bpm: number; key: number; prog: Chord[];
  pad: OscillatorType; pluck: OscillatorType; swing: number; busy: number; ghostKick: boolean;
}

function make(o: Opts): Song {
  const chords = o.prog.map((c) => chord(o.key, c));
  const plucked = penta(o.key, 66).slice(0, 7);
  return {
    name: o.name,
    bpm: o.bpm,
    build(ctx, out, d) {
      const verb = reverb(ctx, 3.5, 2.2);
      verb.connect(out);
      const echo = ctx.createDelay(1);
      echo.delayTime.value = d * 3; // dotted eighth
      const fb = ctx.createGain();
      fb.gain.value = 0.38;
      const tone = ctx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.value = 2200;
      echo.connect(tone).connect(fb).connect(echo);
      tone.connect(verb);
      tone.connect(out);
      const drums = bus(ctx, out, verb, 0.25, 0.7);
      const pads = bus(ctx, out, verb, 0.8, 1);
      const plucks = bus(ctx, out, echo, 0.45, 1);
      plucks.connect(verb);

      return (n, t) => {
        const s = n % 16, bar = Math.floor(n / 16), c = chords[Math.floor(bar / 2) % chords.length];
        if (s === 0 || (o.ghostKick && s === 10 && Math.random() < 0.5)) kick(ctx, drums, t, s ? 0.5 : 0.8);
        if (s === 8) snare(ctx, drums, t, 0.35, 0.28, 0.9);
        if (s % 2 === 0) hat(ctx, drums, t + (s % 4 === 2 ? d * o.swing : 0), s % 4 === 2 ? 0.06 : 0.035, 0.05);

        if (s === 0) note(ctx, out, t, hz(c.bass), d * 9, { peak: 0.3, attack: 0.02, release: 0.3 });
        if (s === 10) note(ctx, out, t, hz(c.bass), d * 5, { peak: 0.22, attack: 0.02, release: 0.3 });
        if (s === 0 && bar % 2 === 0) for (const m of c.pad)
          note(ctx, pads, t, hz(m), d * 30, { type: o.pad, peak: 0.025, attack: 1.2, release: 1.5, cutoff: 900, detune: 9 });
        if (bar % 8 > 0 && s % 2 === 0 && Math.random() < o.busy)
          note(ctx, plucks, t, hz(pick(plucked)), d * 1.2, { type: o.pluck, peak: 0.08, attack: 0.005, release: 0.25, cutoff: 2600 });
      };
    },
  };
}

// key: 0 = C … 9 = A
export const chillstep: Song[] = [
  make({ name: 'Rooftop Rain', bpm: 140, key: 9, prog: [[0, 'm7'], [8, 'M7'], [3, 'add9'], [10, 'M']], pad: 'sawtooth', pluck: 'triangle', swing: 0.15, busy: 0.28, ghostKick: true }),
  make({ name: 'Low Tide', bpm: 136, key: 2, prog: [[0, 'm9'], [8, 'M7'], [3, 'M7'], [10, 'M']], pad: 'sawtooth', pluck: 'sine', swing: 0.1, busy: 0.22, ghostKick: false }),
  make({ name: 'Paper Lanterns', bpm: 142, key: 4, prog: [[0, 'm7'], [8, 'M7'], [3, 'M'], [10, 'add9']], pad: 'triangle', pluck: 'triangle', swing: 0.18, busy: 0.32, ghostKick: true }),
  make({ name: 'Night Bus', bpm: 138, key: 0, prog: [[0, 'm9'], [8, 'M7'], [3, 'M7'], [10, 'M']], pad: 'sawtooth', pluck: 'sine', swing: 0.22, busy: 0.2, ghostKick: false }),
  make({ name: 'Polar Light', bpm: 145, key: 6, prog: [[0, 'm7'], [8, 'M7'], [5, 'm7'], [7, 'M']], pad: 'triangle', pluck: 'triangle', swing: 0.12, busy: 0.3, ghostKick: true }),
];
