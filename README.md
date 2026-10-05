# elliotfesquet.github.io/cv

Personal site of Elliot Fesquet, Analytics Engineer: professional portfolio and playground.

**Live:** https://elliotfesquet.github.io/cv/ (English) · https://elliotfesquet.github.io/cv/fr/ (French)

## Pages

| Route | Content |
| --- | --- |
| `/en/`, `/fr/` | CV, rendered from `src/data/cv.yaml` |
| `/en/projects/` | Project write-ups, one markdown file per project |
| `/en/hobbies/` | Placeholder |

## Stack

- [Astro](https://astro.build) with static output, deployed to GitHub Pages by GitHub Actions
- Hand-written CSS: `tokens.css` (design tokens, light/dark/print), `global.css` (site), `print.css` (PDF layout)
- Self-hosted fonts: Inter Tight and JetBrains Mono
- No client-side JavaScript; animations are CSS-only and respect reduced-motion

## Run locally

Requires Node 24+ and Google Chrome (used to print the CV PDFs).

```sh
npm install
npm run dev         # http://localhost:4321/cv/
npm run build       # static site + CV PDFs (dist/elliot-fesquet-cv-{en,fr}.pdf)
npm run build:site  # static site only, no Chrome needed
npm run preview     # serve dist/
```

The PDFs are the CV page printed with its `@media print` styles, so they always match `cv.yaml`.

## Editing content

- **CV:** edit `src/data/cv.yaml`. Every text field has an `en` and an `fr` value.
- **Projects:** add `src/content/projects/en/<slug>.md` and `src/content/projects/fr/<slug>.md`.
  Sections: problem, data sources, data model, decisions and tradeoffs, what I'd do differently.
- **UI labels:** `src/i18n/ui.ts`.

## Deploy

Push to `master`. `.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages.

Conventions for contributors (and Claude Code sessions) are in [`CLAUDE.md`](CLAUDE.md).
