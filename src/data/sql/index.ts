// SQL game content: quiz levels, practice exercises and challenges (YAML, en/fr per field).
import { load } from 'js-yaml';
import noob from './quiz-noob.yaml?raw';
import intermediate from './quiz-intermediate.yaml?raw';
import pro from './quiz-pro.yaml?raw';
import practiceRaw from './practice.yaml?raw';
import challengesRaw from './challenges.yaml?raw';
import theoryRaw from './theory.yaml?raw';
import type { Lang } from '../../i18n/ui';

export type Text = string | Record<Lang, string>;
export interface Question { q: Text; options: Text[]; answer: number; why: Text }
export interface Task {
  id: string; title: Text; prompt: Text; hint?: Text; solution: string;
  ordered?: boolean; concept?: string; difficulty?: 'easy' | 'medium' | 'hard';
}

export const levels = ['noob', 'intermediate', 'pro'] as const;
export const quiz: Record<(typeof levels)[number], Question[]> = {
  noob: load(noob) as Question[],
  intermediate: load(intermediate) as Question[],
  pro: load(pro) as Question[],
};
export const practice = load(practiceRaw) as Task[];
export const challenges = load(challengesRaw) as Task[];
export interface Theory { level: 'easy' | 'medium' | 'hard'; q: Text; accept: (string | number)[]; why: Text }
export const theory = load(theoryRaw) as Theory[];

export const tx = (v: Text, lang: Lang) => (typeof v === 'string' ? v : v[lang]);

// Escapes HTML and turns `code` spans into <code>, for use with set:html.
export const inline = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
    .replace(/`([^`]+)`/g, '<code>$1</code>');
