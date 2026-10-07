// Versus opponents and their typing speed. A bot's race is a schedule: the time (ms) at which it types each character.
export const bots = [
  { id: 'intern', wpm: 40 },
  { id: 'apprentice', wpm: 60 },
  { id: 'engineer', wpm: 80 },
  { id: 'senior', wpm: 100 },
  { id: 'principal', wpm: 120 },
  { id: 'machine', wpm: 150 },
] as const;
export type BotId = (typeof bots)[number]['id'];

// Uneven keystrokes, a pause at some word starts, a rare slip (typo + fix). The whole race is then rescaled so the
// bot lands within ±3 % of its listed speed.
export function schedule(wpm: number, text: string): number[] {
  const times: number[] = [];
  let t = 0;
  for (const ch of text) {
    let d = 0.6 + Math.random() * 0.8;
    if (ch === ' ' && Math.random() < 0.25) d += 1.5 + Math.random() * 2;
    if (Math.random() < 0.02) d += 3;
    t += d;
    times.push(t);
  }
  const target = (text.length / ((wpm * 5) / 60)) * 1000 * (0.97 + Math.random() * 0.06);
  return times.map((x) => (x / t) * target);
}
