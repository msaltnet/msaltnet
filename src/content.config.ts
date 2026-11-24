import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const dateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z))?$/);

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    date,
    category: z.string().min(1),
    series: z.string().optional(),
    series_order: z.number().int().positive().optional(),
    image: z.string().startsWith('/assets/').optional(),
    last_modified_at: dateTime.optional(),
    sidebar_feature: z.boolean().default(false),
    draft: z.boolean().default(false),
  }).strict(),
});

const series = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/series' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    cover_image: z.string().optional(),
    cover_alt: z.string().min(1).optional(),
  }).strict(),
});

export const collections = { posts, series };
