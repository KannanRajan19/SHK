// Page components for My Little Paper Sky

const { useState, useEffect, useRef } = React;

// ---------- HOME ----------
function HomePage({ go, siteName, tagline }) {
  const content = useSiteContent();
  return (
    <div className="page home">
      <section style={{ marginTop: 12 }}>
        <p style={{ fontFamily: 'var(--font-hand)', fontSize: 26, color: 'var(--accent)', margin: '0 0 12px', lineHeight: 1.2 }}>
          hi there!!
        </p>
        <p style={{ fontSize: 16.5, lineHeight: 1.85, maxWidth: '54ch', margin: '0 0 18px', color: 'var(--ink-soft)' }}>
          {content.homeIntro1}
        </p>
        <p style={{ fontSize: 16.5, lineHeight: 1.85, maxWidth: '54ch', margin: '0 0 28px', color: 'var(--ink-soft)' }}>
          {content.homeIntro2}
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn accent" onClick={() => go('doodles')}>see today's doodle →</button>
          <button className="btn" onClick={() => go('blog')}>read the blog</button>
        </div>
      </section>

      <div className="aster">∿   ∿   ∿</div>

      <section>
        <div className="section-label"><span>what's new</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          <UpdateCard
            kind="doodle"
            date="May 03"
            title="a sleepy cat by the window"
            note="drew this while the kettle was boiling."
            onClick={() => go('doodles')}
          />
          <UpdateCard
            kind="post"
            date="Apr 28"
            title="on slow mornings"
            note="three hundred words about not rushing."
            onClick={() => go('blog')}
          />
          <UpdateCard
            kind="picture"
            date="Apr 24"
            title="the magnolias opened"
            note="four photos from the park."
            onClick={() => go('pictures')}
          />
        </div>
      </section>
    </div>
  );
}

function UpdateCard({ kind, date, title, note, onClick }) {
  const [hover, setHover] = useState(false);
  const rot = useRef((Math.random() - 0.5) * 1.4).current;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--rule)',
        padding: '18px 18px 20px',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'inherit',
        color: 'inherit',
        position: 'relative',
        transform: hover ? `rotate(${rot}deg) translateY(-2px)` : 'rotate(0) translateY(0)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        boxShadow: hover ? '0 12px 24px -12px rgba(80, 50, 20, 0.25)' : 'none',
      }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
        {kind} · {date}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontStyle: 'italic', lineHeight: 1.2, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>{note}</div>
    </button>
  );
}

// ---------- ABOUT ----------
function AboutPage() {
  const content = useSiteContent();
  return (
    <div className="page">
      <div className="section-label"><span>about</span></div>
      <h2 className="title-serif">a few things about me</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 40, alignItems: 'start' }}>
        <div style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--ink-soft)' }}>
          <p style={{ marginTop: 0, marginBottom: 14 }}>{content.aboutBio1}</p>
          <p style={{ marginTop: 0, marginBottom: 14 }}>{content.aboutBio2}</p>
          <p style={{ marginTop: 0, marginBottom: 14 }}>{content.aboutBio3}</p>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: 22, color: 'var(--accent)', marginTop: 18, marginBottom: 0, lineHeight: 1.25 }}>
            {content.aboutBio4}
          </p>
        </div>

        <PolaroidPlaceholder label="a photo of me" caption="probably" />
      </div>

      <div className="aster">∿</div>

      <section style={{ marginTop: 40 }}>
        <div className="section-label"><span>currently</span></div>
        <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 14, columnGap: 24, margin: 0, fontSize: 15 }}>
          <Dt>reading</Dt><Dd>{content.currentlyReading}</Dd>
          <Dt>drawing</Dt><Dd>{content.currentlyDrawing}</Dd>
          <Dt>listening</Dt><Dd>{content.currentlyListening}</Dd>
          <Dt>watching</Dt><Dd>{content.currentlyWatching}</Dd>
          <Dt>learning</Dt><Dd>{content.currentlyLearning}</Dd>
        </dl>
      </section>
    </div>
  );
}

