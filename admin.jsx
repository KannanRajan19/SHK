// Admin: hidden login + content dashboard (prototype only — real auth belongs in the production CMS)
const { useState: useStateAdmin, useEffect: useEffectAdmin } = React;

const SITE_CONTENT_KEY = 'paperSkySiteContent';
const ADMIN_SESSION_KEY = 'paperSkyAdminSession';
const ADMIN_PASSWORD = 'paperbird'; // prototype only — real deploys use the CMS login instead
const EXTRA_POSTS_KEY = 'paperSkyExtraPosts';
const EXTRA_DOODLES_KEY = 'paperSkyExtraDoodles';
const EXTRA_PICTURES_KEY = 'paperSkyExtraPictures';
const EXTRA_BOOKS_KEY = 'paperSkyExtraBooks';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const DEFAULT_CONTENT = {
  homeIntro1: "welcome to my tiny corner of the internet! i share pics and drawings, keep a count of books i've read, and share simple blogs about small thoughts that come to me, whether it's books or movies i've read or watched recently, random moments that sparked intriguing memories, or just how my day has been.",
  homeIntro2: "there's no schedule, there's no algorithm. i hope you enjoy the simplicity of it and look around! :)",
  aboutBio1: "hiiii!!!! i'm sahana. i'm in my early teens, and i'm excited to get to show you around my world!",
  aboutBio2: "i started this site because the rest of internet feels very loud and sucks you into a world that you don't necessarily want to be in. this is a small place to just hear some fun or meaningful thoughts. i'm not the kind to post in rhythm, like every saturday, but i hope it will still connect with you.",
  aboutBio3: "a little bit about myself is that i'm a very bubbly person. i love reading books and watching anime. i like crafting, i play the harp, and overall have a ton of random hobbies i am not the best at whatsoever, but i guess i like trying new things. a few things i lovee include heartstopper, spiderverse, epic, yuri on ice, and so much more!",
  aboutBio4: "anyways, im so happy you took the time to come look at my little website! thank you for being here ♡",
  currentlyReading: 'game changer',
  currentlyDrawing: 'simple kimetsu no yaiba doodles',
  currentlyListening: 'electric love, over and over again',
  currentlyWatching: "heartstopper, which i'm in love with",
  currentlyLearning: 'how to play on love: eros for my harp',
};

function loadSiteContent() {
  try {
    const raw = localStorage.getItem(SITE_CONTENT_KEY);
    return raw ? { ...DEFAULT_CONTENT, ...JSON.parse(raw) } : { ...DEFAULT_CONTENT };
  } catch (e) { return { ...DEFAULT_CONTENT }; }
}

function useSiteContent() {
  const [content, setContent] = useStateAdmin(loadSiteContent());
  useEffectAdmin(() => {
    function onStorage(e) { if (e.key === SITE_CONTENT_KEY) setContent(loadSiteContent()); }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return content;
}

function AdminApp() {
  const [authed, setAuthed] = useStateAdmin(sessionStorage.getItem(ADMIN_SESSION_KEY) === '1');
  return authed ? <AdminDashboard onLogout={() => { sessionStorage.removeItem(ADMIN_SESSION_KEY); setAuthed(false); }} /> : <AdminLogin onSuccess={() => { sessionStorage.setItem(ADMIN_SESSION_KEY, '1'); setAuthed(true); }} />;
}

function AdminLogin({ onSuccess }) {
  const [pw, setPw] = useStateAdmin('');
  const [error, setError] = useStateAdmin('');
  function submit(e) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) onSuccess();
    else setError('wrong password, try again');
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <form onSubmit={submit} style={{ background: 'var(--paper-deep)', border: '1px solid var(--rule)', padding: '40px 36px', maxWidth: 340, width: '100%' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>admin</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 30, margin: '0 0 22px', color: 'var(--ink)' }}>my little paper sky</h1>
        <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 }}>password</label>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} autoFocus style={{
          width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)', fontSize: 16, padding: '10px 4px',
          border: 'none', borderBottom: '1px solid var(--rule)', background: 'transparent', color: 'var(--ink)', outline: 'none', marginBottom: 18,
        }} />
        {error && <div style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <button type="submit" className="btn accent" style={{ width: '100%' }}>log in</button>
      </form>
    </div>
  );
}

function ImageDrop({ value, onChange, label }) {
  async function onFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    onChange(await fileToDataUrl(f));
  }
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 }}>{label}</label>
      {value && <img src={value} style={{ maxWidth: 160, display: 'block', marginBottom: 8, border: '1px solid var(--rule)' }} />}
      <input type="file" accept="image/*" onChange={onFile} style={{ fontFamily: 'var(--font-body)', fontSize: 13 }} />
    </div>
  );
}

