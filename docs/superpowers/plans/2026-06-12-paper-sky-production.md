# "My Little Paper Sky" Production Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the HTML/React prototype as a production Astro static site with file-based content, a hidden Sveltia CMS admin at `/admin`, and GitHub Pages deployment from https://github.com/KannanRajan19/SHK.

**Architecture:** Astro 5 static site. All copy/data from the prototype moves into `content/` collections (markdown + JSON) consumed via Astro's content layer, which is exactly what the git-based CMS edits. Pages are server-rendered HTML with small vanilla-JS islands (doodle viewer, blog modal, book sorting, contact form, ink trail) ported from the prototype. Design tokens are the locked **rosewine** palette baked into one global stylesheet; the tweaks panel and other palettes are dropped.

**Tech Stack:** Astro ^5, Sveltia CMS (CDN script, Decap-compatible config), GitHub Actions + GitHub Pages, Google Fonts, vanilla JS.

**Fidelity rule:** `design/pages.jsx` and `design/paper-sky.html` are the source of truth. All copy verbatim. Inline JSX style objects become CSS classes/inline styles with identical values. JS hover states become CSS `:hover` rules with the same transforms/shadows. Per-card rotations use the deterministic formulas from the prototype (`((idx % 5) - 2) * 0.4` for post cards, `(((idx * 37) % 100) - 50) / 60` for pictures); UpdateCard's `Math.random()` rotation becomes the picture formula (deterministic, same range).

**Key decisions (researched 2026-06-12):**
- CMS: **Sveltia CMS** — actively maintained Decap successor, same `config.yml` format, GitHub backend. Login at `/admin` via "Sign in with GitHub Token" (zero infrastructure); optional upgrade to one-click OAuth by deploying `sveltia-cms-auth` on Cloudflare Workers (documented in README, `base_url` left as commented config).
- Hosting: GitHub Pages project site → `site: 'https://kannanrajan19.github.io'`, `base: '/SHK'`. All internal links via `import.meta.env.BASE_URL`.
- Contact form: progressive — `formEndpoint` setting in `content/settings/site.json`; when empty, the form shows the prototype's simulated success state; when set to a Formspree/FormSubmit endpoint, it POSTs there. Setup documented in README.
- Guestbook: kept client-side with the prototype's seeded notes (static site, no backend) — documented as a future enhancement.
- Blog: card grid → each card is a real link to `/blog/<slug>/` (shareable URLs, SEO). The post page reuses the modal's typography on a paper sheet. A small enhancement script opens posts in the prototype's modal (scrim, Escape/click-outside close, `history.pushState`) when JS is available.
- `prefers-reduced-motion`: disables ink trail, wiggles/lifts, and smooth scroll.

**File structure:**

```
/                          (repo root = D:\AI Projects\SHK)
├── design/                # prototype kept as reference (HANDOFF.md, paper-sky.html, *.jsx)
├── content/
│   ├── posts/*.md         # title, date, tag, minutes, excerpt + markdown body
│   ├── books/*.json       # title, author, finished, inProgress, rating, note
│   ├── doodles/*.md       # title, date, note, image (optional)
│   ├── pictures/*.md      # caption, date, tag, aspect, image (optional)
│   └── settings/
│       ├── currently.json # reading / listening / making (widget)
│       └── site.json      # formEndpoint
├── public/
│   ├── admin/index.html   # Sveltia CMS shell (only mention of admin anywhere)
│   ├── admin/config.yml   # backend + collections
│   ├── uploads/.gitkeep   # CMS media folder
│   └── scripts/trail.js   # ink-trail (ported verbatim + reduced-motion guard)
├── src/
│   ├── content.config.ts  # collections w/ glob loaders + zod schemas
│   ├── styles/global.css  # full port of paper-sky.html CSS, rosewine baked in
│   ├── layouts/Base.astro # head/fonts/masthead/nav/footer/currently/trail
│   ├── components/        # Placeholder.astro, Tape.astro, SectionLabel.astro, UpdateCard.astro
│   └── pages/
│       ├── index.astro, about.astro, doodles.astro, books.astro,
│       ├── pictures.astro, contact.astro, 404.astro
│       └── blog/index.astro, blog/[slug].astro
├── .github/workflows/deploy.yml
├── astro.config.mjs, package.json, tsconfig.json, .gitignore
└── README.md              # owner-facing: how to edit, admin setup, deploy
```

---

### Task 1: Repo bootstrap

- [x] `git init -b main`; move `README.md→design/HANDOFF.md`, `paper-sky.html`, `app.jsx`, `pages.jsx`, `tweaks-panel.jsx` into `design/`
- [x] Write `.gitignore` (node_modules, dist, .astro)
- [x] Commit: `chore: import design handoff bundle`

### Task 2: Astro scaffold

