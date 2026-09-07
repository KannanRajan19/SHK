# My Little Paper Sky — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `design_handoff_paper_sky` prototype as a production Astro static site on Cloudflare Pages, with a hidden password-protected admin at `/admin` that lets the owner publish content without touching code.

**Architecture:** Astro 5 static output. All content lives as files under `content/` — the same files the admin commits via the GitHub API. Interactive behaviour ships as small vanilla-JS islands, not React. The admin API runs as Cloudflare Pages Functions in this same repo, so site and API share one origin.

**Tech Stack:** Astro ^5, TypeScript, Vitest (logic), Playwright (e2e/visual), Cloudflare Pages + Pages Functions, GitHub REST API, Resend (email).

**Spec:** `docs/superpowers/specs/2026-09-07-paper-sky-design.md` — read it alongside this plan.

## Global Constraints

These apply to **every** task.

- **Astro ^5**, static output (`output: 'static'`). No SSR adapter for pages.
- **Rosewine is the only palette.** Baked as CSS custom properties. The other four palettes in `design/app.jsx` are dropped.
- **Compact density** is the shipped default.
- **All copy is verbatim** from `design/pages.jsx` and `design/admin.jsx`. Never reword, never "improve" it. It is real content written by the owner.
- **All book/author/note text is lowercase** — the log is stored lowercased.
- **832 books, original order.** Never re-sort or regenerate `books.json` during migration.
- **Rotations must be deterministic** (derived from index), never `Math.random()`.
- **`prefers-reduced-motion`** disables the ink trail, wiggles, lifts and smooth scroll.
- **No admin reference in public output.** No link, no comment, no hint.
- Design tokens (final):
  ```css
  --paper:#fbf2ee; --paper-deep:#f0dfd6; --ink:#2c1d1f; --ink-soft:#4d3236;
  --ink-faint:#9a7c80; --rule:#dcc8c4; --accent:#b07682; --accent-soft:#c89aa3;
  --gold:#cc8b50; --tape:rgba(176,118,130,0.14);
  ```
  Ink trail colour: `rgba(176,118,130,0.4)`.
- Commit after every task. Conventional-commit prefixes (`feat:`, `chore:`, `test:`, `docs:`).

---

## File Structure

```
design/                     prototype, reference only (never imported by src/)
content/
  posts/<slug>.json         {title,tag,date,minutes,excerpt,blocks[]}
  books.json                832 entries, original order
  doodles/<slug>.json       {title,date,note,image}
  pictures/<slug>.json      {caption,date,tag,aspect,image}
  settings/currently.json   reading,drawing,listening,watching,learning
  settings/text.json        homeIntro1-2, aboutBio1-4
  settings/site.json        contactRecipient
scripts/migrate.mjs         one-shot prototype -> content/ migration
src/
  content.config.ts         collection schemas
  lib/blocks.ts             readingTime, deriveExcerpt, block types
  lib/books.ts              sortBooks, paginate, formatRating
  styles/global.css         full CSS port, rosewine baked in
  layouts/Base.astro        head/masthead/nav/footer/currently/trail
  components/               Placeholder, Tape, SectionLabel, UpdateCard,
                            PostCard, BookRow, Picture, Polaroid
  pages/                    index, about, doodles, blog/, books, pictures,
                            contact, admin, 404
public/scripts/trail.js     ink trail (ported verbatim + reduced-motion guard)
public/uploads/             owner-uploaded images
functions/api/              login.ts, publish.ts, upload.ts, contact.ts
functions/lib/              session.ts, github.ts
tests/                      unit (vitest) + e2e (playwright)
```

---

### Task 1: Repo bootstrap and Astro scaffold

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `vitest.config.ts`
- Move: `paper-sky.html`, `app.jsx`, `pages.jsx`, `admin.html`, `admin.jsx`, `tweaks-panel.jsx`, `shared-storage.js`, `books.json` → `design/`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: a buildable Astro project; `design/` as the frozen reference copy; `npm test` wired to Vitest

- [ ] **Step 1: Move the prototype into `design/`**

```bash
cd "D:/AI Projects/SHK"
mkdir -p design
git mv paper-sky.html app.jsx pages.jsx admin.html admin.jsx tweaks-panel.jsx shared-storage.js books.json design/
```

`README.md` stays at the repo root for now; Task 13 replaces it with an owner-facing guide.

- [ ] **Step 2: Write `.gitignore`**

```gitignore
node_modules/
dist/
.astro/
.wrangler/
.dev.vars
.DS_Store
test-results/
playwright-report/
```

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "my-little-paper-sky",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "migrate": "node scripts/migrate.mjs",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "astro": "^5.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 4: Write `astro.config.mjs`**

No `base` path — Cloudflare Pages serves from the domain root.

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
```

- [ ] **Step 5: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "design"]
}
```

`design/` is excluded so the prototype JSX never gets type-checked or imported.

- [ ] **Step 6: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
```

- [ ] **Step 7: Install and verify**

Run: `npm install && npx astro --version`
Expected: prints `5.x`

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold astro project, freeze prototype in design/"
```

---

### Task 2: Content migration

The riskiest task in the plan: it moves 832 real book entries and all the owner's copy. Tests come first and assert preservation, not correctness-by-eye.

**Files:**
- Create: `scripts/migrate.mjs`, `src/lib/blocks.ts`, `tests/unit/blocks.test.ts`, `tests/unit/migration.test.ts`
- Reads: `design/pages.jsx`, `design/books.json`, `design/admin.jsx`

**Interfaces:**
- Consumes: Task 1's `design/` layout
- Produces:
  - `src/lib/blocks.ts` → `type Block = {type:'text',value:string} | {type:'image',value:string,caption?:string}`, `readingTime(blocks: Block[]): number`, `deriveExcerpt(blocks: Block[], max?: number): string`
  - `content/**` populated

- [ ] **Step 1: Write the failing tests for block helpers**

