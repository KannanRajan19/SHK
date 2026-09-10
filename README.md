# my little paper sky

Sahana's personal website — a cozy, analog, zine-like corner of the internet.

Built with [Astro](https://astro.build), deployed on Cloudflare Pages, with a
hidden password-protected admin so Sahana can publish without touching code.

The original design prototype is preserved in [`design/`](design/) for
reference. It is not used by the build.

---

## For Sahana

Go to **`/admin`** and type your password. There's no link to it anywhere on
the site — bookmark it.

From there you can write a blog post (stacking paragraphs and pictures in any
order), add a doodle, add a picture, add a book, and edit the home and about
text and the "currently" list.

**Publishing takes a minute or two.** When you press publish, the change is
saved and the site rebuilds itself. It is not instant — wait a moment and
refresh.

---

## Local development

```bash
npm install
npm run dev          # http://localhost:4321
npm test             # unit tests
npm run build        # production build into dist/
```

`npm run migrate` regenerates `content/` from the prototype in `design/`. It has
already been run — you should not need it again, and running it will overwrite
anything published since.

---

## Deployment

Cloudflare Pages, connected to this repository.

| Setting | Value |
|---|---|
| Production branch | `main` |
| Build command | `npm run build` |
| Output directory | `dist` |

The public site needs **no** environment variables. Everything below is
optional and enables one extra feature each.

### Enabling the admin

Generate the secrets — run it with no argument so it prompts, keeping the
password out of your shell (and out of shell history):

```bash
node scripts/make-password.mjs
```

Before pasting anything, confirm the pair is right. Cloudflare's encrypted
variables are write-only, so this is the only chance to check them:

```bash
node scripts/make-password.mjs --verify <salt> <hash>
```

It should print `MATCH`.

Add its three outputs as **encrypted** environment variables in
Cloudflare Pages → Settings → Environment variables:

| Variable | Value |
|---|---|
| `ADMIN_PASSWORD_SALT` | from the script |
| `ADMIN_PASSWORD_HASH` | from the script |
| `SESSION_SECRET` | from the script |
| `GITHUB_TOKEN` | a fine-grained PAT — see below |
| `GITHUB_REPO` | `KannanRajan19/SHK` |
| `GITHUB_BRANCH` | `main` |

The `GITHUB_TOKEN` must be a **fine-grained** personal access token scoped to
**this repository only**, with **Contents: read and write** and nothing else.
That way the worst a leaked token could do is post to this one site.

The password itself is never stored — only its hash — so it cannot be
recovered. Keep it somewhere safe. To change it, re-run the script and update
the two `ADMIN_PASSWORD_*` variables **together**: every run makes a new random
salt, so a hash from one run will not verify against a salt from another.

**Environment variables only take effect on a new build.** Saving them in the
dashboard does nothing on its own — push a commit, or create a deployment, and
check `/version.json` to confirm which commit is actually live.

### Enabling the contact form

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | from [resend.com](https://resend.com) |
| `CONTACT_SENDER` | a verified sender address |
| `CONTACT_RECIPIENT` | where messages go |

Without these the form fails honestly and shows a direct email address. It
never pretends a message was sent.

---

## Content

Everything lives as files, which is what the admin commits:

```
content/
├── posts/<slug>.json     blog posts (body is an ordered array of blocks)
├── books.json            the book log — 832 entries, newest first
├── doodles/<slug>.json
├── pictures/<slug>.json
└── settings/
    ├── currently.json    the five "currently" fields
    ├── text.json         home intro and about bio paragraphs
    └── site.json
```

`settings/currently.json` is read by both the fixed widget and the About page,
so the two can never disagree.

Images live in `public/uploads/` and are downscaled in the browser before
upload.

---

## Notes

- All images on the site are striped placeholders until real ones are added.
  The placeholder is the intended empty state, not a bug.
- Book ratings are `0` for every seeded entry, which renders as `—` rather than
  zero stars. The average rating line stays hidden until something is rated.
- A blank `finished` date means a book is still being read.