function Dt({ children }) {
  return <dt style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--ink-faint)', alignSelf: 'baseline' }}>{children}</dt>;
}
function Dd({ children }) {
  return <dd style={{ margin: 0, color: 'var(--ink-soft)', fontFamily: 'var(--font-body)' }}>{children}</dd>;
}

function PolaroidPlaceholder({ label, caption }) {
  return (
    <div style={{ position: 'relative', transform: 'rotate(2deg)', padding: '12px 12px 36px', background: '#fdfaf2', boxShadow: '0 8px 22px -10px rgba(80, 50, 20, 0.3)', border: '1px solid var(--rule)' }}>
      <div className="tape" style={{ top: -10, left: '50%', marginLeft: -40 }}></div>
      <div className="placeholder" style={{ aspectRatio: '4/5', width: '100%' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-hand)', fontSize: 18, color: 'var(--ink-soft)', textAlign: 'center', marginTop: 8 }}>{caption}</div>
    </div>
  );
}

// ---------- DOODLES ----------
const DOODLES = [
  { date: 'May 03, 2026', title: 'sleepy cat, by the window', note: 'drew this while the kettle was boiling. she didn\'t move once. i think the sun was too good to leave.', placeholder: 'doodle — cat' },
  { date: 'Apr 30, 2026', title: 'a coffee that took too long', note: 'the line was out the door. i watched a pigeon on the bench across from me for a full ten minutes.', placeholder: 'doodle — coffee cup' },
  { date: 'Apr 27, 2026', title: 'three small mushrooms', note: 'found them on the path near the river. i didn\'t pick them. just hello.', placeholder: 'doodle — mushrooms' },
  { date: 'Apr 25, 2026', title: 'the moon at 4am', note: 'couldn\'t sleep. drew this in pen because the pencil was downstairs.', placeholder: 'doodle — moon' },
  { date: 'Apr 22, 2026', title: 'lemons in a blue bowl', note: 'we had too many. i drew them, then made marmalade.', placeholder: 'doodle — lemons' },
];

function DoodlesPage() {
  const [extra] = useState(() => loadList('paperSkyExtraDoodles'));
  const allDoodles = [...extra, ...DOODLES];
  const [i, setI] = useState(0);
  const d = allDoodles[i];

  return (
    <div className="page">
      <div className="section-label"><span>doodles</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
        <h2 className="title-serif" style={{ margin: 0 }}>one at a time</h2>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.2em' }}>
          {String(i + 1).padStart(2, '0')} / {String(allDoodles.length).padStart(2, '0')}
        </div>
      </div>

      <div style={{ position: 'relative', transform: 'rotate(-0.6deg)' }}>
        <div className="tape" style={{ top: -12, left: 36, transform: 'rotate(-4deg)' }}></div>
        <div className="tape" style={{ top: -12, right: 48, transform: 'rotate(3deg)' }}></div>
        <div style={{ background: '#fdfaf2', border: '1px solid var(--rule)', padding: '32px 32px 28px', boxShadow: '0 16px 32px -18px rgba(80, 50, 20, 0.35)' }}>
          {d.image ? (
            <img src={d.image} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
          ) : (
            <div className="placeholder" style={{ aspectRatio: '4/3', width: '100%', fontSize: 11 }}>
              {d.placeholder}
            </div>
          )}
          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 4 }}>
                {d.date}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontStyle: 'italic', lineHeight: 1.2 }}>
                {d.title}
              </div>
            </div>
          </div>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: 22, color: 'var(--ink-soft)', lineHeight: 1.4, margin: '20px 0 0', maxWidth: '46ch' }}>
            {d.note}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)} style={{ opacity: i === 0 ? 0.35 : 1 }}>← previous</button>
        <div style={{ display: 'flex', gap: 6 }}>
          {allDoodles.map((_, n) => (
            <button key={n} onClick={() => setI(n)} aria-label={`doodle ${n + 1}`} style={{
              width: 8, height: 8, borderRadius: '50%', border: 'none',
              background: n === i ? 'var(--accent)' : 'var(--rule)',
              cursor: 'pointer', padding: 0,
            }}></button>
          ))}
        </div>
        <button className="btn" disabled={i === allDoodles.length - 1} onClick={() => setI(i + 1)} style={{ opacity: i === allDoodles.length - 1 ? 0.35 : 1 }}>next →</button>
      </div>
    </div>
  );
}