function NewPostForm() {
  const [title, setTitle] = useStateAdmin('');
  const [tag, setTag] = useStateAdmin('');
  const [blocks, setBlocks] = useStateAdmin([{ type: 'text', value: '' }]);
  const [saved, setSaved] = useStateAdmin(false);

  function setBlock(i, patch) { setBlocks(bs => bs.map((b, n) => n === i ? { ...b, ...patch } : b)); }
  function addBlock(type) { setBlocks(bs => [...bs, type === 'text' ? { type: 'text', value: '' } : { type: 'image', value: null, caption: '' }]); }
  function removeBlock(i) { setBlocks(bs => bs.filter((_, n) => n !== i)); }
  function move(i, dir) {
    setBlocks(bs => {
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const copy = [...bs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  function add() {
    const clean = blocks.filter(b => b.type === 'text' ? b.value.trim() : b.value);
    if (!title.trim() || !clean.length) return;
    const words = clean.filter(b => b.type === 'text').map(b => b.value).join(' ').split(/\s+/).length;
    const list = loadList(EXTRA_POSTS_KEY);
    list.unshift({
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      title, tag: tag || 'notes', minutes: Math.max(1, Math.round(words / 200)),
      body: clean,
    });
    saveList(EXTRA_POSTS_KEY, list);
    setTitle(''); setTag(''); setBlocks([{ type: 'text', value: '' }]);
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  }

  const inputStyle = { width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)', fontSize: 15, padding: '9px 10px', border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)' };
  const labelStyle = { display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 };
  const chipStyle = { fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'none', border: '1px solid var(--rule)', color: 'var(--ink-soft)', padding: '3px 7px', cursor: 'pointer' };

  async function pickImage(i, e) {
    const f = e.target.files[0];
    if (!f) return;
    setBlock(i, { value: await fileToDataUrl(f) });
  }

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>tag (optional)</label>
        <input value={tag} onChange={e => setTag(e.target.value)} style={inputStyle} />
      </div>

      <label style={labelStyle}>the post — stack paragraphs and pictures in any order</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        {blocks.map((b, i) => (
          <div key={i} style={{ border: '1px solid var(--rule)', background: 'var(--paper)', padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                {b.type === 'text' ? `¶ paragraph` : '▣ picture'}
              </span>
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                <button onClick={() => move(i, -1)} disabled={i === 0} style={{ ...chipStyle, opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} style={{ ...chipStyle, opacity: i === blocks.length - 1 ? 0.3 : 1 }}>↓</button>
                <button onClick={() => removeBlock(i)} style={chipStyle}>remove</button>
              </div>
            </div>
            {b.type === 'text' ? (
              <textarea value={b.value} onChange={e => setBlock(i, { value: e.target.value })} rows={4} placeholder="write a paragraph…" style={{ ...inputStyle, lineHeight: 1.6, resize: 'vertical' }} />
            ) : (
              <div>
                {b.value && <img src={b.value} style={{ maxWidth: 180, display: 'block', marginBottom: 8, border: '1px solid var(--rule)' }} />}
                <input type="file" accept="image/*" onChange={e => pickImage(i, e)} style={{ fontFamily: 'var(--font-body)', fontSize: 13, marginBottom: 8 }} />
                <input value={b.caption || ''} onChange={e => setBlock(i, { caption: e.target.value })} placeholder="caption (optional)" style={inputStyle} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button onClick={() => addBlock('text')} style={chipStyle}>+ paragraph</button>
        <button onClick={() => addBlock('image')} style={chipStyle}>+ picture</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="btn accent" onClick={add}>publish post</button>
        {saved && <span style={{ fontFamily: 'var(--font-hand)', fontSize: 20, color: 'var(--accent)' }}>posted ✓</span>}
      </div>
    </div>
  );
}

function NewDoodleForm() {
  const [title, setTitle] = useStateAdmin('');
  const [note, setNote] = useStateAdmin('');
  const [image, setImage] = useStateAdmin(null);
  const [saved, setSaved] = useStateAdmin(false);
  function add() {
    if (!title.trim()) return;
    const list = loadList(EXTRA_DOODLES_KEY);
    list.unshift({ date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }), title, note, image });
    saveList(EXTRA_DOODLES_KEY, list);
    setTitle(''); setNote(''); setImage(null);
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  }
  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 }}>title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)', fontSize: 15, padding: '9px 10px', border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)' }} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 }}>caption</label>
        <input value={note} onChange={e => setNote(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)', fontSize: 15, padding: '9px 10px', border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)' }} />
      </div>
      <ImageDrop value={image} onChange={setImage} label="doodle scan" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
        <button className="btn accent" onClick={add}>add doodle</button>
        {saved && <span style={{ fontFamily: 'var(--font-hand)', fontSize: 20, color: 'var(--accent)' }}>added ✓</span>}
      </div>
    </div>
  );
}

function NewPictureForm() {
  const [caption, setCaption] = useStateAdmin('');
  const [tag, setTag] = useStateAdmin('');
  const [image, setImage] = useStateAdmin(null);
  const [saved, setSaved] = useStateAdmin(false);
  function add() {
    if (!caption.trim()) return;
    const list = loadList(EXTRA_PICTURES_KEY);
    list.unshift({ caption, date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }), tag: tag || 'misc', aspect: '4/3', image });
    saveList(EXTRA_PICTURES_KEY, list);
    setCaption(''); setTag(''); setImage(null);
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  }
  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 }}>caption</label>
        <input value={caption} onChange={e => setCaption(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)', fontSize: 15, padding: '9px 10px', border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)' }} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 }}>tag (optional)</label>
        <input value={tag} onChange={e => setTag(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)', fontSize: 15, padding: '9px 10px', border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)' }} />
      </div>
      <ImageDrop value={image} onChange={setImage} label="photo" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
        <button className="btn accent" onClick={add}>add picture</button>
        {saved && <span style={{ fontFamily: 'var(--font-hand)', fontSize: 20, color: 'var(--accent)' }}>added ✓</span>}
      </div>
    </div>
  );
}

