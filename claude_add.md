# claude_add.md — integrating new features

Playbook for adding things to this site (projects, playground tools such as a SQL game, a Streamlit app,
another site) with the fewest tokens. `CLAUDE.md` holds the rules; this file holds the *how*.

## 0. How to work cheaply
- **Read only:** `CLAUDE.md` (auto-loaded), this file, and the files listed in the chosen recipe. Don't explore the repo.
  The file layout in `CLAUDE.md` is accurate. Trust it.
- **Pick one recipe (section 2) per step**, state it in one line, build it, then validate with Elliot before the next step.
- **Ask once:** put all missing facts (content, naming, wording) in a single question. Never invent content about Elliot.
- **Batch:** independent reads/edits in one message; targeted edits, never rewrites of existing files.
- **Verify proportionally:**
  - code only → `npm run build:site` (no Chrome, ~2 s)
  - CV / `cv.yaml` / print styles touched → `npm run build`, then check both PDFs are still 1 page
  - layout changed → one desktop (1440px) + one mobile (390px) screenshot, nothing more
- **Deploy check:** push, then one `Monitor` until-loop on the Actions run, then `curl` the live URL for 200. No polling.

## 1. Choose the integration type
Prefer the first row that works. Rows A–D share the nav, styles and both languages for free.

| Need | Type | Lives in | URL |
| --- | --- | --- | --- |
| Write-up of a data project | **A** Markdown project | `src/content/projects/{en,fr}/` | `/cv/{lang}/projects/<slug>/` |
| dbt docs / static report for a project | **B** Static artifact | `public/projects/<slug>/docs/` | `/cv/projects/<slug>/docs/` |
| Static page (uses, notes, hobbies) | **C** Astro page | `src/pages/[lang]/<name>.astro` | `/cv/{lang}/<name>/` |
| In-browser interactive tool (SQL game, viz) | **D** Astro page + scoped script | C + `src/scripts/<name>/` | `/cv/{lang}/lab/<name>/` |
| App with its own build/framework | **E** Separate repo | `ElliotFesquet/<name>` | `elliotfesquet.github.io/<name>/` |
| Python app (Streamlit) | **F** External host, linked/embedded | Streamlit Community Cloud (or stlite) | external, linked from a C page |

**Playground items go under one "Lab" / "Labo" page** (`/[lang]/lab/`, a content collection like `projects`)
instead of new nav links. The mobile nav fits about 4 short labels. Create the Lab page the first time a playground item is added.

## 2. Recipes (touch only these files)

**A. Project page.** Follow "Add a project page" in `CLAUDE.md`. Files: 2 markdown files. Nothing else.

**B. dbt docs.** `dbt docs generate --static` in the dbt repo, then review it for exposed DB/schema names and compiled SQL.
Copy `target/static_index.html` to `public/projects/<slug>/docs/index.html`, and link it from the project markdown with the
full path `/cv/projects/<slug>/docs/`. This ships dbt's own JS (accepted exception, limited to that subroute).

