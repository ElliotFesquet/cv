import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Results shown under "Dashboard": bar charts drawn from frontmatter, screenshots in public/projects/<slug>/.
const chart = z.object({
  title: z.string(),
  unit: z.string().default(''),
  max: z.number().optional(),
  bars: z.array(z.object({ label: z.string(), value: z.number() })),
});
const shot = z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() });

// Files live at src/content/projects/{en,fr}/<slug>.md; entry id is "<lang>/<slug>".
const projects = defineCollection({
  loader: glob({ pattern: '{en,fr}/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    date: z.coerce.date().optional(),
    stack: z.array(z.string()).default([]),
    repo: z.string().url().optional(),
    team: z.array(z.string()).default([]),
    role: z.string().optional(),
    // Mermaid flowchart source; `logos:<name>` icons come from @iconify-json/logos.
    architecture: z.string().optional(),
    dashboard: z.object({
      url: z.string().url().optional(),
      // Live app under public/ (e.g. an stlite Streamlit build), loaded in an iframe on click.
      app: z.string().optional(),
      note: z.string().optional(),
      charts: z.array(chart).default([]),
      shots: z.array(shot).default([]),
    }).optional(),
  }),
});

export const collections = { projects };
