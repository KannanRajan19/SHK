import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { readingTime, deriveExcerpt } from './lib-blocks.mjs';

const src = readFileSync('design/pages.jsx', 'utf8');

/**
 * The prototype's data arrays are plain JS literals (unquoted keys, single
 * quotes), so JSON.parse cannot read them. Evaluate them in an EMPTY vm
 * context with no globals and a timeout: the literals reference no
 * identifiers, so nothing legitimate needs `require`, `process` or the
 * filesystem, and anything that tries to reach them fails instead of running.
 */
function evalLiteral(source, what) {
  try {
    return runInNewContext(`(${source})`, Object.create(null), {
      timeout: 1000,
      displayErrors: true,
    });
  } catch (err) {
    throw new Error(`could not evaluate ${what}: ${err.message}`);
  }
}

function extractSpan(text, from, openChar, closeChar) {
  const open = text.indexOf(openChar, from);
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === openChar) depth++;
    else if (c === closeChar) { depth--; if (depth === 0) return text.slice(open, i + 1); }
  }
  throw new Error('unbalanced literal');
}

function extractArray(name) {
  const start = src.indexOf(`const ${name} = [`);
  if (start < 0) throw new Error(`${name} not found in design/pages.jsx`);
  return evalLiteral(extractSpan(src, start, '[', ']'), name);
}

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const write = (p, data) => writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);

for (const d of ['content/posts', 'content/doodles', 'content/pictures', 'content/settings'])
  mkdirSync(d, { recursive: true });

// Books: copied byte-for-byte. Never re-sorted, never regenerated.
cpSync('design/books.json', 'content/books.json');

const posts = extractArray('POSTS');
for (const p of posts) {
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

const doodles = extractArray('DOODLES');
for (const d of doodles)
  write(`content/doodles/${slug(d.title)}.json`, {
    title: d.title, date: d.date, note: d.note, image: d.image ?? '',
    // The label shown inside the striped stand-in until a real scan arrives.
    placeholder: d.placeholder ?? 'doodle',
  });

const pictures = extractArray('PICTURES');
pictures.forEach((pic, i) =>
  write(`content/pictures/${String(i + 1).padStart(2, '0')}-${slug(pic.caption)}.json`, {
    caption: pic.caption, date: pic.date ?? '', tag: pic.tag ?? '',
    aspect: pic.aspect ?? '1/1', image: pic.image ?? '',
  })
);

// Settings come from admin.jsx's DEFAULT_CONTENT (the authoritative copy).
const admin = readFileSync('design/admin.jsx', 'utf8');
const dcStart = admin.indexOf('const DEFAULT_CONTENT');
if (dcStart < 0) throw new Error('DEFAULT_CONTENT not found in design/admin.jsx');
const DC = evalLiteral(extractSpan(admin, dcStart, '{', '}'), 'DEFAULT_CONTENT');

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

console.log(
  `migration complete — ${posts.length} posts, ${doodles.length} doodles, ` +
  `${pictures.length} pictures, ${JSON.parse(readFileSync('content/books.json', 'utf8')).length} books`
);
