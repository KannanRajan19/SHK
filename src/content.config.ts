import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const block = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), value: z.string() }),
  z.object({ type: z.literal('image'), value: z.string(), caption: z.string().optional() }),
]);

const posts = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    tag: z.string().optional(),
    minutes: z.number(),
    excerpt: z.string(),
    blocks: z.array(block),
  }),
});

const doodles = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/doodles' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    note: z.string(),
    image: z.string().default(''),
  }),
});

const pictures = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/pictures' }),
  schema: z.object({
    caption: z.string(),
    date: z.string().default(''),
    tag: z.string().default(''),
    aspect: z.enum(['1/1', '3/4', '4/3', '4/5']).default('1/1'),
    image: z.string().default(''),
  }),
});

// One file, many records. `finished: ''` means in progress.
// The index becomes the id, which is what preserves the original order:
// collection order follows insertion order and nothing re-sorts unless asked.
const books = defineCollection({
  loader: file('./content/books.json', {
    parser: (text) =>
      (JSON.parse(text) as Record<string, unknown>[]).map((b, i) => ({
        id: String(i),
        ...b,
      })),
  }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    finished: z.string(),
    rating: z.number().min(0).max(5),
    note: z.string(),
  }),
});

const settings = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/settings' }),
  schema: z.record(z.string()),
});

export const collections = { posts, doodles, pictures, books, settings };