// ---------- BLOG ----------
const POSTS = [
  {
    date: 'Apr 28, 2026',
    title: 'on slow mornings',
    excerpt: 'three hundred words about not rushing, and the case for a second cup of tea.',
    minutes: 3,
    tag: 'thinking',
    body: [
      "i used to set an alarm for 6:15 and feel proud about it. now i wake up when the room is light enough to read in, and i stand by the window for a long time before i do anything else.",
      "this is not a productivity post. i don't think the morning belongs to productivity, actually. i think it belongs to looking at things — the sky, the cat, the bowl of fruit on the counter — and slowly remembering that you are a person.",
      "make the tea. let it steep too long. burn your tongue on the first sip and then forget about it for ten minutes. read one page of something. don't check your phone until after you've put on socks.",
      "the day will still be there. i promise.",
    ],
  },
  {
    date: 'Apr 21, 2026',
    title: 'a small recipe for marmalade',
    excerpt: 'we had too many lemons. now we don\'t. here is what happened in between.',
    minutes: 4,
    tag: 'cooking',
    body: [
      "you need: lemons (a lot), sugar (almost as much), water, time, a heavy pot, a clean jar, and someone to call when it sets.",
      "slice the lemons very thin. put them in the pot with the water. simmer until everything is soft and the kitchen smells like a greenhouse. add the sugar. stir. wait.",
      "the trick is the wait. it will look like syrup for a long time. then, all at once, it will be marmalade. you'll know.",
    ],
  },
  {
    date: 'Apr 14, 2026',
    title: 'the trees on my street',
    excerpt: 'i\'m trying to learn their names. so far i know two of them.',
    minutes: 2,
    tag: 'walking',
    body: [
      "there's a magnolia at the corner. i know that one because the flowers are unmistakable in march, and because the man who owns the cafe told me.",
      "there's a london plane two blocks down. i know that one because i looked it up on a website with a leaf identifier, and the leaves matched.",
      "the rest are still strangers. but every walk i learn one more thing — a bark texture, the shape of the seed pods, how the branches sit. soon, i hope, we'll all be on first-name terms.",
    ],
  },
  {
    date: 'Apr 06, 2026',
    title: 'on keeping a quiet website',
    excerpt: 'why i made this place, and what i hope it can be.',
    minutes: 3,
    tag: 'meta',
    body: [
      "the rest of the internet is loud now. i don't say that as a complaint, exactly — there's a lot of good there, still — but i wanted somewhere quiet.",
      "so this is the quiet place. no analytics. no comments (well, a guestbook, but only if you want). no infinite scroll.",
      "if you've found it, hello. i hope you stay a few minutes and leave feeling a little softer than when you came in.",
    ],
  },
  {
    date: 'Mar 30, 2026',
    title: 'the lighthouse book',
    excerpt: 'i\'m reading a book about lighthouses. it is, somehow, exactly what i needed.',
    minutes: 2,
    tag: 'reading',
    body: [
      "i picked it up at a bookshop because the cover was blue and the title was honest: 'a history of lighthouses.' that's it. that's the title.",
      "it's full of stories about people who lived alone on rocks for years and kept a small flame burning through storms. it is, i think, a good metaphor for a lot of things, but mostly it is just a nice book to read in bed.",
    ],
  },
  {
    date: 'Mar 22, 2026',
    title: 'three small joys this week',
    excerpt: 'a list, in no particular order, of things that were good.',
    minutes: 1,
    tag: 'lists',
    body: [
      "1. a peach that tasted like a peach.",
      "2. the cat that lives at the bookshop, who deigned to sit on my lap for almost ten whole minutes.",
      "3. a stranger who held the door, and another stranger who held the door for them.",
    ],
  },
];

function BlogPage({ openPost }) {
  const [extra] = useState(() => (typeof loadList === 'function' ? loadList('paperSkyExtraPosts') : []));
  const allPosts = [...extra, ...POSTS];
  return (
    <div className="page">
      <div className="section-label"><span>blog</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <h2 className="title-serif" style={{ margin: 0 }}>small posts about small things</h2>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.2em', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>
          {allPosts.length} posts · since 2026
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 22 }}>
        {allPosts.map((p, i) => <PostCard key={i} post={p} idx={i} onClick={() => openPost(i, allPosts)} />)}
      </div>
    </div>
  );
}

