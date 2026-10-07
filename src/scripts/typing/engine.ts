// Typing engine shared by the test and versus, word by word like livechat.com/typing-speed-test: one line, finished
// words slide off to the left, the current word sits in the middle, the rest of the text waits on the right.
// Space validates the word (a wrong one is struck through). Strict mode (versus) refuses a wrong key instead.
// Hooks: .ty-box[data-focus]; words .is-ok / .is-ko / .is-ghost (versus opponent); current word .ty-cur(.is-ko);
// typed characters .is-new (plays the SQL Arena reveal) / .is-ko; .ty-cur.is-miss (refused key, strict).
const fold = (c: string) => c.normalize('NFD').replace(/\p{M}/gu, '').replace(/[’‘]/g, "'");
const okChar = (got: string, want: string) => got === want || fold(got) === fold(want); // accents optional, case kept
const match = (got: string, want: string) => { // length of the correct start of `got`
  let i = 0;
  while (i < got.length && i < want.length && okChar(got[i], want[i])) i++;
  return i;
};
const AHEAD = 40, BEHIND = 30; // words kept on screen on each side

export interface Stats { chars: number; words: number; typed: number; keys: number; errors: number }
interface Options { strict?: boolean; onKey?: () => void; onEscape?: () => void }

export function createTyper(box: HTMLElement, opts: Options = {}) {
  const done = box.querySelector<HTMLElement>('.ty-done')!;
  const next = box.querySelector<HTMLElement>('.ty-next')!;
  const input = box.querySelector<HTMLInputElement>('.ty-input')!;
  let words: string[] = [], starts: number[] = [], wi = 0, cur = '', live = false, ghost = -1;
  let curEl: HTMLElement, restEl: HTMLElement;
  let st: Stats = { chars: 0, words: 0, typed: 0, keys: 0, errors: 0 };

  const word = (k: number, cls = '') => {
    const el = document.createElement('span');
    el.className = `ty-word ${cls}`.trim();
    el.dataset.i = String(k);
    el.textContent = words[k];
    return el;
  };
  const fillNext = () => {
    for (let k = wi + next.childElementCount; k <= wi + AHEAD && k < words.length; k++) next.append(word(k));
  };
  function newWord() {
    curEl = document.createElement('span');
    curEl.className = 'ty-cur';
    curEl.dataset.i = String(wi);
    done.append(curEl);
    fillNext();
    restEl = next.firstElementChild as HTMLElement;
    restEl.classList.add('ty-rest');
    paintGhost();
  }

  // Shows `v` as the current word: keeps the characters already on screen, flashes the new ones.
  function setCur(v: string) {
    const want = words[wi] ?? '';
    let keep = 0;
    while (keep < cur.length && keep < v.length && cur[keep] === v[keep]) keep++;
    while (curEl.childElementCount > keep) curEl.lastElementChild!.remove();
    for (let k = keep; k < v.length; k++) {
      const c = document.createElement('span');
      c.className = okChar(v[k], want[k] ?? '') ? 'ty-c is-new' : 'ty-c is-new is-ko';
      c.textContent = v[k];
      curEl.append(c);
    }
    cur = v;
    const ok = match(v, want);
    curEl.classList.toggle('is-ko', ok < v.length);
    restEl.textContent = want.slice(ok);
  }

  function miss() {
    curEl.classList.remove('is-miss'); void curEl.offsetWidth; curEl.classList.add('is-miss');
  }

  function commit() {
    const want = words[wi], ok = cur.length === want.length && match(cur, want) === want.length;
    st.typed += cur.length + 1;
    if (ok) { st.chars += want.length + 1; st.words++; }
    curEl.replaceWith(Object.assign(word(wi, ok ? 'is-ok' : 'is-ko'), { textContent: cur }));
    restEl.remove();
    while (done.childElementCount > BEHIND) done.firstElementChild!.remove();
    wi++; cur = '';
    if (wi < words.length) newWord();
  }

  function key(ch: string) {
    const want = words[wi];
    if (want === undefined) return;
    if (ch === ' ') {
      if (!cur) return; // no empty words
      st.keys++;
      const complete = cur.length === want.length && match(cur, want) === want.length;
      if (!complete && match(cur, want) === cur.length) st.errors++; // word left unfinished
      if (!complete && opts.strict) return miss();
      return commit();
    }
    st.keys++;
    const v = cur + ch;
    if (match(v, want) < v.length) {
      st.errors++;
      if (opts.strict) return miss();
    }
    setCur(v);
    if (wi === words.length - 1 && v.length === want.length && match(v, want) === want.length) commit(); // last word
  }

  function handle() {
    const v = input.value;
    if (live) {
      if (v.startsWith(cur)) for (const ch of v.slice(cur.length)) key(ch);
      else setCur(v.split(' ')[0]); // Backspace, Ctrl+Backspace: only inside the current word
      opts.onKey?.();
    }
    input.value = cur;
  }

  function paintGhost() {
    box.querySelectorAll('.is-ghost').forEach((el) => el.classList.remove('is-ghost'));
    if (ghost < 0) return;
    const el = ghost === wi ? restEl : box.querySelector(`.ty-word[data-i="${ghost}"]`);
    el?.classList.add('is-ghost');
  }

  input.addEventListener('input', (e) => { if (!(e as InputEvent).isComposing) handle(); });
  input.addEventListener('compositionend', handle);
  input.addEventListener('paste', (e) => e.preventDefault());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); opts.onEscape?.(); }
    else if (/^(Arrow|Home|End|Page)/.test(e.key)) e.preventDefault();
  });
  input.addEventListener('focus', () => { box.dataset.focus = ''; });
  input.addEventListener('blur', () => { delete box.dataset.focus; });
  // The input ignores the pointer (CSS), so a click can never move its caret: the box focuses it instead.
  box.addEventListener('mousedown', (e) => e.preventDefault());
  box.addEventListener('click', () => input.focus({ preventScroll: true }));

  return {
    load(text: string) {
      words = []; starts = []; wi = 0; cur = ''; ghost = -1;
      st = { chars: 0, words: 0, typed: 0, keys: 0, errors: 0 };
      done.replaceChildren(); next.replaceChildren(); input.value = '';
      this.append(text);
    },
    append(text: string) {
      const total = this.total;
      let at = total ? total + 1 : 0;
      for (const w of text.split(' ')) { starts.push(at); words.push(w); at += w.length + 1; }
      if (!curEl?.isConnected) newWord(); else fillNext();
    },
    setLive(on: boolean) { live = on; },
    // Opponent position, as a character offset in the text: outlines the word it is on.
    setGhost(pos: number) {
      let k = 0;
      while (k + 1 < starts.length && starts[k + 1] <= pos) k++;
      if (pos >= this.total) k = words.length;
      if (k !== ghost) { ghost = k; paintGhost(); }
    },
    focus() { input.focus({ preventScroll: true }); },
    get left() { return words.length - wi; }, // words still to type
    get pos() { return (starts[wi] ?? this.total) + match(cur, words[wi] ?? ''); }, // correct characters so far
    get total() { return words.length ? starts.at(-1)! + words.at(-1)!.length : 0; },
    stats: (): Stats => ({ ...st }),
  };
}
export type Typer = ReturnType<typeof createTyper>;

// Words per minute (one word = 5 characters), and keystroke accuracy.
export const wpm = (chars: number, ms: number) => (ms > 0 ? Math.round((chars / 5) / (ms / 60000)) : 0);
export const perMin = (n: number, ms: number) => (ms > 0 ? Math.round(n / (ms / 60000)) : 0);
export const accuracy = (s: Stats) => (s.keys ? Math.round(((s.keys - s.errors) / s.keys) * 100) : 100);