**C. Static page.**
1. `src/pages/[lang]/<name>.astro`: `export const getStaticPaths = langPaths;`, wrap in `<Base lang title>`.
2. `src/i18n/ui.ts`: add `nav.<name>` (or `lab.<name>`) to both `en` and `fr`.
3. `src/components/Nav.astro`: add to `links` (only for top-level pages; Lab items don't go in the nav).
4. Styles: reuse existing classes first; otherwise add a `/* <Name> */` section to `global.css`.

**D. Interactive tool (e.g. the SQL game).** C, plus:
- Logic lives in `src/scripts/<name>/*.ts`, imported from a `<script>` tag in that page only. Astro bundles it and loads it
  on that page alone. Never in `Base.astro`.
- Heavy dependencies (WASM engines) are loaded with a dynamic `import()` inside the script, so they only download on use.
  Put static data files (e.g. `.sqlite`, `.parquet`) in `public/lab/<name>/` and build their URL with `import.meta.env.BASE_URL`.
- The page must still make sense without JS: a static intro, rules, and a `<noscript>` line.
- Fetching the page's own static data files is an exception to "no runtime data fetch". Get Elliot's OK the first time,
  then record it in `CLAUDE.md`. Never call third-party APIs. Never use secrets.
- State (scores, progress): `localStorage` only, wrapped in try/catch. The origin `elliotfesquet.github.io` is shared
  with every repo of this user, so prefix keys with `cv:<name>:`.
- More than ~10 UI strings: use a page-local `{ en, fr }` dictionary in `src/scripts/<name>/i18n.ts` instead of growing `ui.ts`.
- More than ~40 lines of CSS: `src/styles/<name>.css`, imported only in that page's frontmatter, tokens only.

**E. Separate repo** (when D outgrows this site or needs another framework).
New repo `ElliotFesquet/<name>`: Pages source "GitHub Actions" and base `/<name>/`. It's then served at
`elliotfesquet.github.io/<name>/` with no DNS work. To match the look, copy `src/styles/tokens.css` and note the source
commit in a comment. Link it from the Lab page or a project page here. Same origin as this site → see the localStorage note in D.

**F. Streamlit.** GitHub Pages cannot run Python. Options, in order:
1. **Streamlit Community Cloud** (free, sleeps when idle, so expect a cold start). Link it from a C/Lab page; optionally
   embed it with `<iframe src="https://<app>.streamlit.app/?embed=true">`, with a static fallback text. App secrets go in
   its dashboard, never in a repo.
2. **stlite** (Streamlit compiled to WASM): fully static, so it can live in `public/lab/<name>/`. But it downloads tens of MB
   and starts slowly. Use it only for small demos.

## 3. SQL game — recommended shape (type D)
- Engine: **sql.js** (SQLite in WASM, about 1 MB, simplest), or **DuckDB-WASM** (larger, analytics SQL with window functions
  and `QUALIFY`). For an analytics engineer, DuckDB is the stronger showcase. Decide with Elliot.
- Challenges as a content collection `src/content/sql/{en,fr}/<id>.md`. Frontmatter: `title`, `difficulty`, `tables`,
  `solution` (SQL). The body is the prompt.
- Grading in the browser: run both the user's query and the `solution`, and compare the sorted result sets.
  No server needed.
- Dataset: one small file in `public/lab/sql/`, or built in the browser from a `CREATE ... INSERT` script.
- Route: `/[lang]/lab/sql/` (index) and `/[lang]/lab/sql/[id]/` (one challenge per page).

## 4. Definition of done (every integration)
- [ ] `/en/` and `/fr/` versions exist; every string exists in both languages
- [ ] internal links via `href()` / `asset()`; no hard-coded `/cv/...` except inside markdown
- [ ] the right build passes (section 0); PDFs are still 1 page if the CV was touched
- [ ] screenshots, only if layout changed
- [ ] each file < ~200 lines; new folders or conventions added to `CLAUDE.md` as one line each (keep it < 50 lines)
- [ ] commit (with attribution lines), push, deploy run green, live URL returns 200

## 5. Snippets (this machine: Windows, Git Bash)
```sh
export PATH="/c/Program Files/nodejs:$PATH"     # node is not on Git Bash's PATH by default
npm run build:site                              # fast check
npm run build                                   # site + CV PDFs
# PDF page count
node -e "const fs=require('fs');for(const l of ['en','fr'])console.log(l,fs.readFileSync('dist/elliot-fesquet-cv-'+l+'.pdf','latin1').match(/\/Count (\d+)/)[1])"
# Deploy: wait for the run of HEAD (use with Monitor)
SHA=$(git rev-parse HEAD); until curl -s "https://api.github.com/repos/ElliotFesquet/cv/actions/runs?head_sha=$SHA" | grep -q '"status": "completed"'; do sleep 15; done
```
Screenshots: headless Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe` with
`--headless=new --screenshot=<file> --window-size=1440,900 --virtual-time-budget=5000 <url>`. Headless Chrome won't go
below about 500px wide, so for mobile load the page in a 390px-wide `<iframe>` inside a scratch HTML file.
Run `npx astro preview` in the background first, and stop it afterwards. Port 4321 can stay held by a stale node process.
