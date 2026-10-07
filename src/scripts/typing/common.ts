// Shared by the test and versus scripts: strings, storage, text language and the text deck.
import { typingUi, fill, type TypingKey } from './i18n';
import type { Passage } from '../../data/typing';

type Lang = 'en' | 'fr';
export const lang: Lang = document.documentElement.lang === 'fr' ? 'fr' : 'en';
export const t = (k: TypingKey, vars: Record<string, unknown> = {}) => fill(typingUi[lang][k], vars);

// The origin is shared with other repos of this user: keys are prefixed cv:typing:.
export const store = {
  get: (k: string) => { try { return localStorage.getItem(`cv:typing:${k}`); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(`cv:typing:${k}`, v); } catch { /* private mode */ } },
};

const texts: Record<Lang, Passage[]> = JSON.parse(document.getElementById('ty-texts')!.textContent!);
const shuffle = <T>(a: T[]) => a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map(([, x]) => x);

// Text-language radios: restored from storage, saved on change, onChange called after.
export function textLang(onChange: () => void) {
  const radios = [...document.querySelectorAll<HTMLInputElement>('[data-text-lang] input')];
  const saved = store.get('lang');
  radios[0]?.form?.addEventListener('submit', (e) => e.preventDefault());
  radios.forEach((r) => {
    if (saved) r.checked = r.value === saved;
    r.addEventListener('change', () => { store.set('lang', r.value); onChange(); });
  });
  return () => (radios.find((r) => r.checked)?.value ?? lang) as Lang;
}

// Endless draw of passages: every text once, in random order, then a new shuffle.
export function deck(l: Lang) {
  let order = shuffle(texts[l]), i = 0;
  return () => {
    if (i === order.length) { order = shuffle(texts[l]); i = 0; }
    return order[i++].text;
  };
}

export const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