function NewBookForm() {
  const [title, setTitle] = useStateAdmin('');
  const [author, setAuthor] = useStateAdmin('');
  const [finished, setFinished] = useStateAdmin('');
  const [rating, setRating] = useStateAdmin(0);
  const [note, setNote] = useStateAdmin('');
  const [saved, setSaved] = useStateAdmin(false);
  function add() {
    if (!title.trim()) return;
    const list = loadList(EXTRA_BOOKS_KEY);
    list.unshift({ title: title.toLowerCase(), author: author.toLowerCase(), finished: finished || 'in progress', rating: Number(rating) || 0, note: note.toLowerCase() });
    saveList(EXTRA_BOOKS_KEY, list);
    setTitle(''); setAuthor(''); setFinished(''); setRating(0); setNote('');
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  }
  const inputStyle = { width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)', fontSize: 15, padding: '9px 10px', border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)' };
  const labelStyle = { display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 };
  return (
    <div>
      <div style={{ marginBottom: 10 }}><label style={labelStyle}>title</label><input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 10 }}><label style={labelStyle}>author</label><input value={author} onChange={e => setAuthor(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 10 }}><label style={labelStyle}>finished (e.g. Aug 2026, or leave blank for "in progress")</label><input value={finished} onChange={e => setFinished(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 10 }}><label style={labelStyle}>rating (0–5)</label><input type="number" min="0" max="5" value={rating} onChange={e => setRating(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 10 }}><label style={labelStyle}>note (optional)</label><textarea value={note} onChange={e => setNote(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
        <button className="btn accent" onClick={add}>add to book log</button>
        {saved && <span style={{ fontFamily: 'var(--font-hand)', fontSize: 20, color: 'var(--accent)' }}>added ✓</span>}
      </div>
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const [content, setContent] = useStateAdmin(loadSiteContent());
  const [saved, setSaved] = useStateAdmin(false);

  function set(key, value) { setContent(c => ({ ...c, [key]: value })); }
  function save() {
    localStorage.setItem(SITE_CONTENT_KEY, JSON.stringify(content));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  const field = (key, label, big) => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 }}>{label}</label>
      {big ? (
        <textarea value={content[key]} onChange={e => set(key, e.target.value)} rows={4} style={{
          width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.6, padding: 10,
          border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)', resize: 'vertical',
        }} />
      ) : (
        <input value={content[key]} onChange={e => set(key, e.target.value)} style={{
          width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)', fontSize: 15, padding: '9px 10px',
          border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)',
        }} />
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '56px 24px 100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 30 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 34, margin: 0, color: 'var(--ink)' }}>edit site</h1>
        <button className="btn" onClick={onLogout}>log out</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 16px' }}>home page</h2>
      {field('homeIntro1', 'intro paragraph 1', true)}
      {field('homeIntro2', 'intro paragraph 2', true)}

      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', margin: '32px 0 16px' }}>about bio</h2>
      {field('aboutBio1', 'paragraph 1', true)}
      {field('aboutBio2', 'paragraph 2', true)}
      {field('aboutBio3', 'paragraph 3', true)}
      {field('aboutBio4', 'closing line', true)}

      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', margin: '32px 0 16px' }}>currently widget</h2>
      {field('currentlyReading', 'reading')}
      {field('currentlyDrawing', 'drawing')}
      {field('currentlyListening', 'listening')}
      {field('currentlyWatching', 'watching')}
      {field('currentlyLearning', 'learning')}

      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', margin: '32px 0 16px' }}>write a new blog post</h2>
      <NewPostForm />

      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', margin: '32px 0 16px' }}>add a doodle</h2>
      <NewDoodleForm />

      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', margin: '32px 0 16px' }}>add a picture</h2>
      <NewPictureForm />

      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', margin: '32px 0 16px' }}>add a book</h2>
      <NewBookForm />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 32 }}>
        <button className="btn accent" onClick={save}>save changes</button>
        {saved && <span style={{ fontFamily: 'var(--font-hand)', fontSize: 20, color: 'var(--accent)' }}>saved ✓</span>}
        <a href="/" style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>view site →</a>
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 28, lineHeight: 1.6 }}>
        this prototype saves to your browser only, for previewing. the real site (built by Claude Code, per the handoff) will save changes for everyone through a proper login.
      </p>
    </div>
  );
}

Object.assign(window, { AdminApp, useSiteContent });
if (!window.__paperSkyAppLoaded) ReactDOM.createRoot(document.getElementById('root')).render(<AdminApp />);