// full-page post view — room to breathe
function PostPage({ post, onBack }) {
  return (
    <div className="page">
      <button className="btn" onClick={onBack} style={{ marginBottom: 32 }}>← back to the blog</button>
      <article style={{ maxWidth: '68ch', margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
          {post.tag} · {post.minutes} min read
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 22 }}>
          {post.date}
        </div>
        <h1 className="title-serif" style={{ fontSize: 'clamp(34px, 5vw, 52px)', margin: '0 0 36px' }}>
          {post.title}
        </h1>
        <div style={{ fontSize: 17.5, lineHeight: 1.9, color: 'var(--ink-soft)' }}>
          {post.body.map((blk, i) => typeof blk === 'string'
            ? <p key={i} style={{ marginTop: i === 0 ? 0 : 20 }}>{blk}</p>
            : blk.type === 'image'
              ? <figure key={i} style={{ margin: '28px 0' }}>
                  <img src={blk.value} style={{ width: '100%', display: 'block', border: '1px solid var(--rule)' }} />
                  {blk.caption && <figcaption style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginTop: 8 }}>{blk.caption}</figcaption>}
                </figure>
              : <p key={i} style={{ marginTop: i === 0 ? 0 : 20 }}>{blk.value}</p>
          )}
        </div>
        {post.image && <img src={post.image} style={{ width: '100%', marginTop: 24, border: '1px solid var(--rule)' }} />}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--rule)', fontFamily: 'var(--font-hand)', fontSize: 24, color: 'var(--accent)', textAlign: 'right' }}>
          — s.
        </div>
        <div style={{ marginTop: 40 }}>
          <button className="btn accent" onClick={onBack}>← more posts</button>
        </div>
      </article>
    </div>
  );
}

function PostCard({ post, idx, onClick }) {
  const [hover, setHover] = useState(false);
  const rot = ((idx % 5) - 2) * 0.4;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#fdfaf2',
        border: '1px solid var(--rule)',
        padding: '20px 20px 22px',
        textAlign: 'left',
        cursor: 'pointer',
        color: 'inherit',
        position: 'relative',
        minHeight: 200,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        transform: hover ? `rotate(${rot}deg) translateY(-3px)` : 'rotate(0) translateY(0)',
        transition: 'transform 0.35s ease, box-shadow 0.35s ease, border-color 0.2s',
        boxShadow: hover ? '0 16px 28px -14px rgba(80, 50, 20, 0.28)' : '0 2px 0 rgba(80, 50, 20, 0.04)',
        borderColor: hover ? 'var(--accent)' : 'var(--rule)',
        fontFamily: 'inherit',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
            {post.date}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            {post.tag}
          </span>
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 22, lineHeight: 1.2, margin: '0 0 12px' }}>
          {post.title}
        </h3>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{post.excerpt}</p>
      </div>
      <div style={{ marginTop: 18, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink-faint)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
        <span>{post.minutes} min read</span>
        <span style={{ color: hover ? 'var(--accent)' : 'var(--ink-faint)', transition: 'color 0.2s' }}>open →</span>
      </div>
    </button>
  );
}

function PostModal({ post, onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="modal-bg" onClick={onClose}>
      <article className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="close">×</button>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
          {post.tag} · {post.minutes} min
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 18 }}>
          {post.date}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 38, lineHeight: 1.1, margin: '0 0 28px' }}>
          {post.title}
        </h1>
        <div style={{ fontSize: 16.5, lineHeight: 1.85, color: 'var(--ink-soft)' }}>
          {post.body.map((blk, i) => typeof blk === 'string'
            ? <p key={i} style={{ marginTop: i === 0 ? 0 : 16 }}>{blk}</p>
            : blk.type === 'image'
              ? <figure key={i} style={{ margin: '22px 0' }}>
                  <img src={blk.value} style={{ width: '100%', display: 'block', border: '1px solid var(--rule)' }} />
                  {blk.caption && <figcaption style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginTop: 6 }}>{blk.caption}</figcaption>}
                </figure>
              : <p key={i} style={{ marginTop: i === 0 ? 0 : 16 }}>{blk.value}</p>
          )}
        </div>
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--rule)', fontFamily: 'var(--font-hand)', fontSize: 22, color: 'var(--accent)', textAlign: 'right' }}>
          — s.
        </div>
      </article>
    </div>
  );
}

