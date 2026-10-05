import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Files live at src/content/projects/{en,fr}/<slug>.md; entry id is "<lang>/<slug>".
const projects = defineCollection({
  loader: glob({ pattern: '{en,fr}/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    date: z.coerce.date().optional(),
    stack: z.array(z.string()).default([]),
  }),
});

export const collections = { projects };
