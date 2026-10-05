// Coaching offer (hobbies/coaching). Prices and accounts live here only; UI strings in scripts/coaching/i18n.ts.
import type { Lang } from '../i18n/ui';

export type ServiceId = 'review' | 'live' | 'rankup';
export interface Service { id: ServiceId; price: number | null; img: string } // null = on quote

export const services: Service[] = [
  { id: 'review', price: 10, img: 'review.webp' },
  { id: 'live', price: 30, img: 'live.webp' },
  { id: 'rankup', price: null, img: 'rankup.webp' },
];

const opgg = (riotId: string) => `https://op.gg/lol/summoners/euw/${encodeURIComponent(riotId.replace('#', '-'))}`;
export const accounts = [
  { riotId: 'no flame please#peak', url: opgg('no flame please#peak') },
  { riotId: 'linkedin farming#LNKDN', url: opgg('linkedin farming#LNKDN') },
];

// Fictional booking slots (Paris time), offered on any date from tomorrow to +60 days.
export const slots = ['14:00', '16:00', '18:00', '20:00', '22:00'];

export const ranks = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster'];

export const price = (lang: Lang, amount: number) =>
  new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
