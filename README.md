# Handoff: "My Little Paper Sky" — Sahana's Personal Website

## Overview
A personal website for Sahana Hypatia Kannan ("my little paper sky") — a cozy, analog, zine-like corner of the internet with doodles, a blog, a book log, pictures, and a contact page. The aesthetic is warm paper, typewriter type, taped-on polaroids, and a hand-drawn feel. No algorithm, no feed — just a small handcrafted site.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype showing the intended look and behavior, **not production code to ship directly**. The prototype uses in-browser Babel (`text/babel` script tags) and React UMD builds from a CDN, which is fine for prototyping but not for a real site.

**Your task:** recreate this design as a proper static website. Since the target repo (https://github.com/KannanRajan19/SHK) is empty, choose the most appropriate setup. Recommended: either

1. **Plain static HTML/CSS/JS** (simplest — this is a small personal site, content rarely changes), or
2. **Vite + React** (closest mapping from the prototype's component structure), or
3. **Astro** (best of both: component authoring, static output, easy to add blog posts as markdown).

Astro or plain static is recommended for easy free hosting on GitHub Pages.

### Things to REMOVE when productionizing
- `tweaks-panel.jsx` and the `<PaperSkyTweaks>` component — this is a design-review tool, not a site feature. **Bake in the chosen settings** (see "Locked-in design decisions" below) as plain CSS custom properties.
- The Babel/React CDN script tags — replace with a real build (or no framework at all).
- The `/*EDITMODE-BEGIN*/ ... /*EDITMODE-END*/` JSON block in `app.jsx` — those are the chosen tweak values; treat them as final design tokens.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and interactions are final. Recreate pixel-perfectly. All copy in the files is real content written for this site — keep it verbatim unless the owner says otherwise.

## Locked-in design decisions (from the tweaks state)
- Site name: **"my little paper sky"**
- Tagline: **"sahana hypatia kannan"**
- Palette: **rosewine** (see Design Tokens)
- Body font: **Special Elite** (typewriter), fallback JetBrains Mono
- Display font: **Cormorant Garamond** (italic, weight 500)
- Density: **compact** (this is the shipped default — bake in the compact scale)
- Paper texture opacity: 1.0 (CSS var `--texture-opacity` feeds a `body::before` layer with base opacity 0.55)
- Cursor ink trail: **ON**
- "Currently" widget: **ON**

## Screens / Views
Single-page app with client-side page switching (no URL routing in the prototype — adding real routes/pages per section is an improvement you should make). Shared shell on every page: masthead (stamp "est. 2026 · no. 01", site name in italic display serif, handwritten tagline), centered uppercase-mono nav with active-dot indicator, and footer ("© 2026 · made with care" + current page/date).

1. **home** — handwritten greeting, two intro paragraphs (max-width 54ch), two CTA buttons ("see today's doodle →" accent, "read the blog" outline), a `∿ ∿ ∿` divider, and a "what's new" grid of three `UpdateCard`s (slightly rotated paper cards, wiggle on hover).
2. **about** — prose intro, a `<dl>` of facts (`Dt`/`Dd` rows), and a rotated `PolaroidPlaceholder` (image placeholder — owner to supply a real photo).
3. **doodles** — one-at-a-time doodle viewer with prev/next over a `DOODLES` array (date, title, note, image placeholder). All doodle images are placeholders awaiting real scans.
4. **blog** — list of `PostCard`s (rotated, hover wiggle); clicking a card opens the post as its own **full page** (`PostPage`), NOT a modal — wide measure (68ch), large display title, "← back to the blog" button top and bottom, and a handwritten "— s." sign-off. Give each post a real URL.
5. **book log** — list of books loaded from `books.json` at runtime, **paginated 20 per page**, newest first. Sort control (recent / rating / author). `BookRow` expands on click to show a note; "in progress" books styled distinctly; star ratings rendered as text; rating 0 renders as "—". Footer nav reads "← newer · page N of M · older →" in uppercase mono with 1px rule borders, disabled at the ends. **The owner also asked for first-page and last-page jump buttons flanking the newer/older buttons — add those.** Header shows "N finished" (and average rating only once ratings exist).
6. **pictures** — masonry-ish grid of `Picture` cards with varied aspect ratios, rotation, captions, and tags. All placeholders awaiting real photos.
7. **contact** — form (name / email / message) with validation (required fields, email format), a fake "sent" success state, and a `SocialRow` list. **Needs a real backend or form service** (e.g. Formspree, Netlify Forms) — the prototype only simulates submission.

Exact layout, copy, data arrays, and inline styles for every screen are in `pages.jsx` — treat it as the source of truth.

## Interactions & Behavior
- Page transition: `.page` fades/slides in (`gentleIn`, 0.5s ease); scroll to top on page change.
- Nav buttons: hover → accent color; active → ink color + 5px accent dot below.
- `.btn`: 1px ink border, uppercase mono 11px; hover inverts (ink bg, paper text). `.btn.accent` uses accent color.
- Cards (UpdateCard, PostCard, Picture): each has a small per-item random rotation; hover triggers a subtle wiggle/lift.
- Blog post view: a full page (not a modal). Scroll resets to top when opening or leaving a post.
- **Cursor ink trail**: a fixed full-viewport `<canvas id="trail">` draws a fading stroke trail following the pointer (color = palette `trail` value, ~32 points, life decay 0.96/frame). Plain JS — port as-is from the bottom of `paper-sky.html`. Respect `prefers-reduced-motion` (disable trail) as an improvement.
- **Custom cursor**: an inline-SVG flower cursor on body and interactive elements (see the `cursor: url(...)` rules).
- "Currently" widget: fixed bottom-left taped note, rotated −1.5°, hidden below 1200px viewport width.
- Contact form: bottom-border-only inputs, accent border on focus; validate name/email/message; show success state after submit.

## Design Tokens (rosewine palette — final)
```css
--paper:       #fbf2ee;   /* page background */
--paper-deep:  #f0dfd6;   /* placeholder/card fill */
--ink:         #2c1d1f;   /* primary text */
--ink-soft:    #4d3236;   /* body text */
--ink-faint:   #9a7c80;   /* labels, metadata */
--rule:        #dcc8c4;   /* hairlines, borders */
--accent:      #b07682;   /* rose — links, CTAs, highlights */
--accent-soft: #c89aa3;
--gold:        #cc8b50;   /* stars, small flourishes */
--tape:        rgba(176, 118, 130, 0.14);  /* washi-tape decorations */
/* ink-trail color: rgba(176, 118, 130, 0.4) */
```
(The other four palettes in `app.jsx` — sunset, sage, bluemilk, ink — were explored options; only rosewine ships.)

### Typography
- Display: `'Cormorant Garamond', Georgia, serif` — italic, weight 500. Masthead h1: `clamp(40px, 6vw, 64px)`; page titles `.title-serif`: `clamp(32px, 4vw, 44px)`, line-height 1.1.
- Body: `'Special Elite', 'JetBrains Mono', monospace` — 16px, line-height 1.7, letter-spacing 0.01em.
- Hand-written accents: `'Caveat', cursive` (tagline 22px, greetings ~26px).
- Mono labels: `'JetBrains Mono'` — 10–12px, uppercase, letter-spacing 0.15–0.32em.
- Google Fonts import is in the `<head>` of `paper-sky.html`.

### Spacing & misc
- Content column: max-width 880px, centered; padding 56px 40px 120px (mobile: 32px 22px 80px).
- Borders are square (no border-radius) except the modal close button (circle).
- Shadows: soft warm, e.g. `0 6px 20px -8px rgba(80,50,20,0.25)` (currently widget), `0 30px 60px -20px rgba(40,25,10,0.4)` (modal).
- Paper texture: SVG feTurbulence noise + two warm radial tints, `mix-blend-mode: multiply` on `body::before`; vignette on `body::after`. Port these verbatim.

## Assets
**No real images exist yet.** Every image in the design is a striped `.placeholder` (or `PolaroidPlaceholder`) with a mono label describing what goes there (doodle scans, photos, an about-page portrait). Keep the placeholder component so the owner can drop images in incrementally. Fonts come from Google Fonts (linked in head).

## Files in this bundle
- `paper-sky.html` — public page shell: all CSS (tokens, components, texture, modal, forms), the cursor-trail script, and script loading.
- `app.jsx` — app shell: page switcher, masthead/nav/footer, theme application, "currently" widget, tweaks panel (delete in production).
- `pages.jsx` — all seven page components plus content data arrays (`DOODLES`, `POSTS`, `PICTURES`). **Source of truth for layout and copy.**
- `books.json` — **the real book log: 832 entries**, newest first, each `{title, author, finished, rating, note}`. All lowercase. `finished` is a "Mon YYYY" string (month precision only — the owner does not track exact days). Ratings/notes are mostly empty and will be filled in over time. **Migrate this file's contents as the seed data for the book-log collection — do not regenerate or re-sort it.**
- `admin.html` / `admin.jsx` — **prototype of the hidden admin experience** (see the Admin section). Password-gated demo saving to `localStorage`. Do NOT port the fake auth, but DO reproduce its dashboard structure, field sets, and the block-based post composer.
- `shared-storage.js` — localStorage helpers for the prototype only; do not port.
- `tweaks-panel.jsx` — design-review tooling only; do not port.

## Admin / Content editing (REQUIRED — core feature)
The site owner is a kid (Sahana). She must be able to add content **without touching code**, through a hidden admin page. This is a hard requirement, not a nice-to-have.

### Requirements
- **URL**: `/admin` is the ONLY place any login or editing UI exists. The public site must contain **no login link, no admin link, no hint of it anywhere** — she reaches it by typing the URL or via a bookmark.
- **CMS**: use a git-based CMS — **Decap CMS** (or Pages CMS / Sveltia as alternatives). Publishing from the admin commits to this GitHub repo; the site rebuilds/redeploys automatically.
- **Login**: simple and kid-friendly, shown only at `/admin`. Default to **GitHub OAuth** (Sahana gets her own free GitHub account, or shares the parent's `KannanRajan19` account) — Pages CMS and Sveltia CMS support this with minimal setup. Verify the current best free option at build time (e.g. Netlify Identity is deprecated — do not use it). Only the owner's account(s) may have write access.
- **Content must therefore live as files**, structured for CMS editing:
  - `content/posts/*.md` — one markdown file per blog post (title, date, body). Replaces the `POSTS` array in `pages.jsx`.
  - `content/books.json` (or one file per book) — title, author, finished date (or "in progress"), rating 1–5, note. Replaces `BOOKS`.
  - `content/doodles/*` — date, title, note, image upload. Replaces `DOODLES`.
  - `content/pictures/*` — image upload, caption, date, tag. Replaces `PICTURES`.
  - Also make the "Currently" widget values editable as a small settings file: **reading / drawing / listening / watching / learning** (five fields; the same values render in the fixed widget AND in the About page's `<dl>`, so both must read from one source).
  - Home-page intro paragraphs (2) and About-page bio paragraphs (4, the last one styled as the handwritten closing line) must also be editable — see the prototype's `DEFAULT_CONTENT` in `admin.jsx` for the exact field set and current copy.

### Admin collections (what she sees after login)
`admin.jsx` in this bundle is a working prototype of this dashboard — match its structure and fields.

1. **Write a new blog post** — title, optional tag, then a **block-based composer**: she stacks "¶ paragraph" and "▣ picture" blocks in any order, reorders them with ↑/↓, and removes any block. Each picture block has its own image upload and optional caption. This is a specific, explicitly-requested feature: she wants to control exactly where images sit between paragraphs (e.g. two paragraphs, a picture, two more paragraphs, another picture). Store the post body as an ordered array of blocks (`{type:'text', value}` / `{type:'image', value, caption}`) or as markdown with inline images — either is fine as long as arbitrary interleaving round-trips. Read time is derived from word count.
2. **Add a doodle** — image upload, title, caption. Date defaults to today.
3. **Add a picture** — image upload, caption, optional tag. Date defaults to today.
4. **Add a book** — title, author, finished ("Mon YYYY", blank = "in progress"), rating 0–5, optional note. Titles/authors/notes are stored lowercased. New entries go to the top of the log.
5. **Home & About text** — the intro and bio paragraph fields.
6. **Currently** — the five widget fields listed above.

Image uploads should land in the repo (e.g. `public/uploads/`) and replace the striped placeholders on the public pages. Keep the placeholder styling as the empty state when a section has no entries yet. Every public page must render owner-added entries ahead of any seeded sample content.

## Suggested production improvements (in scope for Claude Code)
- Real per-page URLs (routing or separate pages) + page titles for shareability/SEO — including a URL per blog post.
- First-page / last-page jump buttons on the book log pagination (requested, not yet built in the prototype).
- Wire the contact form to a real form service.
- `prefers-reduced-motion` handling for the ink trail and wiggles.
- Deploy from this repo (GitHub Pages or Netlify — whichever pairs best with the chosen CMS).

## Build recommendation (updated)
Given the CMS requirement, **Astro** (or another static-site generator with markdown content collections) is the recommended setup — content-as-files maps directly onto the CMS collections above. Plain hand-edited HTML is no longer a good fit.
