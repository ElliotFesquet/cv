// SQL Arena effects: letter-by-letter reveal, scramble on hover, arrow-key menus.
// CSS does the motion (sql-arena.css); everything is skipped under reduced motion.
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%*<>=_/';

// Wraps every character in a span (words stay unbreakable) so CSS can stagger them. Keeps inline markup like <code>.
function split(el: HTMLElement) {
  if (el.dataset.split !== undefined) return;
  el.dataset.split = '';
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    const frag = document.createDocumentFragment();
    for (const part of node.data.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { frag.append(part); continue; }
      const word = document.createElement('span');
      word.className = 'fx-w';
      for (const ch of part) {
        const c = document.createElement('span');
        c.className = 'fx-c';
        c.textContent = ch;
        word.append(c);
      }
      frag.append(word);
    }
    node.replaceWith(frag);
  }
}

// (Re)plays the reveal, one character after the other. Long texts type faster so nothing takes more than ~1.2 s.
export function play(el: HTMLElement, delay = 0) {
  if (still) return;
  split(el);
  const chars = el.querySelectorAll<HTMLElement>('.fx-c');
  const step = Math.min(32, 1200 / Math.max(chars.length, 1));
  chars.forEach((c, i) => { c.style.animationDelay = `${Math.round(delay + i * step)}ms`; });
  el.classList.remove('fx-play');
  void el.offsetWidth; // restart the CSS animation
  el.classList.add('fx-play');
}

// Random glyphs that settle left to right into the real label.
function scramble(el: HTMLElement) {
  if (still) return;
  const text = (el.dataset.text ??= el.textContent ?? '');
  cancelAnimationFrame(Number(el.dataset.raf ?? 0));
  let frame = 0;
  const tick = () => {
    const done = Math.floor(frame++ / 2);
    el.textContent = [...text].map((ch, i) => (i < done || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join('');
    if (done < text.length) el.dataset.raf = String(requestAnimationFrame(tick));
  };
  tick();
}

// ↑ / ↓ move through a menu; ↓ from nowhere enters the first visible menu.
function menuKeys() {
  const menus = [...document.querySelectorAll<HTMLElement>('[data-menu]')];
  document.addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!d || e.altKey || e.ctrlKey || e.metaKey) return;
    const menu = menus.find((m) => m.offsetParent !== null);
    if (!menu) return;
    const items = [...menu.querySelectorAll<HTMLAnchorElement>('a')];
    const i = items.indexOf(document.activeElement as HTMLAnchorElement);
    if (i < 0 && document.activeElement !== document.body) return;
    e.preventDefault();
    items[i < 0 ? 0 : (i + d + items.length) % items.length].focus();
  });
}

// [data-type]: typed on load. Inside [data-fx-current]: typed each time that block becomes .is-current.
const owner = (el: Element) => el.closest<HTMLElement>('[data-fx-current]');
const typeIn = (block: HTMLElement) =>
  block.querySelectorAll<HTMLElement>('[data-type]').forEach((t, i) => play(t, i * 200));

document.querySelectorAll<HTMLElement>('[data-type]').forEach((el) => {
  const block = owner(el);
  if (!block) play(el, Number(el.dataset.typeDelay ?? 0));
});
document.querySelectorAll<HTMLElement>('[data-fx-current].is-current').forEach(typeIn);
const watcher = new MutationObserver((records) => records.forEach((r) => {
  const el = r.target as HTMLElement;
  if (el.classList.contains('is-current') && !(r.oldValue ?? '').includes('is-current')) typeIn(el);
}));
document.querySelectorAll('[data-fx-current]').forEach((el) =>
  watcher.observe(el, { attributes: true, attributeFilter: ['class'], attributeOldValue: true }));

document.querySelectorAll<HTMLElement>('[data-scramble]').forEach((el) => {
  const target = el.closest('a') ?? el;
  target.addEventListener('mouseenter', () => scramble(el));
  target.addEventListener('focus', () => scramble(el));
});
menuKeys();
