// Typing Arena content: practice texts (texts.yaml) and tutorial steps (tutorial.yaml), en/fr.
import { load } from 'js-yaml';
import textsRaw from './texts.yaml?raw';
import tutorialRaw from './tutorial.yaml?raw';
import type { Lang } from '../../i18n/ui';

export interface Passage { topic: string; text: string }
export const texts = load(textsRaw) as Record<Lang, Passage[]>;

// Letters (accented too), digits, single spaces and common punctuation only: fail the build on anything else.
for (const [lang, list] of Object.entries(texts)) {
  for (const p of list) {
    p.text = p.text.normalize('NFC').trim().replace(/\s+/g, ' ');
    const bad = p.text.match(/[^\p{L}\p{N} .,'\-:;!?%()$]/u);
    if (bad) throw new Error(`typing/texts.yaml (${lang}, ${p.topic}): unsupported character "${bad[0]}"`);
  }
}

export interface Step { title: Record<Lang, string>; body: Record<Lang, string[]> }
export const tutorial = load(tutorialRaw) as Step[];
