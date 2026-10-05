import { load } from 'js-yaml';
import raw from './cv.yaml?raw';
import type { Lang } from '../i18n/ui';

type Text = Record<Lang, string>;
type Bullet = Text & { title: Text };

export interface CV {
  name: string;
  headline: Text;
  location: Text;
  email: string;
  linkedin: string;
  work_rights: Text;
  profile: Text;
  skills: { label: Text; items: Text }[];
  experience: {
    company: string; role: Text; start: string; end: string;
    location: Text; type: Text; bullets: Bullet[];
  }[];
  education: { school: string; degree: Text; start: number; end: number; detail?: Text }[];
  activities: (Text & { label: Text })[];
  cta: { title: Text; text: Text };
}

export const cv = load(raw) as CV;

// "2024-09" -> "Sep 2024" / "sept. 2024"
export const formatMonth = (ym: string, lang: Lang) => {
  const [y, m] = ym.split('-').map(Number);
  return new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1)));
};
