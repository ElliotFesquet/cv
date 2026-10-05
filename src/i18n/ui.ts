export const languages = { en: 'English', fr: 'Français' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'en';

export const ui = {
  en: {
    'nav.home': 'Profile', 'nav.projects': 'Projects', 'nav.hobbies': 'Hobbies',
    'cv.profile': 'Profile', 'cv.skills': 'Skills', 'cv.experience': 'Experience',
    'cv.education': 'Education', 'cv.activities': 'Activities & distinctions',
    'cv.workRights': 'Right to work', 'cv.download': 'Download CV (PDF)',
    'cta.label': 'Contact', 'cta.email': 'Email me',
    '404.title': 'Page not found', '404.back': 'Back to the homepage',
  },
  fr: {
    'nav.home': 'Profil', 'nav.projects': 'Projets', 'nav.hobbies': 'Loisirs',
    'cv.profile': 'Profil', 'cv.skills': 'Compétences', 'cv.experience': 'Expérience',
    'cv.education': 'Formation', 'cv.activities': 'Activités & distinctions',
    'cv.workRights': 'Droit de travail', 'cv.download': 'Télécharger le CV (PDF)',
    'cta.label': 'Contact', 'cta.email': "M'écrire",
    '404.title': 'Page introuvable', '404.back': "Retour à l'accueil",
  },
} as const;

export const t = (lang: Lang) => ui[lang];

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

// Builds an internal URL that respects the /cv base path.
export const href = (lang: Lang, path = '') =>
  `${base}/${lang}/${path ? `${path.replace(/^\/|\/$/g, '')}/` : ''}`;

// URL of a language-neutral file at the site root (e.g. the CV PDFs).
export const asset = (file: string) => `${base}/${file}`;
export const cvPdf = (lang: Lang) => asset(`elliot-fesquet-cv-${lang}.pdf`);

export const langPaths = () => Object.keys(languages).map((lang) => ({ params: { lang } }));
