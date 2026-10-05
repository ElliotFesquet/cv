# Elliot Fesquet — personal site
Professional portfolio **and** playground: 3 core pages (CV, projects, hobbies); more pages will be added. **Adding anything new: read `claude_add.md` first.**

## Stack
Astro 7 (static output, Node 24), hand-written CSS, no framework, no client-side JS unless a page truly needs it.
GitHub Pages **project page**: https://elliotfesquet.github.io/cv/ (`base: '/cv'`). Pages source = GitHub Actions.
Bilingual: English (default) and French. Every route lives under `/en/` or `/fr/`; `/` redirects to `/en/`.

## File layout
- `astro.config.mjs` — site, base, trailingSlash: 'always'
- `src/styles/` — `tokens.css` (all tokens: light, dark, print scale) → `global.css` (site styles) → `print.css` (PDF layout); imported in that order by Base
- `src/i18n/ui.ts` — languages, UI strings, `href(lang, path)` link helper
- `src/layouts/Base.astro` (fonts, styles, nav, footer); `src/components/Nav.astro` (links + EN/FR), `Footer.astro` (contact CTA from `cv.yaml` → `cta`)
- `src/pages/index.astro` — redirect; `404.astro` — bilingual 404; `[lang]/index.astro` — CV; `[lang]/hobbies.astro` — empty
- `scripts/cv-pdf.mjs` — after build, prints the CV page (`print.css` + print tokens) to `dist/elliot-fesquet-cv-{en,fr}.pdf` via installed Chrome. Keep each PDF to 1 A4 page.
- `src/pages/[lang]/projects/index.astro` + `[slug].astro` — projects; collection schema in `src/content.config.ts`
- `src/data/cv.yaml` — single source of truth for CV (en/fr per field); `src/data/cv.ts` loads + types it
- `src/content/projects/{en,fr}/<slug>.md` — one markdown file per project per language
- `public/` — copied as-is under `/cv/` (dbt docs, static files); `.github/workflows/deploy.yml` — build + deploy

## Design tokens (tokens.css `:root`; dark under prefers-color-scheme, compact scale under print)
`--color-{bg,text,muted,border,accent,accent-ink,on-accent}` (accent-ink for small text), `--font-{sans,mono}` (Inter Tight + JetBrains Mono, self-hosted via @fontsource),
`--step-{-1..3}` fluid type scale, `--space-{1..6}`, `--gutter`, `--page-max`, `--measure`, `--label-col`, `--nav-h`, `--radius`, `--ease`.
Breakpoints: mobile-first; 40rem (tablet), 64rem (desktop: sticky section labels). Motion is CSS-only and off under reduced-motion. Never hard-code a colour, size or spacing outside `:root`.

## Conventions
- Never invent content about Elliot. Source: `cv_an_eng_ef.pdf` (Analytics Engineer CV). Missing fact → `TODO` + ask.
- No phone number or street address on the site.
- Internal links always via `href()` — never a hard-coded `/...` path (base path breaks).
- One file per page, no file over ~200 lines, targeted edits over rewrites. Every string in both `en` and `fr`.
- Static only: no backend, no secrets, no runtime data fetch.
- YAML: quote any value containing a comma inside `{ }` flow maps, or it is silently truncated.
- New styles go in global.css under their own `/* Section */` comment, tokens only; new tokens only in tokens.css. Each CSS file < ~200 lines.

## Add a top-level page
1. `src/pages/[lang]/<name>.astro` with `export const getStaticPaths = langPaths;` wrapped in `<Base>`.
2. Add `nav.<name>` to both `en` and `fr` in `ui.ts`, and the link to `links` in `Nav.astro`.
3. Playground pages needing JS: keep the `<script>` inside that page only, never in Base.

## Add a project page
1. Create `src/content/projects/en/<slug>.md` and `src/content/projects/fr/<slug>.md` (same slug).
2. Frontmatter: `title` (required), optional `summary`, `date`, `stack` (list). Schema: `src/content.config.ts`.
3. Body sections: Problem → Data sources → Data model → Decisions and tradeoffs → What I'd do differently.
4. dbt docs (optional): `dbt docs generate --static` in the dbt repo, review for exposed names/SQL, copy `target/static_index.html` to `public/projects/<slug>/docs/index.html` (served at `/cv/projects/<slug>/docs/`).
5. `npm run build` locally, then push.

## Commands
- `npm run dev` (http://localhost:4321/cv/; PDFs 404 here) · `npm run build` (site + PDFs) · `npm run build:site` (site only)
- Deploy: push to `master`; the workflow (ubuntu-24.04) builds and publishes. Check the run succeeded.