- [x] Write `package.json` (astro ^5, scripts dev/build/preview), `astro.config.mjs` (site + base), `tsconfig.json`
- [x] `npm install`
- [x] Verify: `npx astro --version` prints 5.x
- [x] Commit: `chore: scaffold astro project`

### Task 3: Content collections + seed content

- [x] `src/content.config.ts` with zod schemas:
  - posts: title, date (coerce date), tag, minutes (number), excerpt
  - books: title, author, finished (string, '' if in progress), inProgress (bool), rating (0–5), note, order date for sorting (finishedDate optional ISO)
  - doodles: title, date, note, image (optional)
  - pictures: caption, date, tag, aspect (enum '1/1','3/4','4/3','4/5'), image (optional)
  - settings: currently {reading, listening, making}, site {formEndpoint}
- [x] Seed all content verbatim from `design/pages.jsx` arrays (6 posts, 12 books, 5 doodles, 8 pictures) + currently widget values from `app.jsx`
- [x] Verify: `npx astro build` fails only on missing pages, not content (or add a stub index first)
- [x] Commit: `feat: content collections with seed content`

### Task 4: Global CSS + base layout

- [x] `src/styles/global.css`: full CSS port from `design/paper-sky.html` `<style>` block with rosewine values in `:root`, texture/vignette/cursor verbatim, plus classes extracted from JSX inline styles (cards, modal article, booklog grid, polaroid, picture cols, contact grid, guestbook) and `prefers-reduced-motion` overrides
- [x] `public/scripts/trail.js`: trail IIFE ported, color hardcoded `176, 118, 130`, alpha 0.4 cap, reduced-motion guard, no tweak hooks
- [x] `src/layouts/Base.astro`: fonts link, masthead (stamp/h1-link/tagline), nav links with active dot via `aria-current`, footer (page label + client-set date), currently widget (from settings collection), trail canvas + script
- [x] Verify: stub `index.astro` renders shell correctly in `npx astro dev`
- [x] Commit: `feat: global styles, base layout, ink trail`

### Task 5: Pages

- [x] `index.astro` — greeting, intro paras, CTA links, `∿ ∿ ∿`, "what's new" grid built from the 3 most recent items across doodles/posts/pictures (matches prototype copy with seed data)
- [x] `about.astro` — prose, polaroid placeholder, currently `<dl>` (verbatim)
- [x] `doodles.astro` — all doodles rendered, JS shows one at a time with prev/next + dots
- [x] `blog/index.astro` — PostCard grid (links), modal enhancement script
- [x] `blog/[slug].astro` — post page with modal typography
- [x] `books.astro` — header sort buttons (JS re-orders DOM), expandable rows, stats line
- [x] `pictures.astro` — 3-col masonry, captions/tags/aspects
- [x] `contact.astro` — letter form (validation, success state, endpoint-or-simulate), socials, note, guestbook (client-side)
- [x] `404.astro` — small on-brand page
- [x] Verify each in dev server side-by-side with prototype
- [x] Commit per page or batch: `feat: <page>`

### Task 6: Admin (Sveltia CMS)

- [x] `public/admin/index.html` — Sveltia CDN script, robots noindex
- [x] `public/admin/config.yml` — backend `github`, repo `KannanRajan19/SHK`, branch `main`, media `public/uploads` → `/SHK/uploads`; collections: Posts ✏️, Book log 📚, Doodles 🖍, Pictures 📷, Currently + Site settings (file collection)
- [x] Verify `/admin/` loads the CMS login screen locally
- [x] Commit: `feat: hidden admin via sveltia cms`

### Task 7: Deploy + docs + push

- [x] `.github/workflows/deploy.yml` — withastro/action → GitHub Pages
- [x] New `README.md` — what the site is, how Sahana edits (admin URL, token sign-in steps), OAuth-worker upgrade path, contact-form setup, local dev
- [x] `npm run build` passes; spot-check `dist/`
- [x] `git remote add origin https://github.com/KannanRajan19/SHK.git`; push `main` (if credentials unavailable, leave exact push instructions)
- [x] Commit: `docs: owner guide` / `ci: github pages deploy`

### Task 8: Verification pass

- [x] `npm run build` + `npx astro preview`; Playwright screenshots of all 7 pages vs prototype
- [x] Check: nav active dots, hover wiggles, doodle pager, modal (Escape/click-outside), book sort + expand, form validation + success, texture/cursor/trail, currently widget ≥1200px, reduced-motion, `/admin` reachable, no admin links anywhere public

## Self-review notes
- Spec coverage: all README sections mapped (screens 1–7 → Task 5; CMS → Task 6; tokens/typography → Task 4; interactions → Tasks 4–5; deploy/improvements → Task 7; assets/placeholders → Placeholder component kept as empty state).
- Tweaks panel, EDITMODE block, Babel/CDN: dropped (Task 1 moves them to design/, never ported).
- Guestbook + form: scoped honestly (static hosting), documented.
