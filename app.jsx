// App shell — router + masthead + nav + currently widget + tweaks

const { useState: useStateApp, useEffect: useEffectApp } = React;

const PALETTES = /*EDITMODE-BEGIN*/{
  "siteName": "my little paper sky",
  "tagline": "sahana hypatia kannan",
  "palette": "rosewine",
  "fontBody": "typewriter",
  "fontDisplay": "garamond",
  "density": "compact",
  "textureOpacity": 1,
  "trail": true,
  "currentlyWidget": true
}/*EDITMODE-END*/;

const PALETTE_DEFS = {
  sunset:   { paper: '#fff8f0', deep: '#f6ebd9', ink: '#2a2a2a', inkSoft: '#4a4137', inkFaint: '#8a7e6d', rule: '#d8cab2', accent: '#d96650', accentSoft: '#e89a82', gold: '#e0a84a', tape: 'rgba(217, 102, 80, 0.18)', trail: 'rgba(217, 102, 80, 0.55)' },
  sage:     { paper: '#f4f1e8', deep: '#e8e2d2', ink: '#2a3328', inkSoft: '#4a5544', inkFaint: '#8a9080', rule: '#c8ccbc', accent: '#7a8a6a', accentSoft: '#a3b090', gold: '#c0a868', tape: 'rgba(122, 138, 106, 0.18)', trail: 'rgba(122, 138, 106, 0.55)' },
  bluemilk: { paper: '#f5f3ec', deep: '#e6e3d8', ink: '#1f2730', inkSoft: '#3d4651', inkFaint: '#7c8694', rule: '#cbd0d6', accent: '#5b7896', accentSoft: '#8ea4bb', gold: '#c8a060', tape: 'rgba(91, 120, 150, 0.18)', trail: 'rgba(91, 120, 150, 0.55)' },
  rosewine: { paper: '#fbf2ee', deep: '#f0dfd6', ink: '#2c1d1f', inkSoft: '#4d3236', inkFaint: '#9a7c80', rule: '#dcc8c4', accent: '#b07682', accentSoft: '#c89aa3', gold: '#cc8b50', tape: 'rgba(176, 118, 130, 0.14)', trail: 'rgba(176, 118, 130, 0.4)' },
  ink:      { paper: '#efeae0', deep: '#e0d9c8', ink: '#1a1a1a', inkSoft: '#3a3530', inkFaint: '#7a7268', rule: '#bdb6a6', accent: '#3a3a3a', accentSoft: '#7a7268', gold: '#9a8a6a', tape: 'rgba(60, 60, 60, 0.16)', trail: 'rgba(40, 40, 40, 0.55)' },
};

const FONT_BODY = {
  typewriter: "'Special Elite', 'JetBrains Mono', monospace",
  mono:       "'JetBrains Mono', ui-monospace, monospace",
  serif:      "'EB Garamond', Georgia, serif",
};
const FONT_DISPLAY = {
  garamond: "'Cormorant Garamond', Georgia, serif",
  fraunces: "'Fraunces', Georgia, serif",
  ebgar:    "'EB Garamond', Georgia, serif",
};

const DENSITY_SCALE = { compact: 0.86, comfortable: 1, airy: 1.15 };

function useTheme(t) {
  useEffectApp(() => {
    const p = PALETTE_DEFS[t.palette] || PALETTE_DEFS.sunset;
    const r = document.documentElement.style;
    r.setProperty('--paper', p.paper);
    r.setProperty('--paper-deep', p.deep);
    r.setProperty('--ink', p.ink);
    r.setProperty('--ink-soft', p.inkSoft);
    r.setProperty('--ink-faint', p.inkFaint);
    r.setProperty('--rule', p.rule);
    r.setProperty('--accent', p.accent);
    r.setProperty('--accent-soft', p.accentSoft);
    r.setProperty('--gold', p.gold);
    r.setProperty('--tape', p.tape);

    r.setProperty('--font-body', FONT_BODY[t.fontBody] || FONT_BODY.typewriter);
    r.setProperty('--font-display', FONT_DISPLAY[t.fontDisplay] || FONT_DISPLAY.garamond);

    r.setProperty('--density', DENSITY_SCALE[t.density] || 1);
    r.setProperty('--texture-opacity', String(t.textureOpacity));

    if (window.__setTrailEnabled) window.__setTrailEnabled(!!t.trail);
    if (window.__setTrailColor) window.__setTrailColor(p.trail);
  }, [t.palette, t.fontBody, t.fontDisplay, t.density, t.textureOpacity, t.trail]);
}

const PAGES = [
  { id: 'home',     label: 'home' },
  { id: 'about',    label: 'about' },
  { id: 'doodles',  label: 'doodles' },
  { id: 'blog',     label: 'blog' },
  { id: 'reviews',  label: 'book log' },
  { id: 'pictures', label: 'pictures' },
  { id: 'contact',  label: 'contact' },
];