// ---------- BOOK LOG ----------
let BOOKS = [];

function BookLogPage() {
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(0);
  const [books, setBooks] = useState(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetch('books.json').then(r => r.json()).then(base => setBooks([...loadList('paperSkyExtraBooks'), ...base])).catch(() => setBooks(loadList('paperSkyExtraBooks')));
  }, []);

  if (!books) {
    return (
      <div className="page">
        <div className="section-label"><span>book log</span></div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>loading the ledger…</p>
      </div>
    );
  }

  const sorted = [...books];
  if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
  if (sort === 'author') sorted.sort((a, b) => a.author.localeCompare(b.author));

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const shown = sorted.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  const finished = books.filter(b => b.finished !== 'in progress').length;
  const rated = books.filter(b => b.rating > 0);
  const avg = rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : '—';

  return (
    <div className="page">
      <div className="section-label"><span>book log</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, gap: 16, flexWrap: 'wrap' }}>
        <h2 className="title-serif" style={{ margin: 0 }}>everything i've read</h2>
        <div style={{ display: 'flex', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          {[
            { k: 'recent', l: 'recent' },
            { k: 'rating', l: 'rating' },
            { k: 'author', l: 'author' },
          ].map(f => (
            <button key={f.k} onClick={() => setSort(f.k)} style={{
              background: 'none', border: 'none', cursor: 'inherit', padding: '4px 8px',
              fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit',
              color: sort === f.k ? 'var(--accent)' : 'var(--ink-faint)',
              borderBottom: sort === f.k ? '1px solid var(--accent)' : '1px solid transparent',
            }}>{f.l}</button>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 15, color: 'var(--ink-soft)', maxWidth: '52ch', margin: '0 0 36px' }}>
        a ledger of books i've finished, with the date and a small thought.
        {' '}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginLeft: 6 }}>
          {finished} finished{avg !== '—' ? ` · avg ${avg}/5` : ''}
        </span>
      </p>

      <div className="booklog">
        <div className="booklog-head">
          <span>no.</span>
          <span>title</span>
          <span>author</span>
          <span>finished</span>
          <span>rating</span>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {shown.map((b, i) => <BookRow key={b.title + i} book={b} n={clampedPage * PAGE_SIZE + i + 1} />)}
        </ul>
      </div>

      {pageCount > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 32, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
          <button onClick={() => setPage(0)} disabled={clampedPage === 0} style={{
            background: 'none', border: '1px solid var(--rule)', cursor: clampedPage === 0 ? 'default' : 'inherit',
            padding: '6px 12px', color: clampedPage === 0 ? 'var(--rule)' : 'var(--ink-soft)', fontFamily: 'inherit', fontSize: 'inherit',
          }}>« first</button>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={clampedPage === 0} style={{
            background: 'none', border: '1px solid var(--rule)', cursor: clampedPage === 0 ? 'default' : 'inherit',
            padding: '6px 12px', color: clampedPage === 0 ? 'var(--rule)' : 'var(--ink-soft)', fontFamily: 'inherit', fontSize: 'inherit',
          }}>← newer</button>
          <span>page {clampedPage + 1} of {pageCount}</span>
          <button onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={clampedPage === pageCount - 1} style={{
            background: 'none', border: '1px solid var(--rule)', cursor: clampedPage === pageCount - 1 ? 'default' : 'inherit',
            padding: '6px 12px', color: clampedPage === pageCount - 1 ? 'var(--rule)' : 'var(--ink-soft)', fontFamily: 'inherit', fontSize: 'inherit',
          }}>older →</button>
          <button onClick={() => setPage(pageCount - 1)} disabled={clampedPage === pageCount - 1} style={{
            background: 'none', border: '1px solid var(--rule)', cursor: clampedPage === pageCount - 1 ? 'default' : 'inherit',
            padding: '6px 12px', color: clampedPage === pageCount - 1 ? 'var(--rule)' : 'var(--ink-soft)', fontFamily: 'inherit', fontSize: 'inherit',
          }}>last »</button>
        </div>
      )}

      <style>{`
        .booklog { font-family: var(--font-body); }
        .booklog-head {
          display: grid;
          grid-template-columns: 40px 1fr 1fr 110px 90px;
          gap: 18px;
          padding: 0 0 10px;
          border-bottom: 1.5px solid var(--ink-soft);
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }
        @media (max-width: 700px) {
          .booklog-head { grid-template-columns: 30px 1fr 80px; }
          .booklog-head span:nth-child(3),
          .booklog-head span:nth-child(4) { display: none; }
        }
      `}</style>
    </div>
  );
}

