# Elliot Fesquet — personal site

## Stack
Astro (static output), hand-written CSS, no framework, no client-side JS unless a page truly needs it.
Hosted on GitHub Pages as a **project page**: https://elliotfesquet.github.io/cv/ (`base: '/cv'`).
Bilingual: English (default) and French. Every route lives under `/en/` or `/fr/`; `/` redirects to `/en/`.

## File layout
- `astro.config.mjs` — site, base, trailingSlash: 'always'
- `src/styles/global.css` — the only stylesheet; design tokens at the top
- `src/i18n/ui.ts` — languages, UI strings, `href(lang, path)` link helper
- `src/layouts/Base.astro`, `src/components/Nav.astro`
- `src/pages/index.astro` — redirect to default language
- `src/pages/[lang]/index.astro` — CV / profile
- `src/pages/[lang]/projects/` — projects index (+ `[slug].astro`)
- `src/pages/[lang]/hobbies.astro` — placeholder, keep empty
- `src/data/cv.yaml` — single source of truth for CV content (en/fr per field)
- `src/content/projects/{en,fr}/<slug>.md` — one markdown file per project per language

## Design tokens (global.css `:root`, dark values under prefers-color-scheme)
`--color-{bg,surface,text,muted,accent,border}`, `--font-{sans,mono}`,
`--step-{-1..3}` type scale, `--space-{1..6}`, `--measure`, `--radius`.
Never hard-code a colour, size or spacing outside `:root`.

## Conventions
- Never invent content about Elliot. Source: `cv_an_eng_ef.pdf` (Analytics Engineer CV). Missing fact → `TODO` + ask.
- No phone number or street address on the site.
- Internal links always via `href()` — never a hard-coded `/...` path (base path breaks).
- One file per page, no file over ~200 lines, targeted edits over rewrites.
- Every user-facing string exists in both `en` and `fr`.
- Static only: no backend, no secrets, no runtime data fetch.

## Add a project page
1. Create `src/content/projects/en/<slug>.md` and `src/content/projects/fr/<slug>.md` (same slug).
2. Frontmatter: `title` (required), optional `summary`, `date`, `stack` (list). Schema: `src/content.config.ts`.
3. Body sections: Problem → Data sources → Data model → Decisions and tradeoffs → What I'd do differently.
4. dbt docs (optional): `dbt docs generate --static` in the dbt repo, review for exposed names/SQL, copy `target/static_index.html` to `public/projects/<slug>/docs/index.html` (served at `/cv/projects/<slug>/docs/`).
5. `npm run build` locally, then push.

## Commands
- `npm run dev` — local server at http://localhost:4321/cv/
- `npm run build` — static build into `dist/`
- Deploy: push to `master`; `.github/workflows/deploy.yml` builds and publishes to Pages.
