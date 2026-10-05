export const languages = { en: 'English', fr: 'Français' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'en';

export const ui = {
  en: { 'nav.home': 'Profile', 'nav.projects': 'Projects', 'nav.hobbies': 'Hobbies' },
  fr: { 'nav.home': 'Profil', 'nav.projects': 'Projets', 'nav.hobbies': 'Loisirs' },
} as const;

export const t = (lang: Lang) => ui[lang];

// Builds an internal URL that respects the /cv base path.
export const href = (lang: Lang, path = '') => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${lang}/${path ? `${path.replace(/^\/|\/$/g, '')}/` : ''}`;
};

export const langPaths = () => Object.keys(languages).map((lang) => ({ params: { lang } }));