function BookRow({ book, n }) {
  const [open, setOpen] = useState(false);
  const inProgress = book.finished === 'in progress';
  return (
    <li style={{ borderBottom: '1px solid var(--rule)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'grid',
          gridTemplateColumns: '40px 1fr 1fr 110px 90px',
          gap: 18,
          width: '100%',
          background: 'none',
          border: 'none',
          textAlign: 'left',
          padding: '14px 0',
          fontFamily: 'inherit',
          color: 'inherit',
          cursor: 'inherit',
          alignItems: 'baseline',
        }}
        className="bl-row"
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.15em' }}>
          {String(n).padStart(2, '0')}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 19, lineHeight: 1.2, color: 'var(--ink)' }}>
          {book.title}
        </span>
        <span className="bl-author" style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
          {book.author}
        </span>
        <span className="bl-finished" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: inProgress ? 'var(--accent)' : 'var(--ink-faint)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {book.finished}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--accent)', letterSpacing: '0.08em' }}>
          {book.rating > 0 ? (
            <React.Fragment>
              {'★'.repeat(book.rating)}<span style={{ color: 'var(--rule)' }}>{'★'.repeat(5 - book.rating)}</span>
            </React.Fragment>
          ) : '—'}
        </span>
      </button>
      {open && (
        <div style={{
          padding: '0 0 18px 58px',
          fontFamily: 'var(--font-hand)',
          fontSize: 19,
          color: 'var(--ink-soft)',
          lineHeight: 1.4,
          maxWidth: '60ch',
          marginTop: -4,
        }}>
          {book.note}
          <div className="bl-meta-mobile" style={{ display: 'none', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginTop: 8 }}>
            {book.author} · {book.finished}
          </div>
        </div>
      )}
      <style>{`
        .bl-row:hover .bl-author, .bl-row:hover .bl-finished { color: var(--accent); }
        @media (max-width: 700px) {
          .bl-row { grid-template-columns: 30px 1fr 80px !important; }
          .bl-row .bl-author, .bl-row .bl-finished { display: none; }
          .bl-meta-mobile { display: block !important; }
        }
      `}</style>
    </li>
  );
}

// ---------- PICTURES ----------
const PICTURES = [
  { caption: 'magnolias, finally', date: 'Apr 24', tag: 'spring', aspect: '3/4' },
  { caption: 'the kitchen window, 7am', date: 'Apr 18', tag: 'home', aspect: '4/3' },
  { caption: 'a borrowed library', date: 'Apr 11', tag: 'books', aspect: '4/5' },
  { caption: 'lemons, before', date: 'Apr 21', tag: 'cooking', aspect: '1/1' },
  { caption: 'the cat at the bookshop', date: 'Mar 22', tag: 'animals', aspect: '4/5' },
  { caption: 'rain on the window', date: 'Mar 18', tag: 'weather', aspect: '3/4' },
  { caption: 'a market peach', date: 'Mar 12', tag: 'small joys', aspect: '1/1' },
  { caption: 'morning light, kitchen', date: 'Mar 06', tag: 'home', aspect: '4/3' },
];

