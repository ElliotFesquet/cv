// Demo checkout for hobbies/coaching/order: 3 steps + confirmation. Nothing is sent; orders saved in localStorage.
// Card data is only checked (Luhn, expiry, CVC) and never stored.
import type { coachUi } from './i18n';

type S = (typeof coachUi)['en'];
interface Svc { id: string; price: number | null; name: string }
interface Order { ref: string; service: string; qty: number; total: number | null; date: string; riot: string; slot?: string }
const data = JSON.parse(document.getElementById('co-data')!.textContent!) as { lang: 'en' | 'fr'; s: S; services: Svc[] };
const { lang, s } = data;
const KEY = 'cv:coaching:orders';

const form = document.querySelector<HTMLFormElement>('[data-checkout]')!;
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = form) => root.querySelector<T>(sel)!;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = form) => [...root.querySelectorAll<T>(sel)];
const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
const money = (n: number) => new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

let step = 1;
const day = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString('sv'); }; // YYYY-MM-DD, local
const when = () => {
  const d = field('date').value, t = field('slot').value;
  return d && t ? `${new Date(`${d}T00:00`).toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' })} · ${t}` : '';
};
const service = () => data.services.find((x) => x.id === (form.elements.namedItem('service') as RadioNodeList).value)!;
const isQuote = () => service().price === null;
const qty = () => Math.min(10, Math.max(1, Math.round(Number(field('qty').value)) || 1));

// Summary + which blocks show for a paid order vs a quote request
function refresh() {
  const sv = service(), quote = isQuote();
  $$('[data-only]').forEach((el) => (el.hidden = el.dataset.only !== (quote ? 'quote' : 'paid')));
  field('target').required = quote;
  $$('[data-tab-label]').forEach((el, i) => { if (i === 2 || el.tagName === 'LEGEND') el.textContent = quote ? s['tab.3.q'] : s['tab.3']; });
  $('[data-submit]').textContent = quote ? s.send : `${s.pay} ${money(sv.price! * qty())}`;
  $('[data-sum-name]').textContent = sv.name;
  $('[data-sum-line]').textContent = quote ? s['per.div'] : `${qty()} × ${money(sv.price!)}`;
  $('[data-sum-when]').textContent = when() && `${s.when} : ${when()}`;
  $('[data-sum-total]').textContent = quote ? s.quote : money(sv.price! * qty());
}

