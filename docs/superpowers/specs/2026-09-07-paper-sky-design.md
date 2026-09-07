# "My Little Paper Sky" — Production Design Spec

**Date:** 2026-09-07
**Status:** Awaiting owner review
**Supersedes:** `docs/superpowers/plans/2026-06-12-paper-sky-production.md`

> The June plan is marked fully complete but **none of its artifacts exist** in the repo, and it
> predates the current bundle (it assumed 12 seed books and a 3-field "currently" widget; the real
> bundle ships 832 books and 5 fields, plus an admin prototype). Treat it as reference only.

---

## 1. Goal

Recreate the `design_handoff_paper_sky` prototype as a production static site, with a hidden
password-protected admin at `/admin` that lets Sahana publish content without touching code.

Fidelity is **high**: colours, type, spacing, copy and interactions in `pages.jsx` and
`paper-sky.html` are final and are the source of truth.

---

## 2. Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Custom admin + password login**, not an off-the-shelf CMS | Sahana never needs a GitHub account. Also the only way to get the block composer exactly as prototyped. |
| 2 | **Cloudflare Pages** hosting | Site and admin API share one origin: no CORS, no `/SHK` base path, one deploy. |
| 3 | **Contact form emails kannan.ms@gmail.com** | Messages from strangers reach a parent first, not the kid. |

### Why not a client-side password

The prototype hardcodes `ADMIN_PASSWORD = 'paperbird'` (`admin.jsx:6`) and saves to `localStorage`.
That fails twice: the password is readable via View Source, and — more fundamentally — publishing
requires **write access to the GitHub repo**, which needs a credential that cannot be safely placed
in a browser. The secret must live server-side. Hence Pages Functions.

---

## 3. Architecture

**Astro 5**, static output, deployed to Cloudflare Pages from this repo.
Admin API as **Cloudflare Pages Functions** (`functions/api/*`) in the same repo and origin.
No React in production; interactive bits are small vanilla-JS islands.
The `.jsx` files move to `design/` and remain reference only.

```
content/         file-based content (what the admin commits)
functions/api/   login, publish, upload, contact
public/uploads/  owner-uploaded images
src/             Astro pages, layouts, components, global.css
design/          prototype kept for reference
```

---

## 4. Content model

```
content/
├── posts/<slug>.json    {title, tag, date, minutes, excerpt,
│                         blocks:[{type:'text',value} | {type:'image',value,caption}]}
├── books.json           all 832 entries, migrated verbatim
├── doodles/<slug>.json  {title, date, note, image}
├── pictures/<slug>.json {caption, date, tag, aspect, image}
└── settings/
    ├── currently.json   reading, drawing, listening, watching, learning
    ├── text.json        homeIntro1-2, aboutBio1-4
    └── site.json        contact recipient, misc
```

**Posts are JSON, not markdown.** The block composer must round-trip arbitrary
paragraph/picture interleaving exactly; markdown would require parsing prose back into blocks on
every edit, which is lossy. Existing `POSTS[].body` is already an array of paragraph strings, so the
6 seed posts migrate to all-`text` blocks with no content loss.

**`minutes` and `excerpt` are derived, not authored.** The composer never asks for them: at publish
time `minutes` is computed from the word count of all `text` blocks, and `excerpt` from the opening
text block, truncated on a word boundary. Both are then **written into the file** so public pages
render them without recomputing. An author-supplied `excerpt`, if ever added, wins over the derived one.

**`currently.json` is read by both** the fixed widget and the About page `<dl>`, so the two can
never drift apart.

### Seed content (exact counts — verify after migration)

| Collection | Count | Source |
|-----------|-------|--------|
| posts | 6 | `pages.jsx` `POSTS` |
| doodles | 5 | `pages.jsx` `DOODLES` |
| pictures | 8 | `pages.jsx` `PICTURES` |
| books | **832** | `books.json` |
| text / currently | 2+4 / 5 fields | `admin.jsx` `DEFAULT_CONTENT` |

---

## 5. Public site

Routes: `/`, `/about`, `/doodles`, `/blog`, `/blog/<slug>`, `/books`, `/pictures`, `/contact`, `404`.
Every blog post gets a real shareable URL; the post opens as a **full page**, not a modal.

### Fidelity rules

- Rosewine palette only, baked as CSS custom properties. The other four palettes are dropped.
- Compact density is the shipped default.
- Fonts: Cormorant Garamond (display, italic 500), Special Elite (body), Caveat (handwritten), JetBrains Mono (labels).
- Paper texture (`feTurbulence` + radial tints, `mix-blend-mode: multiply` on `body::before`),
  vignette on `body::after`, and the inline-SVG flower cursor port **verbatim**.