function PicturesPage() {
  const [extra] = useState(() => loadList('paperSkyExtraPictures'));
  const allPictures = [...extra, ...PICTURES];
  return (
    <div className="page">
      <div className="section-label"><span>pictures</span></div>
      <h2 className="title-serif">an unhurried album</h2>
      <p style={{ fontSize: 15, color: 'var(--ink-soft)', maxWidth: '54ch', margin: '0 0 36px' }}>
        photographs i've taken on the way to other things. nothing posed.
        nothing important. mostly the kitchen.
      </p>

      <div style={{ columnCount: 3, columnGap: 18 }} className="pic-cols">
        {allPictures.map((p, i) => <Picture key={i} pic={p} idx={i} />)}
      </div>
      <style>{`
        @media (max-width: 800px) { .pic-cols { column-count: 2 !important; } }
        @media (max-width: 500px) { .pic-cols { column-count: 1 !important; } }
      `}</style>
    </div>
  );
}

function Picture({ pic, idx }) {
  const [hover, setHover] = useState(false);
  const rot = (((idx * 37) % 100) - 50) / 60;
  return (
    <figure
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        margin: '0 0 22px', breakInside: 'avoid', display: 'inline-block', width: '100%',
        background: '#fdfaf2', padding: '10px 10px 8px', border: '1px solid var(--rule)',
        boxShadow: hover ? '0 14px 28px -14px rgba(80, 50, 20, 0.3)' : '0 2px 0 rgba(80,50,20,0.04)',
        transform: hover ? `rotate(${rot}deg) translateY(-2px)` : 'rotate(0)',
        transition: 'transform 0.4s, box-shadow 0.4s',
        position: 'relative',
      }}
    >
      <div className="placeholder" style={{ aspectRatio: pic.aspect, width: '100%', display: pic.image ? 'none' : 'flex' }}>
        photo · {pic.tag}
      </div>
      {pic.image && <img src={pic.image} style={{ aspectRatio: pic.aspect, width: '100%', objectFit: 'cover', display: 'block' }} />}
      <figcaption style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
        <span style={{ fontFamily: 'var(--font-hand)', fontSize: 18, textTransform: 'none', letterSpacing: 0, color: 'var(--ink-soft)' }}>
          {pic.caption}
        </span>
        <span>{pic.date}</span>
      </figcaption>
    </figure>
  );
}

