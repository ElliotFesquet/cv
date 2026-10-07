// Versus bots: for each attempt a bot draws how long it takes and whether it gets it right, then plays that out
// on the clock. Tune the difficulty here: speed multiplies the base times, acc is the chance an attempt is right.
import type { SqlKey } from './i18n';

export type Kind = 'quiz' | 'theory' | 'problem';
export type Tier = 'junior' | 'senior' | 'principal';
export const tiers: Tier[] = ['junior', 'senior', 'principal'];

const profiles: Record<Tier, { speed: number; acc: Record<Kind, number> }> = {
  junior: { speed: 1.5, acc: { quiz: 0.65, theory: 0.6, problem: 0.55 } },
  senior: { speed: 1, acc: { quiz: 0.82, theory: 0.78, problem: 0.72 } },
  principal: { speed: 0.65, acc: { quiz: 0.94, theory: 0.92, problem: 0.88 } },
};

// Base solve time (s) at speed 1. Problems scale with the task difficulty (practice tasks have none).
const base: Record<string, number> = { quiz: 9, theory: 14, practice: 60, easy: 75, medium: 100, hard: 130 };

export const LIMIT: Record<Kind, number> = { quiz: 30, theory: 45, problem: 300 }; // round clock (s)
export const POINTS: Record<Kind, number> = { quiz: 1, theory: 2, problem: 3 };
export const LOCK = 5000; // lockout after a wrong answer (ms), for the player and the bot
export const ORDER: Kind[] = ['quiz', 'theory', 'quiz', 'problem', 'theory', 'quiz', 'problem'];

export interface Attempt { start: number; dur: number; ok: boolean }

// A retry is faster (the bot already read the question) and more likely right.
export function attempt(tier: Tier, kind: Kind, diff: string, tries: number, start: number): Attempt {
  const p = profiles[tier];
  const secs = base[kind === 'problem' ? diff : kind] * p.speed * (0.7 + Math.random() * 0.6) * (tries ? 0.5 : 1);
  return { start, dur: secs * 1000, ok: Math.random() < Math.min(0.97, p.acc[kind] + tries * 0.15) };
}

// What the bot is "doing" at a given fraction of its attempt, shown under its progress bar.
export function phase(kind: Kind, frac: number): SqlKey {
  if (frac < 0.15) return 'vs.ph.read';
  if (frac < 0.75) return kind === 'problem' ? 'vs.ph.write' : 'vs.ph.think';
  if (frac < 0.92) return kind === 'problem' ? 'vs.ph.run' : 'vs.ph.think';
  return 'vs.ph.submit';
}