function App() {
  const [page, setPage] = useStateApp('home');
  const [postIdx, setPostIdx] = useStateApp(null);
  const [tweaks, setTweak] = useTweaks(PALETTES);
  useTheme(tweaks);

  useEffectApp(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, postIdx]);

  function go(p) { setPostIdx(null); setPage(p); }
  function openPost(i, list) { setPostIdx({ i, list }); }
  function closePost() { setPostIdx(null); }

  let pageEl;
  switch (page) {
    case 'home':     pageEl = <HomePage go={go} siteName={tweaks.siteName} tagline={tweaks.tagline} />; break;
    case 'about':    pageEl = <AboutPage />; break;
    case 'doodles':  pageEl = <DoodlesPage />; break;
    case 'blog':     pageEl = postIdx !== null
      ? <PostPage post={postIdx.list[postIdx.i]} onBack={closePost} />
      : <BlogPage openPost={openPost} />; break;
    case 'reviews':  pageEl = <BookLogPage />; break;
    case 'pictures': pageEl = <PicturesPage />; break;
    case 'contact':  pageEl = <ContactPage />; break;
    default:         pageEl = <HomePage go={go} />;
  }

  const screenLabel = PAGES.find(p => p.id === page)?.label || page;

  return (
    <React.Fragment>
      <div className="app" data-screen-label={screenLabel}>
        <header className="masthead">
          <span className="stamp">est. 2026 · no. 01</span>
          <h1 onClick={() => go('home')} style={{ cursor: 'pointer' }}>{tweaks.siteName}</h1>
          <p className="tagline">— {tweaks.tagline} —</p>
        </header>
        <nav className="nav">
          {PAGES.map(p => (
            <button key={p.id} className={page === p.id ? 'active' : ''} onClick={() => go(p.id)}>
              {p.label}
            </button>
          ))}
        </nav>
        {pageEl}
        <footer>
          <span>© 2026 · made with care</span>
          <span>{screenLabel} · {(new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()}</span>
        </footer>
      </div>

      {tweaks.currentlyWidget && <CurrentlyWidget />}

      <PaperSkyTweaks tweaks={tweaks} setTweak={setTweak} />
    </React.Fragment>
  );
}

function CurrentlyWidget() {
  const c = useSiteContent();
  return (
    <aside className="currently">
      <h4>currently</h4>
      <div className="row"><span className="key">reading</span><span className="val">{c.currentlyReading}</span></div>
      <div className="row"><span className="key">drawing</span><span className="val">{c.currentlyDrawing}</span></div>
      <div className="row"><span className="key">listening</span><span className="val">{c.currentlyListening}</span></div>
      <div className="row"><span className="key">watching</span><span className="val">{c.currentlyWatching}</span></div>
      <div className="row"><span className="key">learning</span><span className="val">{c.currentlyLearning}</span></div>
    </aside>
  );
}

function PaperSkyTweaks({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Identity">
        <TweakText label="Site name" value={tweaks.siteName} onChange={v => setTweak('siteName', v)} />
        <TweakText label="Tagline" value={tweaks.tagline} onChange={v => setTweak('tagline', v)} />
      </TweakSection>

      <TweakSection label="Palette">
        <TweakRadio
          value={tweaks.palette}
          onChange={v => setTweak('palette', v)}
          options={[
            { value: 'sunset',   label: 'sunset' },
            { value: 'sage',     label: 'sage' },
            { value: 'bluemilk', label: 'blue milk' },
            { value: 'rosewine', label: 'rose' },
            { value: 'ink',      label: 'ink' },
          ]}
        />
      </TweakSection>

      <TweakSection label="Type">
        <TweakSelect
          label="Body"
          value={tweaks.fontBody}
          onChange={v => setTweak('fontBody', v)}
          options={[
            { value: 'typewriter', label: 'Typewriter (Special Elite)' },
            { value: 'mono',       label: 'Monospace (JetBrains Mono)' },
            { value: 'serif',      label: 'Serif (EB Garamond)' },
          ]}
        />
        <TweakSelect
          label="Display"
          value={tweaks.fontDisplay}
          onChange={v => setTweak('fontDisplay', v)}
          options={[
            { value: 'garamond', label: 'Cormorant Garamond italic' },
            { value: 'fraunces', label: 'Fraunces' },
            { value: 'ebgar',    label: 'EB Garamond' },
          ]}
        />
      </TweakSection>

      <TweakSection label="Layout">
        <TweakRadio
          label="Density"
          value={tweaks.density}
          onChange={v => setTweak('density', v)}
          options={[
            { value: 'compact',     label: 'compact' },
            { value: 'comfortable', label: 'comfortable' },
            { value: 'airy',        label: 'airy' },
          ]}
        />
      </TweakSection>

      <TweakSection label="Atmosphere">
        <TweakSlider label="Paper texture" min={0} max={1} step={0.05} value={tweaks.textureOpacity} onChange={v => setTweak('textureOpacity', v)} />
        <TweakToggle label="Cursor ink trail" value={tweaks.trail} onChange={v => setTweak('trail', v)} />
        <TweakToggle label="'Currently' widget" value={tweaks.currentlyWidget} onChange={v => setTweak('currentlyWidget', v)} />
      </TweakSection>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
window.__paperSkyAppLoaded = true;
