/*
 * In-place editing for the site owner.
 *
 * This file is only ever fetched when the ps_editor marker cookie is present,
 * so ordinary visitors never download it and the public pages carry no sign of
 * it. The marker grants nothing on its own -- every action below goes through
 * /api/publish, which requires the signed HttpOnly session cookie. A forged
 * marker gets a UI that cannot save anything.
 *
 * Elements opt in with data-edit="<kind>" plus data-edit-id and the fields
 * they expose, which read as ordinary data attributes to anyone else.
 */
(async function initEditor() {
  const ok = await fetch('/api/session')
    .then((r) => r.json())
    .then((d) => d.ok)
    .catch(() => false);
  if (!ok) return;

  if (document.querySelector('[data-edit]') === null) return;

  // ---------- chrome ----------
  /*
   * Being signed in and being in edit mode are deliberately different states.
   * A session lasts hours, and most of that time the owner is just reading her
   * own site -- showing edit buttons on every page the whole time means anyone
   * glancing at her screen sees them. Editing is something she turns on.
   *
   * The choice lives in sessionStorage, so it lasts the tab and resets when
   * she closes it. Nothing here is a permission: the controls are cosmetic
   * and every write is still checked by the server.
   */
  const EDIT_KEY = 'ps_editing';
  let editing = (() => {
    try {
      return sessionStorage.getItem(EDIT_KEY) === '1';
    } catch {
      return false; // private browsing can throw on access
    }
  })();

  const bar = document.createElement('div');
  bar.className = 'ed-bar';
  bar.innerHTML = `
    <span class="ed-who">signed in as sahana</span>
    <span class="ed-msg" data-ed-msg></span>
    <button class="ed-btn" data-ed-toggle></button>
    <a class="ed-btn" href="/admin">admin</a>
    <button class="ed-btn" data-ed-logout>log out</button>`;
  document.body.appendChild(bar);

  const toggle = bar.querySelector('[data-ed-toggle]');

  function applyEditing() {
    document.body.classList.toggle('ed-on', editing);
    toggle.textContent = editing ? 'stop editing' : 'start editing';
    bar.classList.toggle('ed-active', editing);
    if (!editing) {
      // Leaving edit mode should not leave a half-finished form behind.
      document.querySelectorAll('.ed-form, .ed-confirm').forEach((n) => n.remove());
    }
  }

  toggle.addEventListener('click', () => {
    editing = !editing;
    try {
      sessionStorage.setItem(EDIT_KEY, editing ? '1' : '0');
    } catch {
      /* not worth failing over */
    }
    applyEditing();
  });

  const msg = bar.querySelector('[data-ed-msg]');
  const say = (text, kind = '') => {
    msg.textContent = text;
    msg.className = `ed-msg ${kind}`;
  };

  bar.querySelector('[data-ed-logout]').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' }).catch(() => {});
    location.reload();
  });

  // ---------- helpers ----------
  /*
   * Form fields are built with DOM APIs and their values assigned as
   * properties, never interpolated into innerHTML. Content here is the owner's
   * own, but a value is data and should never be parsed as markup.
   */
  function field(spec, value) {
    const label = document.createElement('label');
    label.append(document.createTextNode(spec.label));
    const input =
      spec.type === 'textarea'
        ? document.createElement('textarea')
        : document.createElement('input');
    if (spec.type !== 'textarea') input.type = spec.type;
    input.dataset.k = spec.key;
    input.value = value ?? '';
    label.appendChild(input);
    return label;
  }

  async function publish(payload, label) {
    say('saving… this takes a minute or two');
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) throw new Error(body.error ?? 'could not save');
    say(`${label} saved. the site updates in a minute or two.`, 'ok');
  }

  /* Fields each kind exposes, in the order they should appear. */
  const FIELDS = {
    doodle: [
      { key: 'title', label: 'title', type: 'text' },
      { key: 'note', label: 'caption', type: 'textarea' },
    ],
    picture: [
      { key: 'caption', label: 'caption', type: 'text' },
      { key: 'tag', label: 'tag', type: 'text' },
    ],
    post: [
      { key: 'title', label: 'title', type: 'text' },
      { key: 'tag', label: 'tag', type: 'text' },
    ],
    book: [
      { key: 'title', label: 'title', type: 'text' },
      { key: 'author', label: 'author', type: 'text' },
      { key: 'finished', label: 'finished (blank = still reading)', type: 'text' },
      { key: 'rating', label: 'rating 0-5', type: 'number' },
      { key: 'note', label: 'note', type: 'textarea' },
    ],
  };

  const CONTENT_PATH = {
    doodle: (id) => `content/doodles/${id}.json`,
    picture: (id) => `content/pictures/${id}.json`,
    post: (id) => `content/posts/${id}.json`,
  };

  function readValues(el, kind) {
    const values = {};
    for (const f of FIELDS[kind]) values[f.key] = el.dataset[`edit${cap(f.key)}`] ?? '';
    return values;
  }

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ---------- per-item controls ----------
  /*
   * Re-runnable. The book log re-renders its rows on every sort or page
   * change, discarding the controls with them, so it announces the fact and
   * this attaches to whatever is on screen now. Already-decorated elements are
   * skipped so repeat calls are harmless.
   */
  function attachControls() {
    document.querySelectorAll('[data-edit]').forEach(decorate);
  }

  function decorate(el) {
    if (el.classList.contains('ed-target')) return;
    const kind = el.dataset.edit;
    if (!FIELDS[kind]) return;

    const controls = document.createElement('div');
    controls.className = 'ed-controls';
    controls.innerHTML = `
      <button class="ed-pill" data-ed-edit>edit</button>
      <button class="ed-pill ed-danger" data-ed-del>remove</button>`;
    el.classList.add('ed-target');
    el.appendChild(controls);

    controls.querySelector('[data-ed-edit]').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openEditor(el, kind);
    });

    controls.querySelector('[data-ed-del]').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      confirmDelete(el, kind, controls);
    });
  }

  attachControls();
  window.addEventListener('ps:rows-rendered', attachControls);
  applyEditing();

  // ---------- delete ----------
  function confirmDelete(el, kind, controls) {
    if (controls.querySelector('[data-ed-yes]')) return;
    const ask = document.createElement('span');
    ask.className = 'ed-confirm';
    ask.innerHTML = `remove?
      <button class="ed-pill ed-danger" data-ed-yes>yes</button>
      <button class="ed-pill" data-ed-no>cancel</button>`;
    controls.appendChild(ask);

    ask.querySelector('[data-ed-no]').addEventListener('click', (e) => {
      e.preventDefault();
      ask.remove();
    });

    ask.querySelector('[data-ed-yes]').addEventListener('click', async (e) => {
      e.preventDefault();
      ask.remove();
      const id = el.dataset.editId;
      const title = el.dataset.editTitle || el.dataset.editCaption || 'entry';
      try {
        if (kind === 'book') {
          await publish(
            {
              books: { remove: { title: el.dataset.editTitle, author: el.dataset.editAuthor } },
              message: `content: remove book "${title}"`,
            },
            'book'
          );
        } else {
          const deletes = [CONTENT_PATH[kind](id)];
          const images = (el.dataset.editImages || '').split(',').filter(Boolean);
          for (const img of images) deletes.push(`public${img}`);
          await publish({ deletes, message: `content: remove ${kind} "${title}"` }, kind);
        }
        el.style.opacity = '0.35';
        el.querySelectorAll('.ed-pill').forEach((b) => (b.disabled = true));
      } catch (err) {
        say(err.message, 'bad');
      }
    });
  }

  // ---------- edit ----------
  function openEditor(el, kind) {
    if (el.querySelector('.ed-form')) return;
    const values = readValues(el, kind);

    const form = document.createElement('form');
    form.className = 'ed-form';
    for (const spec of FIELDS[kind]) form.appendChild(field(spec, values[spec.key]));

    const row = document.createElement('div');
    row.className = 'ed-row';
    row.innerHTML =
      '<button class="ed-pill ed-save" type="submit">save</button>' +
      '<button class="ed-pill" type="button" data-ed-cancel>cancel</button>';
    form.appendChild(row);
    el.appendChild(form);

    form.querySelector('[data-ed-cancel]').addEventListener('click', () => form.remove());

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const next = {};
      form.querySelectorAll('[data-k]').forEach((i) => (next[i.dataset.k] = i.value));

      try {
        if (kind === 'book') {
          await publish(
            {
              books: {
                update: {
                  match: { title: el.dataset.editTitle, author: el.dataset.editAuthor },
                  values: { ...next, rating: Number(next.rating) || 0 },
                },
              },
              message: `content: edit book "${next.title}"`,
            },
            'book'
          );
        } else {
          const id = el.dataset.editId;
          await publish(
            {
              patches: [{ path: CONTENT_PATH[kind](id), values: next }],
              message: `content: edit ${kind} "${next.title ?? next.caption}"`,
            },
            kind
          );
        }
        // Reflect the change immediately; the rebuild makes it permanent.
        for (const [k, v] of Object.entries(next)) el.dataset[`edit${cap(k)}`] = v;
        applyToDom(el, kind, next);
        form.remove();
      } catch (err) {
        say(err.message, 'bad');
      }
    });
  }

  /** Update the visible text so the page matches what was just saved. */
  function applyToDom(el, kind, values) {
    for (const [key, value] of Object.entries(values)) {
      const slot = el.querySelector(`[data-edit-slot="${key}"]`);
      if (slot) slot.textContent = value;
    }
    if (kind === 'book') {
      const stars = el.querySelector('[data-edit-slot="ratingStars"]');
      const n = Number(values.rating) || 0;
      if (stars) stars.textContent = n > 0 ? '★'.repeat(n) : '—';
    }
  }
})();