function go(n: number) {
  step = n;
  $$('[data-step]').forEach((el) => (el.hidden = Number(el.dataset.step) !== n));
  $$('[data-tab]').forEach((el) => {
    const t = Number(el.dataset.tab);
    el.toggleAttribute('data-done', t < n);
    if (t === n) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
  });
  form.querySelector('.co-summary')!.toggleAttribute('hidden', n === 4);
  const target = $(`[data-step="${n}"]`);
  (target.querySelector<HTMLElement>('input:not([type=radio]), select') ?? target).focus({ preventScroll: true });
  form.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

// Validation
const luhn = (num: string) => {
  let sum = 0;
  [...num].reverse().forEach((c, i) => { let d = Number(c); if (i % 2) { d *= 2; if (d > 9) d -= 9; } sum += d; });
  return num.length >= 13 && sum % 10 === 0;
};
const checks: Record<string, (v: string) => keyof S | null> = {
  riot: (v) => (/^[^#]{3,16}#[\p{L}\p{N}]{2,5}$/u.test(v.trim()) ? null : 'err.riot'),
  target: (v) => (Number(v) > Number(field('rank').value) ? null : 'err.target'),
  card: (v) => (luhn(v.replace(/\D/g, '')) ? null : 'err.card'),
  exp: (v) => {
    const m = /^(\d{2})\/(\d{2})$/.exec(v); if (!m) return 'err.exp';
    const month = Number(m[1]), end = new Date(2000 + Number(m[2]), month, 1);
    return month >= 1 && month <= 12 && end > new Date() ? null : 'err.exp';
  },
  date: (v) => (v >= day(1) && v <= day(60) ? null : 'err.date'),
  cvc: (v) => (/^\d{3,4}$/.test(v) ? null : 'err.cvc'),
};
function validate(el: HTMLInputElement): boolean {
  let err: keyof S | null = null;
  if (el.required && !el.value.trim()) err = 'err.required';
  else if (el.type === 'email' && el.validity.typeMismatch) err = 'err.email';
  else if (el.value && el.dataset.check) err = checks[el.dataset.check](el.value);
  el.toggleAttribute('aria-invalid', !!err);
  const out = el.parentElement!.querySelector('[data-err]');
  if (out) out.textContent = err ? s[err] : '';
  return !err;
}
function validStep(n: number) {
  const els = $$<HTMLInputElement>(`[data-step="${n}"] :is(input, select)[name]`).filter((el) => !el.closest('[hidden]') && el.type !== 'radio');
  const bad = els.filter((el) => !validate(el));
  bad[0]?.focus();
  return bad.length === 0;
}

// History (localStorage, best effort)
const load = (): Order[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } };
const save = (o: Order[]) => { try { localStorage.setItem(KEY, JSON.stringify(o.slice(0, 20))); } catch { /* storage off */ } };
function renderHistory() {
  const list = load(), box = $<HTMLDetailsElement>('[data-history]');
  box.hidden = list.length < 2;
  $('ul', box).replaceChildren(...list.slice(1).map((o) => {
    const li = document.createElement('li');
    li.textContent = `${o.ref} · ${o.service} · ${o.total === null ? s.quote : money(o.total)} · ${o.slot ?? new Date(o.date).toLocaleDateString(lang)}`;
    return li;
  }));
}

function finish() {
  const sv = service(), quote = isQuote();
  const ref = `KM-${Date.now().toString(36).slice(-5).toUpperCase()}`;
  save([{ ref, service: sv.name, qty: quote ? 1 : qty(), total: quote ? null : sv.price! * qty(), date: new Date().toISOString(), riot: field('riot').value.trim(), slot: when() }, ...load()]);
  $('[data-done-when]').textContent = when();
  $('[data-ref]').textContent = ref;
  $('[data-done-msg]').textContent = quote ? s['done.quote'] : s['done.paid'];
  ['cname', 'cnum', 'cexp', 'ccvc'].forEach((n) => (field(n).value = '')); // never keep card fields
  renderHistory();
  go(4);
}

// Events
form.addEventListener('change', refresh);
form.addEventListener('input', (e) => {
  const el = e.target as HTMLInputElement;
  if (el.name === 'cnum') el.value = el.value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
  if (el.name === 'cexp') el.value = el.value.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(?=\d)/, '$1/');
  if (el.name === 'ccvc') el.value = el.value.replace(/\D/g, '');
  if (el.hasAttribute('aria-invalid')) validate(el);
  if (el.name === 'qty') refresh();
});
form.addEventListener('focusout', (e) => { const el = e.target as HTMLInputElement; if (el.name && el.value) validate(el); });
$$('[data-next]').forEach((b) => b.addEventListener('click', () => { if (validStep(step)) go(step + 1); }));
$$('[data-prev]').forEach((b) => b.addEventListener('click', () => go(step - 1)));
$('[data-fill]').addEventListener('click', () => {
  const yy = String((new Date().getFullYear() + 2) % 100).padStart(2, '0');
  Object.entries({ cname: field('riot').value.split('#')[0] || 'Demo', cnum: '4242 4242 4242 4242', cexp: `12/${yy}`, ccvc: '123' })
    .forEach(([n, v]) => { field(n).value = v; validate(field(n)); });
});
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (step !== 3 || !validStep(3)) return;
  const btn = $<HTMLButtonElement>('[data-submit]');
  btn.disabled = true; btn.textContent = s.paying;
  setTimeout(() => { btn.disabled = false; refresh(); finish(); }, 1200);
});
$('[data-again]').addEventListener('click', () => { form.reset(); refresh(); go(1); });
$('[data-clear]').addEventListener('click', () => { save(load().slice(0, 1)); renderHistory(); });

field('date').min = day(1); field('date').max = day(60);

// Preselect from ?service=
const pre = new URLSearchParams(location.search).get('service');
const radio = $$<HTMLInputElement>('input[name=service]').find((r) => r.value === pre);
if (radio) radio.checked = true;
refresh();
$$('[data-tab]')[0].setAttribute('aria-current', 'step');