- Ink trail ports verbatim from `paper-sky.html`, colour `rgba(176,118,130,0.4)`.
- Per-card rotations must be **deterministic** (derived from index), never `Math.random()`, so
  server and client output match.
- `prefers-reduced-motion` disables the trail, wiggles and smooth scroll.
- Striped placeholders are retained as the empty state for any section with no entries.

### Book log

- 20 per page, newest first, order from `books.json` preserved exactly — never re-sorted on migration.
- Sort control: recent / rating / author.
- Pagination footer: `← newer · page N of M · older →`, **plus first-page and last-page jump
  buttons** flanking them (requested, absent from the prototype). Disabled at the ends.
- `rating: 0` renders as `—`, not zero stars. All 832 seed entries are currently rating 0.
- Average rating in the header stays **hidden until at least one real rating exists**.
- "In progress" = blank `finished`. No seed entry exercises this state, so it must be built and
  tested deliberately.
- All 832 rows are embedded once as JSON and sorted/paginated by a client island. Statically
  generating every sort x page combination would mean 126 HTML files for no benefit.

---

## 6. Admin

`/admin` is the only place any login or editing UI exists. **No link, no hint, anywhere public.**
`noindex`, excluded from sitemap.

Rebuild the `admin.jsx` dashboard for real, matching its structure and field sets:

1. **New blog post** — title, optional tag, block composer: stack `¶ paragraph` / `▣ picture`
   blocks in any order, reorder with up/down, remove any block, per-picture caption. Read time
   derived from word count.
2. **Add doodle** — image, title, caption; date defaults to today.
3. **Add picture** — image, caption, optional tag; date defaults to today.
4. **Add book** — title, author, finished (`Mon YYYY`, blank = in progress), rating 0-5, optional
   note. Stored lowercased. New entries go to the **top** of the log.
5. **Home & About text** — 2 intro + 4 bio paragraphs.
6. **Currently** — the 5 widget fields.

Owner-added entries render **ahead of** seeded sample content on every public page.

### API

| Endpoint | Purpose |
|----------|---------|
| `POST /api/login` | Verify password, set short-lived signed httpOnly session cookie |
| `POST /api/publish` | Write content files to the repo via the GitHub API |
| `POST /api/upload` | Commit an image to `public/uploads/` |
| `POST /api/contact` | Email the contact form to the configured recipient |

Images are downscaled in the browser (max ~1600px, re-encoded) before upload; unresized phone
photos would bloat the repo quickly.

---

## 7. Security model

- Password stored **hashed** as a Cloudflare secret, verified server-side. Never shipped to the browser.
- GitHub token never leaves the Function.
- Token is a **fine-grained PAT scoped to this repo only, contents-write only** — worst case is
  unwanted posts on this one site, not account compromise.
- Login rate-limited; session cookie httpOnly, `Secure`, `SameSite=Lax`, short expiry.
- Contact endpoint rate-limited and size-capped.

---

## 8. Deployment

Cloudflare Pages connected to this GitHub repo. Build `npm run build`, output `dist/`.
Functions deploy with the site. Publishing flow:

> admin -> Function commits to GitHub -> Pages rebuild -> live in ~1-2 minutes.

The admin shows an explicit "publishing..." state. It must not pretend the change is already live.

---

## 9. Verification

- `npm run build` passes; Playwright screenshots of all 7 pages against the prototype.
- Automated assertion: the string `admin` appears **nowhere** in public `dist/` output.
- Automated assertion: **832** books survive migration, in original order.
- Manual: nav active dots, hover wiggles, doodle pager, book sort + expand + pagination including
  first/last jumps, in-progress book rendering, form validation and success, texture/cursor/trail,
  currently widget at >=1200px, reduced-motion, full admin round-trip (write -> publish -> live).

---

## 10. Trade-offs and out of scope

- **Publish is not instant** (~1-2 min rebuild). Accepted; surfaced in the UI.
- **One shared password**, rotatable by the parent. Accepted cost of Sahana not needing a GitHub account.
- **Email needs a provider** (Resend free tier) with a verified sender — one owner signup.
- **Images live in git** and grow the repo over time. Fine at this scale; revisit past ~1000 images.
- Out of scope: comments, guestbook, analytics, RSS, custom domain, multi-user accounts.

---

## 11. Owner tasks (cannot be automated)

1. Create the Cloudflare account and connect this repo to Pages.
2. Create a fine-grained GitHub PAT (this repo, contents-write) and store it as a Pages secret.
3. Choose the admin password; store its hash as a Pages secret.
4. Sign up for Resend and verify a sender address.
5. Supply real images to replace placeholders, incrementally.
