export const languages = { en: 'English', fr: 'Français' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'en';

export const ui = {
  en: {
    'nav.home': 'Profile', 'nav.projects': 'Projects', 'nav.apps': 'Apps', 'nav.hobbies': 'Hobbies',
    'apps.lede': 'Interactive tools that run entirely in your browser.',
    'hobbies.lede': 'What I do when I am not modelling data.',
    'cv.profile': 'Profile', 'cv.skills': 'Skills', 'cv.experience': 'Experience',
    'cv.education': 'Education', 'cv.activities': 'Activities & distinctions',
    'cv.workRights': 'Right to work', 'cv.download': 'Download CV (PDF)',
    'cta.label': 'Contact', 'cta.email': 'Email me',
    'footer.nav': 'Site', 'showcase.open': 'Open',
    'footer.credit': 'Background after Michelangelo, The Creation of Adam (c. 1511, Sistine Chapel).',
    'cv.lede': 'Analytics engineer in Paris and London. I turn business data into tested SQL models and reliable metrics.',
    'projects.lede': 'Data engineering projects: how each pipeline is built, and what the analysis shows.',
    'project.date': 'Year', 'project.team': 'Team', 'project.role': 'My role', 'project.code': 'Code',
    'project.architecture': 'Architecture', 'project.dashboard': 'Dashboard & results',
    'project.dashboardSoon': 'Screenshots of the dashboard are coming soon.', 'project.openDashboard': 'Open the dashboard',
    'project.steps': 'Project steps', 'project.step.problem': 'Problem', 'project.step.approach': 'Approach',
    'project.step.architecture': 'Architecture', 'project.step.results': 'Results',
    'project.hintScroll': 'Scroll', 'project.hintSwipe': 'Swipe',
    'project.archNoscript': 'The architecture diagram needs JavaScript.',
    'project.app.title': 'Live dashboard', 'project.app.launch': 'Launch the live dashboard', 'project.app.open': 'Open in a new tab',
    'project.app.note': 'The project’s Streamlit app, running in your browser (Python compiled to WebAssembly). First launch downloads about 50 MB and takes 20 s or so; the models are retrained live.',
    '404.title': 'Page not found', '404.back': 'Back to the homepage',
  },
  fr: {
    'nav.home': 'Profil', 'nav.projects': 'Projets', 'nav.apps': 'Apps', 'nav.hobbies': 'Loisirs',
    'apps.lede': 'Des outils interactifs qui tournent entièrement dans votre navigateur.',
    'hobbies.lede': 'Ce que je fais quand je ne modélise pas de données.',
    'cv.profile': 'Profil', 'cv.skills': 'Compétences', 'cv.experience': 'Expérience',
    'cv.education': 'Formation', 'cv.activities': 'Activités & distinctions',
    'cv.workRights': 'Droit de travail', 'cv.download': 'Télécharger le CV (PDF)',
    'cta.label': 'Contact', 'cta.email': "M'écrire",
    'footer.nav': 'Site', 'showcase.open': 'Ouvrir',
    'footer.credit': "Fond d'après Michel-Ange, La Création d'Adam (vers 1511, chapelle Sixtine).",
    'cv.lede': 'Analytics engineer entre Paris et Londres. Je transforme les données métier en modèles SQL testés et en indicateurs fiables.',
    'projects.lede': "Projets de data engineering : comment chaque pipeline est construit, et ce que montre l'analyse.",
    'project.date': 'Année', 'project.team': 'Équipe', 'project.role': 'Mon rôle', 'project.code': 'Code',
    'project.architecture': 'Architecture', 'project.dashboard': 'Dashboard & résultats',
    'project.dashboardSoon': 'Les captures du dashboard arrivent bientôt.', 'project.openDashboard': 'Ouvrir le dashboard',
    'project.steps': 'Étapes du projet', 'project.step.problem': 'Problème', 'project.step.approach': 'Approche',
    'project.step.architecture': 'Architecture', 'project.step.results': 'Résultats',
    'project.hintScroll': 'Défiler', 'project.hintSwipe': 'Glisser',
    'project.archNoscript': "Le schéma d'architecture nécessite JavaScript.",
    'project.app.title': 'Dashboard interactif', 'project.app.launch': 'Lancer le dashboard', 'project.app.open': 'Ouvrir dans un nouvel onglet',
    'project.app.note': 'L’application Streamlit du projet, exécutée dans votre navigateur (Python compilé en WebAssembly). Le premier lancement télécharge environ 50 Mo et prend une vingtaine de secondes ; les modèles sont réentraînés en direct.',
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