// ---------- CONTACT ----------
function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [guestbook, setGuestbook] = useState([
    { name: 'mira', message: 'this is the loveliest place. i visit on rainy days.', date: 'apr 30' },
    { name: 'theo', message: 'tell me more about the marmalade. ♡', date: 'apr 22' },
    { name: 'a stranger', message: 'i found you through a friend\'s blogroll. hello!', date: 'apr 18' },
    { name: 'jun', message: 'the lighthouse book — what is it called?', date: 'apr 12' },
  ]);
  const [note, setNote] = useState({ name: '', message: '' });

  function submitForm(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'a name, even a fake one';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'an email so i can write back';
    if (form.message.trim().length < 5) errs.message = 'a message, please';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSent(true);
  }

  function submitNote(e) {
    e.preventDefault();
    if (!note.name.trim() || !note.message.trim()) return;
    setGuestbook([{ name: note.name, message: note.message, date: 'today' }, ...guestbook]);
    setNote({ name: '', message: '' });
  }

  return (
    <div className="page">
      <div className="section-label"><span>contact</span></div>
      <h2 className="title-serif">say hello</h2>
      <p style={{ fontSize: 15.5, color: 'var(--ink-soft)', maxWidth: '52ch', margin: '0 0 36px' }}>
        i love letters. send a long one, a short one, a recipe, a recommendation,
        a question. i answer everything, eventually.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56 }} className="contact-grid">
        <div>
          <div className="section-label" style={{ marginBottom: 18 }}><span>by letter</span></div>
          {sent ? (
            <div style={{ padding: '28px 24px', border: '1px dashed var(--accent)', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontFamily: 'var(--font-hand)', fontSize: 32, color: 'var(--accent)', lineHeight: 1.1 }}>thank you ♡</div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '12px 0 0' }}>i'll write back soon.</p>
              <button className="btn" style={{ marginTop: 18 }} onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }); }}>send another</button>
            </div>
          ) : (
            <form onSubmit={submitForm} style={{ display: 'grid', gap: 20 }}>
              <FormField label="your name" error={errors.name}>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="how should i address you?" />
              </FormField>
              <FormField label="your email" error={errors.email}>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="so i can write back" />
              </FormField>
              <FormField label="message" error={errors.message}>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="say anything" />
              </FormField>
              <div>
                <button type="submit" className="btn accent">send letter →</button>
              </div>
            </form>
          )}
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 18 }}><span>elsewhere</span></div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 14 }}>
            <SocialRow handle="@littlepapersky" label="instagram" note="doodles, weekly-ish" />
            <SocialRow handle="littlepapersky" label="are.na" note="things i'm collecting" />
            <SocialRow handle="@papersky" label="bluesky" note="rare and brief" />
            <SocialRow handle="hello@papersky.cafe" label="email" note="the slow way, my favorite" />
          </ul>

          <div style={{ marginTop: 36, padding: '20px 22px', background: 'var(--paper-deep)', border: '1px solid var(--rule)', position: 'relative', transform: 'rotate(-0.7deg)' }}>
            <div className="tape" style={{ top: -10, right: 24 }}></div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
              a small note
            </div>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: 20, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.4 }}>
              i'm slow to reply but i do reply. promise.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) { .contact-grid { grid-template-columns: 1fr !important; gap: 48px !important; } }
      `}</style>

      <div className="aster">∿</div>

      <section>
        <div className="section-label"><span>guestbook</span></div>
        <p style={{ fontSize: 15, color: 'var(--ink-soft)', maxWidth: '52ch', margin: '0 0 24px' }}>
          leave a small note. say hi. nothing is moderated except by kindness.
        </p>

        <form onSubmit={submitNote} style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: 14, marginBottom: 32, alignItems: 'end' }} className="gb-form">
          <FormField label="from"><input type="text" value={note.name} onChange={e => setNote({ ...note, name: e.target.value })} placeholder="your name" /></FormField>
          <FormField label="note"><input type="text" value={note.message} onChange={e => setNote({ ...note, message: e.target.value })} placeholder="hello, sahana —" /></FormField>
          <button type="submit" className="btn accent" disabled={!note.name.trim() || !note.message.trim()} style={{ opacity: (!note.name.trim() || !note.message.trim()) ? 0.4 : 1 }}>sign →</button>
        </form>
        <style>{`@media (max-width: 600px) { .gb-form { grid-template-columns: 1fr !important; } }`}</style>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 18 }}>
          {guestbook.map((g, i) => (
            <li key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px', gap: 18, alignItems: 'baseline', paddingBottom: 18, borderBottom: '1px solid var(--rule)' }}>
              <span style={{ fontFamily: 'var(--font-hand)', fontSize: 22, color: 'var(--accent)', lineHeight: 1 }}>{g.name}</span>
              <span style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{g.message}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-faint)', textAlign: 'right' }}>{g.date}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label>{label}</label>
      {children}
      {error && <div style={{ fontFamily: 'var(--font-hand)', fontSize: 16, color: 'var(--accent)', marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function SocialRow({ handle, label, note }) {
  const [hover, setHover] = useState(false);
  return (
    <li
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid', gridTemplateColumns: '90px 1fr', gap: 16, alignItems: 'baseline',
        paddingBottom: 14, borderBottom: '1px solid var(--rule)', cursor: 'pointer',
        transition: 'transform 0.2s',
        transform: hover ? 'translateX(4px)' : 'translateX(0)',
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: hover ? 'var(--accent)' : 'var(--ink-faint)', transition: 'color 0.2s' }}>
        {label}
      </span>
      <div>
        <div style={{ fontSize: 15.5, color: 'var(--ink)' }}>{handle}</div>
        <div style={{ fontFamily: 'var(--font-hand)', fontSize: 16, color: 'var(--ink-soft)', marginTop: 2 }}>{note}</div>
      </div>
    </li>
  );
}

Object.assign(window, {
  HomePage, AboutPage, DoodlesPage, BlogPage, PostPage, POSTS, BookLogPage, PicturesPage, ContactPage,
});