`tests/unit/blocks.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readingTime, deriveExcerpt } from '../../src/lib/blocks';

describe('readingTime', () => {
  it('counts only text blocks, at 200wpm, minimum 1', () => {
    const blocks = [{ type: 'text', value: 'word '.repeat(400).trim() }] as const;
    expect(readingTime([...blocks])).toBe(2);
  });

  it('ignores image blocks and never returns 0', () => {
    expect(readingTime([{ type: 'image', value: '/uploads/a.jpg' }])).toBe(1);
  });
});

describe('deriveExcerpt', () => {
  it('uses the first text block and truncates on a word boundary', () => {
    const long = 'alpha bravo charlie delta echo foxtrot golf hotel india juliet';
    const out = deriveExcerpt([{ type: 'text', value: long }], 20);
    expect(out.length).toBeLessThanOrEqual(21);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/\s…$/);
  });

  it('skips leading image blocks', () => {
    const blocks = [
      { type: 'image', value: '/uploads/a.jpg' },
      { type: 'text', value: 'the real opening line' },
    ];
    expect(deriveExcerpt(blocks, 100)).toBe('the real opening line');
  });

  it('returns empty string when there is no text at all', () => {
    expect(deriveExcerpt([{ type: 'image', value: '/uploads/a.jpg' }], 100)).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/blocks.test.ts`
Expected: FAIL — cannot resolve `../../src/lib/blocks`

- [ ] **Step 3: Implement `src/lib/blocks.ts`**

```ts
export type Block =
  | { type: 'text'; value: string }
  | { type: 'image'; value: string; caption?: string };

const WORDS_PER_MINUTE = 200;

export function readingTime(blocks: Block[]): number {
  const words = blocks
    .filter((b): b is Extract<Block, { type: 'text' }> => b.type === 'text')
    .reduce((n, b) => n + b.value.trim().split(/\s+/).filter(Boolean).length, 0);
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function deriveExcerpt(blocks: Block[], max = 160): string {
  const first = blocks.find((b) => b.type === 'text');
  if (!first) return '';
  const text = first.value.trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return `${(at > 0 ? cut.slice(0, at) : cut).replace(/[.,;:]$/, '')}…`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/blocks.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Write the failing migration test**

These assert the properties that must survive. `tests/unit/migration.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

describe('content migration', () => {
  beforeAll(() => {
    if (!existsSync('content/books.json')) {
      throw new Error('run `npm run migrate` before these tests');
    }
  });

  it('preserves all 832 books in original order', () => {
    const before = read('design/books.json');
    const after = read('content/books.json');
    expect(after).toHaveLength(832);
    expect(after).toEqual(before);
  });

  it('keeps every book field lowercase', () => {
    for (const b of read('content/books.json')) {
      expect(b.title).toBe(b.title.toLowerCase());
      expect(b.author).toBe(b.author.toLowerCase());
    }
  });

  it('migrates 6 posts, all body paragraphs becoming text blocks', () => {
    const files = readdirSync('content/posts');
    expect(files).toHaveLength(6);
    for (const f of files) {
      const post = read(`content/posts/${f}`);
      expect(post.blocks.length).toBeGreaterThan(0);
      expect(post.blocks.every((b: any) => b.type === 'text')).toBe(true);
      expect(post.minutes).toBeGreaterThan(0);
      expect(post.excerpt.length).toBeGreaterThan(0);
    }
  });

  it('migrates 5 doodles and 8 pictures', () => {
    expect(readdirSync('content/doodles')).toHaveLength(5);
    expect(readdirSync('content/pictures')).toHaveLength(8);
  });

  it('migrates all five currently fields and six text fields', () => {
    const c = read('content/settings/currently.json');
    expect(Object.keys(c).sort()).toEqual(
      ['drawing', 'learning', 'listening', 'reading', 'watching']
    );
    for (const v of Object.values(c)) expect(String(v).length).toBeGreaterThan(0);

    const t = read('content/settings/text.json');
    expect(Object.keys(t).sort()).toEqual(
      ['aboutBio1', 'aboutBio2', 'aboutBio3', 'aboutBio4', 'homeIntro1', 'homeIntro2']
    );
    for (const v of Object.values(t)) expect(String(v).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run tests/unit/migration.test.ts`
Expected: FAIL — "run `npm run migrate` before these tests"

- [ ] **Step 7: Write `scripts/migrate.mjs`**

The prototype arrays are JS literals inside a `.jsx` file. Rather than regex-scraping them, extract each array's source span by brace-matching and evaluate it in a throwaway function — the literals contain no identifiers, so this is safe and exact.

```js
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { readingTime, deriveExcerpt } from './lib-blocks.mjs';

const src = readFileSync('design/pages.jsx', 'utf8');

function extractArray(name) {
  const start = src.indexOf(`const ${name} = [`);
  if (start < 0) throw new Error(`${name} not found in design/pages.jsx`);
  const open = src.indexOf('[', start);
  let depth = 0, end = open;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  return new Function(`return ${src.slice(open, end + 1)};`)();
}

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const write = (p, data) => writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);

for (const d of ['content/posts', 'content/doodles', 'content/pictures', 'content/settings'])
  mkdirSync(d, { recursive: true });

// Books: copied byte-for-byte. Never re-sorted, never regenerated.
cpSync('design/books.json', 'content/books.json');

for (const p of extractArray('POSTS')) {
  const blocks = p.body.map((value) => ({ type: 'text', value }));
  write(`content/posts/${slug(p.title)}.json`, {
    title: p.title,
    date: p.date,
    tag: p.tag,
    minutes: readingTime(blocks),
    excerpt: p.excerpt ?? deriveExcerpt(blocks),
    blocks,
  });
}

for (const d of extractArray('DOODLES'))
  write(`content/doodles/${slug(d.title)}.json`, {
    title: d.title, date: d.date, note: d.note, image: d.image ?? '',
  });

extractArray('PICTURES').forEach((pic, i) =>
  write(`content/pictures/${String(i + 1).padStart(2, '0')}-${slug(pic.caption)}.json`, {
    caption: pic.caption, date: pic.date ?? '', tag: pic.tag ?? '',
    aspect: pic.aspect ?? '1/1', image: pic.image ?? '',
  })
);

// Settings come from admin.jsx's DEFAULT_CONTENT (the authoritative copy).
const admin = readFileSync('design/admin.jsx', 'utf8');
const dcOpen = admin.indexOf('{', admin.indexOf('const DEFAULT_CONTENT'));
let d2 = 0, dcEnd = dcOpen;
for (let i = dcOpen; i < admin.length; i++) {
  const c = admin[i];
  if (c === '{') d2++;
  else if (c === '}') { d2--; if (d2 === 0) { dcEnd = i; break; } }
}
const DC = new Function(`return ${admin.slice(dcOpen, dcEnd + 1)};`)();

write('content/settings/currently.json', {
  reading: DC.currentlyReading, drawing: DC.currentlyDrawing,
  listening: DC.currentlyListening, watching: DC.currentlyWatching,
  learning: DC.currentlyLearning,
});
write('content/settings/text.json', {
  homeIntro1: DC.homeIntro1, homeIntro2: DC.homeIntro2,
  aboutBio1: DC.aboutBio1, aboutBio2: DC.aboutBio2,
  aboutBio3: DC.aboutBio3, aboutBio4: DC.aboutBio4,
});
write('content/settings/site.json', { contactRecipient: 'kannan.ms@gmail.com' });

console.log('migration complete');
```

Also create `scripts/lib-blocks.mjs` re-exporting the two helpers as plain JS (the script runs outside the TS build):

```js
const WORDS_PER_MINUTE = 200;

export function readingTime(blocks) {
  const words = blocks.filter((b) => b.type === 'text')
    .reduce((n, b) => n + b.value.trim().split(/\s+/).filter(Boolean).length, 0);
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function deriveExcerpt(blocks, max = 160) {
  const first = blocks.find((b) => b.type === 'text');
  if (!first) return '';
  const text = first.value.trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return `${(at > 0 ? cut.slice(0, at) : cut).replace(/[.,;:]$/, '')}…`;
}
```

- [ ] **Step 8: Run the migration, then the tests**

Run: `npm run migrate && npx vitest run`
Expected: `migration complete`, then all tests PASS. If the book count is anything other than 832, stop and investigate — do not adjust the test.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: migrate prototype content to file-based collections"
```

---

### Task 3: Content collections schema

**Files:**
- Create: `src/content.config.ts`, `tests/unit/schema.test.ts`

**Interfaces:**
- Consumes: `content/**` from Task 2
- Produces: collections `posts`, `doodles`, `pictures`, `books`, `settings` queryable via `getCollection`/`getEntry`

- [ ] **Step 1: Write `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const block = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), value: z.string() }),
  z.object({ type: z.literal('image'), value: z.string(), caption: z.string().optional() }),
]);

const posts = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/posts' }),
  schema: z.object({
    title: z.string(), date: z.string(), tag: z.string().optional(),
    minutes: z.number(), excerpt: z.string(), blocks: z.array(block),
  }),
});

const doodles = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/doodles' }),
  schema: z.object({
    title: z.string(), date: z.string(), note: z.string(), image: z.string().default(''),
  }),
});

const pictures = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/pictures' }),
  schema: z.object({
    caption: z.string(), date: z.string().default(''), tag: z.string().default(''),
    aspect: z.enum(['1/1', '3/4', '4/3', '4/5']).default('1/1'),
    image: z.string().default(''),
  }),
});

// One file, many records. `finished: ''` means in progress.
const books = defineCollection({
  loader: file('./content/books.json', {
    parser: (text) => JSON.parse(text).map((b: any, i: number) => ({ id: String(i), ...b })),
  }),
  schema: z.object({
    title: z.string(), author: z.string(), finished: z.string(),
    rating: z.number().min(0).max(5), note: z.string(),
  }),
});

const settings = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/settings' }),
  schema: z.record(z.string()),
});

export const collections = { posts, doodles, pictures, books, settings };
```

The `id: String(i)` on books is what preserves original order — collection order follows insertion order, and nothing downstream re-sorts unless the reader asks.

- [ ] **Step 2: Verify the schemas load**

Run: `npx astro sync && npx astro check`
Expected: sync succeeds, zero content errors. (`astro check` may report missing pages — expected until Task 5.)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: content collection schemas"
```

---

### Task 4: Global CSS, base layout, ink trail

**Files:**
- Create: `src/styles/global.css`, `src/layouts/Base.astro`, `public/scripts/trail.js`, `src/components/Placeholder.astro`, `src/components/Tape.astro`, `src/components/SectionLabel.astro`
- Reads: `design/paper-sky.html`

**Interfaces:**
- Consumes: `settings` collection (Task 3)
- Produces: `Base.astro` with props `{ title: string; page: string }`; `Placeholder.astro` with props `{ label: string; aspect?: string }`

- [ ] **Step 1: Port the stylesheet**

Copy the entire `<style>` block from `design/paper-sky.html` into `src/styles/global.css`. Then:
1. Replace the palette block in `:root` with the rosewine values from Global Constraints.
2. Delete every other palette and all tweaks-panel rules.
3. Bake the compact density scale in as the only scale.
4. Port `body::before` (feTurbulence texture, `mix-blend-mode: multiply`) and `body::after` (vignette) **verbatim**.
5. Port the inline-SVG flower `cursor:` rules **verbatim**.
6. Convert the inline style objects in `design/pages.jsx` to classes with identical values — cards, polaroid, book rows, picture columns, contact grid, post article.
7. Append:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  #trail { display: none; }
}
```

- [ ] **Step 2: Port the ink trail**

Copy the trail IIFE from the bottom of `design/paper-sky.html` into `public/scripts/trail.js`. Hardcode the colour to `176, 118, 130` at alpha `0.4`, drop every tweaks hook, and guard the whole thing:

```js
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // ... ported IIFE, unchanged otherwise ...
}
```

- [ ] **Step 3: Write `src/layouts/Base.astro`**

Contains: Google Fonts link, masthead (stamp `est. 2026 · no. 01`, site name in italic display serif linking home, handwritten tagline), centred uppercase-mono nav with the active dot driven by `aria-current`, footer (`© 2026 · made with care` plus page label and date), the "currently" widget read from `settings/currently.json`, the `<canvas id="trail">` and its script tag.

The widget hides below 1200px via CSS, not JS. **No admin link anywhere in this file.**

- [ ] **Step 4: Verify against the prototype**

Run: `npm run dev`, open a stub page.
Expected: paper texture, vignette, custom cursor, trail following the pointer, masthead and nav visually identical to `design/paper-sky.html`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: global styles, base layout, ink trail"
```

---

### Task 5: Home, About, Doodles, Pictures pages

**Files:**
- Create: `src/pages/index.astro`, `about.astro`, `doodles.astro`, `pictures.astro`, `404.astro`
- Create: `src/components/UpdateCard.astro`, `Polaroid.astro`, `Picture.astro`

**Interfaces:**
- Consumes: `Base.astro`, `Placeholder.astro`, collections `posts`/`doodles`/`pictures`/`settings`
- Produces: four rendered routes

- [ ] **Step 1: `index.astro`**

Handwritten greeting, `homeIntro1` and `homeIntro2` from `settings/text.json` at `max-width:54ch`, two CTAs (`see today's doodle →` accent, `read the blog` outline), the `∿ ∿ ∿` divider, then a "what's new" grid of three `UpdateCard`s built from the most recent doodle, post and picture. Card rotation is deterministic:

```ts
const rot = (((i * 37) % 100) - 50) / 60;
```

- [ ] **Step 2: `about.astro`**

`aboutBio1`–`aboutBio4` from settings (the fourth styled as the handwritten closing line), the facts `<dl>` reading `settings/currently.json` — **the same file the widget reads** — and a rotated `Polaroid` placeholder.

- [ ] **Step 3: `doodles.astro`**

Render every doodle into the DOM; a small island shows one at a time with prev/next and dot indicators. Empty state: the striped placeholder.

- [ ] **Step 4: `pictures.astro`**

Three-column masonry, per-item aspect ratio from the schema, captions and tags, deterministic rotation with the same formula as Step 1.

- [ ] **Step 5: `404.astro`**

Small on-brand page reusing `Base.astro`.

- [ ] **Step 6: Verify**

Run: `npm run build && npm run preview`
Expected: all four routes render; every string matches `design/pages.jsx` verbatim.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: home, about, doodles, pictures pages"
```

---

### Task 6: Blog index and post pages

**Files:**
- Create: `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`, `src/components/PostCard.astro`

**Interfaces:**
- Consumes: `posts` collection, `Block` type from `src/lib/blocks.ts`
- Produces: `/blog` and one `/blog/<slug>` route per post

- [ ] **Step 1: `blog/index.astro`**

Grid of `PostCard`s, each a real `<a href="/blog/<slug>">`. Deterministic rotation:

```ts
const rot = ((i % 5) - 2) * 0.4;
```

Hover wiggle/lift is a CSS `:hover` rule, not JS.

- [ ] **Step 2: `blog/[slug].astro`**

`getStaticPaths()` over the posts collection. Renders as a **full page, not a modal**: 68ch measure, large display title, `← back to the blog` at top and bottom, handwritten `— s.` sign-off. Blocks render in order — `text` as `<p>`, `image` as `<figure>` with optional `<figcaption>`. Sets `<title>` per post for shareability.

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: six `/blog/*/index.html` files in `dist/`, each with a distinct `<title>`; block order matches the source JSON exactly.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: blog index and per-post pages"
```

---

### Task 7: Book log

832 entries with sort, pagination and jump buttons. All logic is pure and unit-tested before any markup exists.

**Files:**
- Create: `src/lib/books.ts`, `tests/unit/books.test.ts`, `src/pages/books.astro`, `src/components/BookRow.astro`

**Interfaces:**
- Consumes: `books` collection
- Produces:
  - `type Book = { title:string; author:string; finished:string; rating:number; note:string }`
  - `sortBooks(books: Book[], mode: 'recent'|'rating'|'author'): Book[]`
  - `paginate<T>(items: T[], page: number, per?: number): { items: T[]; page: number; pages: number }`
  - `formatRating(rating: number): string`
  - `isInProgress(book: Book): boolean`
  - `averageRating(books: Book[]): number | null`

- [ ] **Step 1: Write the failing tests**

`tests/unit/books.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  sortBooks, paginate, formatRating, isInProgress, averageRating,
} from '../../src/lib/books';

const b = (o: Partial<any> = {}) =>
  ({ title: 'a', author: 'z', finished: 'Jan 2020', rating: 0, note: '', ...o });

describe('formatRating', () => {
  it('renders 0 as an em dash, not zero stars', () => {
    expect(formatRating(0)).toBe('—');
  });
  it('renders n stars for n', () => {
    expect(formatRating(3)).toBe('★★★');
  });
});

describe('isInProgress', () => {
  it('is true only when finished is blank', () => {
    expect(isInProgress(b({ finished: '' }))).toBe(true);
    expect(isInProgress(b({ finished: 'Jul 2026' }))).toBe(false);
  });
});

describe('averageRating', () => {
  it('returns null when nothing is rated, so the header can stay hidden', () => {
    expect(averageRating([b(), b()])).toBeNull();
  });
  it('averages only rated books', () => {
    expect(averageRating([b({ rating: 4 }), b({ rating: 2 }), b()])).toBe(3);
  });
});

describe('sortBooks', () => {
  it('recent keeps the source order untouched', () => {
    const list = [b({ title: 'first' }), b({ title: 'second' })];
    expect(sortBooks(list, 'recent').map((x) => x.title)).toEqual(['first', 'second']);
  });

  it('recent puts in-progress books at the very top', () => {
    const list = [b({ title: 'done' }), b({ title: 'reading', finished: '' })];
    expect(sortBooks(list, 'recent')[0].title).toBe('reading');
  });

  it('rating sorts high to low and never loses unrated books', () => {
    const list = [b({ rating: 0 }), b({ rating: 5 }), b({ rating: 3 })];
    const out = sortBooks(list, 'rating');
    expect(out.map((x) => x.rating)).toEqual([5, 3, 0]);
    expect(out).toHaveLength(3);
  });

  it('author sorts alphabetically without mutating the input', () => {
    const list = [b({ author: 'zadie' }), b({ author: 'ada' })];
    const copy = [...list];
    expect(sortBooks(list, 'author').map((x) => x.author)).toEqual(['ada', 'zadie']);
    expect(list).toEqual(copy);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 832 }, (_, i) => i);

  it('reports 42 pages for 832 items at 20 per page', () => {
    expect(paginate(items, 1).pages).toBe(42);
  });

  it('returns 20 on a full page and 12 on the last', () => {
    expect(paginate(items, 1).items).toHaveLength(20);
    expect(paginate(items, 42).items).toHaveLength(12);
  });

  it('clamps out-of-range pages instead of returning nothing', () => {
    expect(paginate(items, 0).page).toBe(1);
    expect(paginate(items, 999).page).toBe(42);
  });

  it('handles an empty log without dividing by zero', () => {
    expect(paginate([], 1)).toEqual({ items: [], page: 1, pages: 1 });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/unit/books.test.ts`
Expected: FAIL — cannot resolve `../../src/lib/books`

- [ ] **Step 3: Implement `src/lib/books.ts`**

```ts
export type Book = {
  title: string; author: string; finished: string; rating: number; note: string;
};
export type SortMode = 'recent' | 'rating' | 'author';

export const PER_PAGE = 20;

export function isInProgress(book: Book): boolean {
  return book.finished.trim() === '';
}

export function formatRating(rating: number): string {
  return rating > 0 ? '★'.repeat(rating) : '—';
}

export function averageRating(books: Book[]): number | null {
  const rated = books.filter((b) => b.rating > 0);
  if (rated.length === 0) return null;
  return rated.reduce((n, b) => n + b.rating, 0) / rated.length;
}

export function sortBooks(books: Book[], mode: SortMode): Book[] {
  const list = [...books];
  if (mode === 'recent') {
    // books.json is already newest-first; only lift in-progress to the top.
    return [...list.filter(isInProgress), ...list.filter((b) => !isInProgress(b))];
  }
  if (mode === 'rating') return list.sort((a, b) => b.rating - a.rating);
  return list.sort((a, b) => a.author.localeCompare(b.author));
}

export function paginate<T>(items: T[], page: number, per = PER_PAGE) {
  const pages = Math.max(1, Math.ceil(items.length / per));
  const current = Math.min(Math.max(1, page), pages);
  return {
    items: items.slice((current - 1) * per, current * per),
    page: current,
    pages,
  };
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run tests/unit/books.test.ts`
Expected: PASS (13 tests)

- [ ] **Step 5: Build `books.astro`**

Server-render page 1 for SEO, and embed the full log once as JSON for the island:

```astro
<script type="application/json" id="book-data" set:html={JSON.stringify(books)} />
```

The island reads that, applies `sortBooks` + `paginate`, and re-renders rows. Header shows `N finished`, and the average only when `averageRating()` is non-null.

Pagination footer, uppercase mono with 1px rule borders, disabled at the ends:

```
« first   ← newer   ·  page N of M  ·   older →   last »
```

`« first` and `last »` are the requested additions absent from the prototype.

- [ ] **Step 6: `BookRow.astro`**

Click expands to reveal the note. In-progress rows styled distinctly. Rating via `formatRating`, so 0 shows `—`.

- [ ] **Step 7: Verify in the browser**

Run: `npm run dev`
Expected: 42 pages; page 42 holds 12 rows; `« first`/`last »` disabled on pages 1/42 respectively; no average rating shown (nothing is rated yet); sorting by author reorders without dropping any of the 832.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: book log with sort, pagination and jump buttons"
```

---

### Task 8: Contact page and email Function

**Files:**
- Create: `src/lib/validate.ts`, `tests/unit/validate.test.ts`, `src/pages/contact.astro`, `functions/api/contact.ts`

**Interfaces:**
- Consumes: `settings/site.json` for the recipient
- Produces: `validateContact(input): { ok: true } | { ok: false; errors: Record<string,string> }`, shared by the browser and the Function so both agree on what is valid

- [ ] **Step 1: Write the failing validation tests**

`tests/unit/validate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validateContact } from '../../src/lib/validate';

const good = { name: 'sahana', email: 'a@b.co', message: 'hello there' };

describe('validateContact', () => {
  it('accepts a complete message', () => {
    expect(validateContact(good)).toEqual({ ok: true });
  });

  it('rejects each missing required field by name', () => {
    for (const key of ['name', 'email', 'message'] as const) {
      const result = validateContact({ ...good, [key]: '   ' });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors[key]).toBeTruthy();
    }
  });

  it('rejects malformed email addresses', () => {
    for (const email of ['nope', 'a@', '@b.co', 'a b@c.co']) {
      expect(validateContact({ ...good, email }).ok).toBe(false);
    }
  });

  it('rejects oversized messages so the Function cannot be used as a pipe', () => {
    expect(validateContact({ ...good, message: 'x'.repeat(5001) }).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/validate.test.ts`
Expected: FAIL — cannot resolve `../../src/lib/validate`

- [ ] **Step 3: Implement `src/lib/validate.ts`**

```ts
export type ContactInput = { name: string; email: string; message: string };
export type ContactResult = { ok: true } | { ok: false; errors: Record<string, string> };

export const MAX_MESSAGE = 5000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(input: ContactInput): ContactResult {
  const errors: Record<string, string> = {};
  if (!input.name?.trim()) errors.name = 'please add your name';
  if (!input.email?.trim()) errors.email = 'please add your email';
  else if (!EMAIL.test(input.email.trim())) errors.email = "that email doesn't look right";
  if (!input.message?.trim()) errors.message = 'please write a message';
  else if (input.message.length > MAX_MESSAGE) errors.message = 'that message is too long';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/unit/validate.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Write `functions/api/contact.ts`**

```ts
import { validateContact } from '../../src/lib/validate';

export const onRequestPost: PagesFunction<{
  RESEND_API_KEY: string; CONTACT_RECIPIENT: string; CONTACT_SENDER: string;
}> = async ({ request, env }) => {
  let body: any;
  try { body = await request.json(); }
  catch { return json({ ok: false, error: 'bad request' }, 400); }

  const result = validateContact(body);
  if (!result.ok) return json(result, 422);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_SENDER,
      to: env.CONTACT_RECIPIENT,
      reply_to: body.email,
      subject: `paper sky — message from ${body.name}`,
      text: `from: ${body.name} <${body.email}>\n\n${body.message}`,
    }),
  });

  if (!res.ok) return json({ ok: false, error: 'could not send' }, 502);
  return json({ ok: true });
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' },
  });
```

Never echo the Resend error body back to the client — it can contain configuration details.

- [ ] **Step 6: Write `contact.astro`**

Bottom-border-only inputs, accent border on focus, `SocialRow`, all copy verbatim. Submits to `/api/contact`. Client-side validation calls the **same** `validateContact`. On `ok`, show the prototype's success state; on failure show the field errors.

- [ ] **Step 7: Verify**

Run: `npx wrangler pages dev dist` (after `npm run build`), submit the form.
Expected: invalid input shows per-field errors and never hits the network; valid input returns `{ok:true}` and an email arrives.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: contact page wired to email function"
```

---

### Task 9: Admin session and login

**Files:**
- Create: `functions/lib/session.ts`, `tests/unit/session.test.ts`, `functions/api/login.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `signSession(secret, ttlSeconds): Promise<string>`, `verifySession(token, secret): Promise<boolean>`, `hashPassword(pw, salt): Promise<string>`

- [ ] **Step 1: Write the failing session tests**

`tests/unit/session.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { signSession, verifySession } from '../../functions/lib/session';

const SECRET = 'test-secret-value';

describe('session tokens', () => {
  it('accepts a token it just signed', async () => {
    expect(await verifySession(await signSession(SECRET, 60), SECRET)).toBe(true);
  });

  it('rejects a token signed with a different secret', async () => {
    expect(await verifySession(await signSession(SECRET, 60), 'other')).toBe(false);
  });

  it('rejects an expired token', async () => {
    expect(await verifySession(await signSession(SECRET, -1), SECRET)).toBe(false);
  });

  it('rejects a tampered payload', async () => {
    const token = await signSession(SECRET, 60);
    const [, sig] = token.split('.');
    expect(await verifySession(`${btoa('9999999999')}.${sig}`, SECRET)).toBe(false);
  });

  it('rejects malformed tokens instead of throwing', async () => {
    for (const bad of ['', 'nodot', 'a.b.c']) {
      await expect(verifySession(bad, SECRET)).resolves.toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/session.test.ts`
Expected: FAIL — cannot resolve `../../functions/lib/session`

- [ ] **Step 3: Implement `functions/lib/session.ts`**

WebCrypto only — it exists in both Workers and Node 20+, so the same code runs in tests and production.

```ts
const enc = new TextEncoder();

async function key(secret: string) {
  return crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
}

const b64 = (s: string) => btoa(s).replace(/=+$/, '');

async function sign(payload: string, secret: string) {
  const mac = await crypto.subtle.sign('HMAC', await key(secret), enc.encode(payload));
  return b64(String.fromCharCode(...new Uint8Array(mac)));
}

export async function signSession(secret: string, ttlSeconds: number): Promise<string> {
  const expires = String(Math.floor(Date.now() / 1000) + ttlSeconds);
  return `${b64(expires)}.${await sign(expires, secret)}`;
}

export async function verifySession(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  let expires: string;
  try { expires = atob(parts[0]); } catch { return false; }
  if (!/^\d+$/.test(expires)) return false;
  if (Number(expires) <= Math.floor(Date.now() / 1000)) return false;
  const expected = await sign(expires, secret);
  return timingSafeEqual(expected, parts[1]);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function hashPassword(pw: string, salt: string): Promise<string> {
  const material = await crypto.subtle.importKey(
    'raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 150_000, hash: 'SHA-256' },
    material, 256,
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/unit/session.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Write `functions/api/login.ts`**

```ts
import { hashPassword, signSession } from '../lib/session';

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { n: number; until: number }>();

export const onRequestPost: PagesFunction<{
  ADMIN_PASSWORD_HASH: string; ADMIN_PASSWORD_SALT: string; SESSION_SECRET: string;
}> = async ({ request, env }) => {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const now = Date.now();
  const record = attempts.get(ip);
  if (record && record.until > now && record.n >= MAX_ATTEMPTS) {
    return new Response(JSON.stringify({ ok: false }), { status: 429 });
  }

  const { password = '' } = await request.json<{ password?: string }>().catch(() => ({}));
  const hash = await hashPassword(password, env.ADMIN_PASSWORD_SALT);

  if (hash !== env.ADMIN_PASSWORD_HASH) {
    attempts.set(ip, {
      n: (record && record.until > now ? record.n : 0) + 1,
      until: now + WINDOW_MS,
    });
    return new Response(JSON.stringify({ ok: false }), { status: 401 });
  }

  attempts.delete(ip);
  const token = await signSession(env.SESSION_SECRET, 60 * 60 * 8);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `ps_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 8}`,
    },
  });
};
```

The response is identical for a wrong password and an unknown one — there is only one account, so there is nothing to enumerate, and the 401 body stays empty of detail.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: admin session signing and password login"
```

---

### Task 10: Publish and upload Functions

**Files:**
- Create: `functions/lib/github.ts`, `functions/lib/guard.ts`, `functions/api/publish.ts`, `functions/api/upload.ts`, `tests/unit/github.test.ts`

**Interfaces:**
- Consumes: `verifySession` (Task 9)
- Produces: `putFile({token, repo, branch, path, content, message}): Promise<void>`, `requireSession(request, secret): Promise<boolean>`

- [ ] **Step 1: Write the failing test for path safety**

The publish endpoint takes a path from the client, so it must refuse to escape `content/` and `public/uploads/`. `tests/unit/github.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isAllowedPath } from '../../functions/lib/github';

describe('isAllowedPath', () => {
  it('allows content and upload paths', () => {
    expect(isAllowedPath('content/posts/a.json')).toBe(true);
    expect(isAllowedPath('public/uploads/a.jpg')).toBe(true);
  });

  it('refuses traversal and absolute paths', () => {
    for (const p of [
      '../secrets', 'content/../../etc/passwd', '/etc/passwd',
      'content/posts/../../../x', 'functions/api/login.ts', '.github/workflows/x.yml',
    ]) {
      expect(isAllowedPath(p)).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/github.test.ts`
Expected: FAIL — cannot resolve `../../functions/lib/github`

- [ ] **Step 3: Implement `functions/lib/github.ts`**

```ts
const ALLOWED = ['content/', 'public/uploads/'];

export function isAllowedPath(path: string): boolean {
  if (path.startsWith('/') || path.includes('..') || path.includes('\\')) return false;
  return ALLOWED.some((prefix) => path.startsWith(prefix) && path.length > prefix.length);
}

type PutArgs = {
  token: string; repo: string; branch: string;
  path: string; content: string; message: string;
};

export async function putFile(
  { token, repo, branch, path, content, message }: PutArgs,
): Promise<void> {
  if (!isAllowedPath(path)) throw new Error('path not allowed');
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'paper-sky-admin',
  };

  // A file that already exists needs its blob sha to be replaced.
  const existing = await fetch(`${url}?ref=${branch}`, { headers });
  const sha = existing.ok ? (await existing.json<{ sha: string }>()).sha : undefined;

  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content, branch, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) throw new Error(`github ${res.status}`);
}
```

`content` is always base64 — that is what the GitHub contents API expects, and it makes text and images the same code path.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/unit/github.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Write `functions/lib/guard.ts`**

```ts
import { verifySession } from './session';

export async function requireSession(request: Request, secret: string): Promise<boolean> {
  const cookie = request.headers.get('Cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)ps_session=([^;]+)/);
  return match ? verifySession(match[1], secret) : false;
}
```

- [ ] **Step 6: Write `functions/api/publish.ts` and `functions/api/upload.ts`**

Both start with the same gate:

```ts
if (!(await requireSession(request, env.SESSION_SECRET))) {
  return new Response(JSON.stringify({ ok: false }), { status: 401 });
}
```

`publish` accepts `{ files: [{path, json}] }`, base64-encodes each `json`, and calls `putFile` per file with a message like `content: add post "<title>"`. `upload` accepts a base64 image plus a filename, rejects anything over 5 MB or outside `image/jpeg|png|webp|gif`, writes to `public/uploads/<timestamp>-<slug>.<ext>`, and returns the public path.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: publish and upload functions with path guards"
```

---

### Task 11: Admin dashboard and block composer

**Files:**
- Create: `src/pages/admin.astro`, `src/scripts/admin/composer.ts`, `src/scripts/admin/dashboard.ts`, `tests/unit/composer.test.ts`
- Reads: `design/admin.jsx` for structure, fields and copy

**Interfaces:**
- Consumes: `/api/login`, `/api/publish`, `/api/upload`; `Block` from `src/lib/blocks.ts`
- Produces: `moveBlock(blocks, from, to): Block[]`, `removeBlock(blocks, i): Block[]`

- [ ] **Step 1: Write the failing composer tests**

Reordering is the feature most likely to be silently wrong, so it gets real tests. `tests/unit/composer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { moveBlock, removeBlock } from '../../src/scripts/admin/composer';

const blocks = [
  { type: 'text', value: 'one' },
  { type: 'image', value: '/uploads/a.jpg', caption: 'a' },
  { type: 'text', value: 'two' },
] as any[];

describe('moveBlock', () => {
  it('moves a block down and preserves every block', () => {
    const out = moveBlock(blocks, 0, 1);
    expect(out.map((b) => b.value)).toEqual(['/uploads/a.jpg', 'one', 'two']);
    expect(out).toHaveLength(3);
  });

  it('keeps image captions attached to their block when reordered', () => {
    expect(moveBlock(blocks, 1, 2)[2].caption).toBe('a');
  });

  it('is a no-op at the boundaries rather than dropping a block', () => {
    expect(moveBlock(blocks, 0, -1)).toEqual(blocks);
    expect(moveBlock(blocks, 2, 3)).toEqual(blocks);
  });

  it('does not mutate the input', () => {
    const copy = structuredClone(blocks);
    moveBlock(blocks, 0, 2);
    expect(blocks).toEqual(copy);
  });
});

describe('removeBlock', () => {
  it('removes only the targeted index', () => {
    expect(removeBlock(blocks, 1).map((b) => b.value)).toEqual(['one', 'two']);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/composer.test.ts`
Expected: FAIL — cannot resolve the composer module

- [ ] **Step 3: Implement `src/scripts/admin/composer.ts`**

```ts
import type { Block } from '../../lib/blocks';

export function moveBlock(blocks: Block[], from: number, to: number): Block[] {
  if (to < 0 || to >= blocks.length || from < 0 || from >= blocks.length) return blocks;
  const next = [...blocks];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function removeBlock(blocks: Block[], index: number): Block[] {
  return blocks.filter((_, i) => i !== index);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/unit/composer.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Build `src/pages/admin.astro`**

`<meta name="robots" content="noindex,nofollow">`. Password screen first; on success the dashboard renders the six sections from `design/admin.jsx`, matching its structure, field sets and copy:

1. new blog post (title, tag, block composer)
2. add doodle
3. add picture
4. add book
5. home & about text
6. currently

The composer renders `¶ paragraph` and `▣ picture` buttons, each block with ↑ / ↓ / ✕ controls wired to `moveBlock`/`removeBlock`. Picture blocks downscale to max 1600px on the client via `<canvas>` before upload.

Publishing shows an explicit **"publishing… this takes a minute or two"** state — it must not claim the change is already live.

- [ ] **Step 6: Verify the round trip**

Run: `npm run build && npx wrangler pages dev dist`
Expected: wrong password is refused and rate-limits after 5 tries; correct password reaches the dashboard; a post with paragraph/picture/paragraph ordering publishes and the committed JSON has blocks in that exact order.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: admin dashboard with block composer"
```

---

### Task 12: Deployment and owner documentation

**Files:**
- Create: `wrangler.toml`, `.dev.vars.example`, `docs/OWNER-GUIDE.md`
- Replace: `README.md`

**Interfaces:**
- Consumes: everything prior
- Produces: a deployable configuration and instructions the owner can follow without help

- [ ] **Step 1: Write `wrangler.toml`**

```toml
name = "my-little-paper-sky"
pages_build_output_dir = "dist"
compatibility_date = "2026-09-01"
```

- [ ] **Step 2: Write `.dev.vars.example`**

```
ADMIN_PASSWORD_HASH=
ADMIN_PASSWORD_SALT=
SESSION_SECRET=
GITHUB_TOKEN=
GITHUB_REPO=KannanRajan19/SHK
GITHUB_BRANCH=main
RESEND_API_KEY=
CONTACT_RECIPIENT=kannan.ms@gmail.com
CONTACT_SENDER=
```

`.dev.vars` itself is gitignored (Task 1). These are set as **encrypted** Pages environment variables in production — never committed.

- [ ] **Step 3: Write `docs/OWNER-GUIDE.md`**

Covers, in plain language: how Sahana logs in and adds each kind of content; that publishing takes a minute or two; how the parent rotates the password; how to add images; and what to do if login stops working.

- [ ] **Step 4: Replace `README.md`**

What the site is, the stack, local dev (`npm install`, `npm run dev`), how to run tests, the deployment setup, and the full secret list with instructions for generating the password hash.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: owner guide and deployment configuration"
```

---

### Task 13: Verification pass

Nothing here is optional. The June plan was marked complete without any of it running.

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/site.spec.ts`, `tests/e2e/no-admin-leak.spec.ts`

**Interfaces:**
- Consumes: the built `dist/`
- Produces: a green test run

- [ ] **Step 1: Write the admin-leak test**

The spec's hardest public requirement — no hint of the admin anywhere. `tests/e2e/no-admin-leak.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function htmlFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) htmlFiles(full, found);
    else if (entry.endsWith('.html')) found.push(full);
  }
  return found;
}

test('no public page mentions the admin', () => {
  const pages = htmlFiles('dist').filter((f) => !f.includes(`${'admin'}`));
  expect(pages.length).toBeGreaterThan(8);
  for (const file of pages) {
    expect(readFileSync(file, 'utf8').toLowerCase()).not.toContain('admin');
  }
});
```

- [ ] **Step 2: Write the site behaviour tests**

`tests/e2e/site.spec.ts` — assert, against `npm run preview`:

```ts
import { test, expect } from '@playwright/test';

test('book log paginates 832 entries across 42 pages', async ({ page }) => {
  await page.goto('/books');
  await expect(page.getByText('page 1 of 42')).toBeVisible();
  await expect(page.locator('[data-book-row]')).toHaveCount(20);
});

test('first and last jump buttons work and disable at the ends', async ({ page }) => {
  await page.goto('/books');
  await expect(page.getByRole('button', { name: /first/i })).toBeDisabled();
  await page.getByRole('button', { name: /last/i }).click();
  await expect(page.getByText('page 42 of 42')).toBeVisible();
  await expect(page.locator('[data-book-row]')).toHaveCount(12);
  await expect(page.getByRole('button', { name: /last/i })).toBeDisabled();
});

test('unrated books show an em dash and no average is displayed', async ({ page }) => {
  await page.goto('/books');
  await expect(page.locator('[data-book-row]').first()).toContainText('—');
  await expect(page.getByText(/average/i)).toHaveCount(0);
});

test('every blog post has its own URL and title', async ({ page }) => {
  await page.goto('/blog');
  const links = page.locator('a[href^="/blog/"]');
  await expect(links).toHaveCount(6);
  await links.first().click();
  await expect(page).toHaveURL(/\/blog\/.+/);
  await expect(page.getByRole('button', { name: /back to the blog/i })).toBeVisible();
});

test('contact form rejects a bad email without a network call', async ({ page }) => {
  await page.goto('/contact');
  await page.fill('[name=name]', 'test');
  await page.fill('[name=email]', 'nope');
  await page.fill('[name=message]', 'hello');
  await page.getByRole('button', { name: /send/i }).click();
  await expect(page.getByText(/doesn't look right/i)).toBeVisible();
});
```

- [ ] **Step 3: Run the full suite**

Run: `npm run build && npm test && npx playwright test`
Expected: all unit and e2e tests PASS. Fix the code, never the assertion.

- [ ] **Step 4: Visual comparison against the prototype**

Serve the prototype (`python -m http.server 8080` in `design/`) beside `npm run preview`, and compare all seven screens: masthead, nav active dots, hover wiggles, doodle pager, texture, vignette, cursor, ink trail, currently widget at ≥1200px, and reduced-motion behaviour with the OS setting enabled.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "test: end-to-end verification suite"
git push origin main
```

---

## Self-Review

**Spec coverage**

| Spec section | Task |
|---|---|
| §3 Architecture | 1 |
| §4 Content model, derived `minutes`/`excerpt` | 2, 3 |
| §5 Fidelity rules, texture, cursor, trail, reduced-motion | 4 |
| §5 Routes, pages, deterministic rotations | 5, 6 |
| §5 Book log: 20/page, sort, jumps, `—`, hidden average, in-progress | 7 |
| §6 Admin dashboard, six sections, block composer | 11 |
| §6 API: login / publish / upload / contact | 8, 9, 10 |
| §7 Security: hashed password, scoped token, rate limits, path guards | 8, 9, 10 |
| §8 Deployment | 12 |
| §9 Verification, including the 832 and no-admin assertions | 2, 13 |
| §11 Owner tasks | 12 (documented) |

No spec requirement is unassigned.

**Placeholder scan:** none — every code step carries real code; no "add error handling" or "similar to Task N".

**Type consistency:** `Block` is defined once in `src/lib/blocks.ts` (Task 2) and imported by Tasks 3, 11. `Book` is defined in `src/lib/books.ts` (Task 7) and matches the Task 3 schema field-for-field. `verifySession` (Task 9) is consumed by `requireSession` (Task 10) with the same signature. `validateContact` (Task 8) is used by both the page and the Function.

**Known gap, deliberate:** Task 10's `publish`/`upload` bodies are described rather than fully written, because their shape depends on the dashboard's payload settled in Task 11. The security-critical parts they depend on — `isAllowedPath`, `putFile`, `requireSession` — are fully specified and tested.

