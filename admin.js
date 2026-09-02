/* ============================================================
   Janelle Selou Portfolio — Admin CMS
   Reads/writes content/*.json in the connected GitHub repo via
   the GitHub Contents API. Requires a fine-grained PAT scoped to
   this repo with Contents: Read and write. The token is stored
   only in this browser's localStorage.
   ============================================================ */

const REPO = 'theconjen/Janelle-s-Portfolio';
const BRANCH = 'main';
const TOKEN_KEY = 'jselou_admin_pat';

let TOKEN = localStorage.getItem(TOKEN_KEY) || '';

// ---------- GitHub API helpers ----------

function b64EncodeUnicode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function b64DecodeUnicode(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))));
}

async function ghFetch(path, opts = {}) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    ...opts,
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      ...(opts.headers || {}),
    },
  });
  return res;
}

async function getFile(path) {
  const res = await ghFetch(`${path}?ref=${BRANCH}`);
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
  const data = await res.json();
  return { text: b64DecodeUnicode(data.content), sha: data.sha, raw: data };
}

async function getJson(path) {
  const { text, sha } = await getFile(path);
  return { json: JSON.parse(text), sha };
}

async function putFile(path, contentStr, message, sha, alreadyBase64 = false) {
  const body = {
    message,
    content: alreadyBase64 ? contentStr : b64EncodeUnicode(contentStr),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;
  const res = await ghFetch(path, { method: 'PUT', body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Could not save ${path} (${res.status})`);
  }
  return res.json();
}

async function putJson(path, json, sha, message) {
  return putFile(path, JSON.stringify(json, null, 2), message, sha);
}

async function uploadImage(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  const base64 = dataUrl.split(',')[1];
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.\-]/g, '-');
  const path = `images/${Date.now()}-${safeName}`;
  // New file — no sha needed
  await putFile(path, base64, `Upload image ${safeName}`, null, true);
  return path;
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || '';
}
function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------- Gate / auth ----------

const gateEl = document.getElementById('gate');
const appEl = document.getElementById('app');
const gateError = document.getElementById('gate-error');

async function tryConnect(token) {
  gateError.textContent = '';
  TOKEN = token;
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error('Token was rejected by GitHub.');
    const user = await res.json();
    // Confirm repo access specifically
    const repoRes = await ghFetch('');
    if (!repoRes.ok) throw new Error('Token connected, but cannot access Janelle-s-Portfolio. Check the repo scope.');
    localStorage.setItem(TOKEN_KEY, token);
    document.getElementById('who').textContent = user.login || 'GitHub';
    gateEl.classList.add('hidden');
    appEl.classList.remove('hidden');
    initAllPanels();
  } catch (e) {
    gateError.textContent = e.message;
    TOKEN = '';
  }
}

document.getElementById('connect-btn').addEventListener('click', () => {
  const val = document.getElementById('token-input').value.trim();
  if (!val) return;
  tryConnect(val);
});
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem(TOKEN_KEY);
  TOKEN = '';
  appEl.classList.add('hidden');
  gateEl.classList.remove('hidden');
});

if (TOKEN) tryConnect(TOKEN);

// ---------- Tabs ----------

document.querySelectorAll('.admin-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
  });
});

function setStatus(id, msg, isError = false) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.color = isError ? '#B3261E' : 'var(--gold)';
  if (msg && !isError) setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 4000);
}

function initAllPanels() {
  initTheme();
  initWork();
  initWriting();
  initAbout();
}

// ================= THEME =================

let themeSha = null;
const THEME_FIELDS = [
  ['paper', 'Paper (background)', 'color'],
  ['ink', 'Ink (text)', 'color'],
  ['inkSoft', 'Ink Soft (secondary text)', 'color'],
  ['gold', 'Accent', 'color'],
  ['sage', 'Sage (tinted section bg)', 'color'],
  ['line', 'Line (borders)', 'color'],
  ['fontDisplay', 'Display font (headings)', 'text'],
  ['fontBody', 'Body font', 'text'],
];

async function initTheme() {
  const form = document.getElementById('theme-form');
  form.innerHTML = '<p style="color:var(--ink-soft)">Loading…</p>';
  try {
    const { json, sha } = await getJson('content/theme.json');
    themeSha = sha;
    form.innerHTML = THEME_FIELDS.map(([key, label, type]) => {
      if (type === 'color') {
        return `
          <div class="admin-field">
            <label>${label}</label>
            <div class="color-swatch-row">
              <input type="color" id="theme-${key}" value="${json[key] || '#000000'}" />
              <input type="text" class="admin-input" id="theme-${key}-hex" value="${json[key] || ''}" style="margin:0" />
            </div>
          </div>`;
      }
      return `
        <div class="admin-field">
          <label>${label}</label>
          <input type="text" class="admin-input" id="theme-${key}" value="${escapeHtml(json[key] || '')}" />
        </div>`;
    }).join('');

    // keep color picker + hex text in sync
    THEME_FIELDS.filter(([, , t]) => t === 'color').forEach(([key]) => {
      const picker = document.getElementById(`theme-${key}`);
      const hex = document.getElementById(`theme-${key}-hex`);
      picker.addEventListener('input', () => (hex.value = picker.value));
      hex.addEventListener('input', () => {
        if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) picker.value = hex.value;
      });
    });
  } catch (e) {
    form.innerHTML = `<p class="admin-error">${e.message}</p>`;
  }
}

document.getElementById('save-theme').addEventListener('click', async () => {
  setStatus('status-theme', 'Saving…');
  try {
    const json = {};
    THEME_FIELDS.forEach(([key, , type]) => {
      if (type === 'color') json[key] = document.getElementById(`theme-${key}-hex`).value;
      else json[key] = document.getElementById(`theme-${key}`).value;
    });
    const result = await putJson('content/theme.json', json, themeSha, 'Update theme via admin');
    themeSha = result.content.sha;
    setStatus('status-theme', 'Saved. Live in ~30s.');
  } catch (e) {
    setStatus('status-theme', e.message, true);
  }
});

// ================= WORK =================

let workItems = [];
let workSha = null;

async function initWork() {
  const container = document.getElementById('work-items');
  container.innerHTML = '<p style="color:var(--ink-soft)">Loading…</p>';
  try {
    const { json, sha } = await getJson('content/work.json');
    workItems = json;
    workSha = sha;
    renderWorkItems();
  } catch (e) {
    container.innerHTML = `<p class="admin-error">${e.message}</p>`;
  }
}

function renderWorkItems() {
  const container = document.getElementById('work-items');
  container.innerHTML = '';
  workItems.forEach((item, idx) => container.appendChild(buildWorkItemCard(item, idx)));
}

function buildWorkItemCard(item, idx) {
  const card = document.createElement('div');
  card.className = 'admin-item-card';
  card.innerHTML = `
    <div class="admin-item-head">
      <strong>${escapeHtml(item.title || 'Untitled')}</strong>
      <button class="admin-remove-btn" data-action="remove">Remove</button>
    </div>
    <div class="admin-field"><label>Order</label><input class="admin-input wi-order" type="number" value="${item.order ?? idx + 1}" /></div>
    <div class="admin-field"><label>Eyebrow (e.g. "01 — Founder")</label><input class="admin-input wi-eyebrow" value="${escapeHtml(item.eyebrow || '')}" /></div>
    <div class="admin-field"><label>Title</label><input class="admin-input wi-title" value="${escapeHtml(item.title || '')}" /></div>
    <div class="admin-field"><label>Rows (label / text)</label>
      <div class="admin-row-list wi-rows"></div>
      <button class="admin-mini-btn wi-add-row" type="button">+ Add row</button>
    </div>
    <div class="admin-field"><label>Pull quote (optional — leave blank to omit)</label>
      <input class="admin-input wi-quote-text" placeholder="Quote text" value="${escapeHtml(item.quote?.text || '')}" />
      <input class="admin-input wi-quote-cite" placeholder="Cite text (before the link)" value="${escapeHtml(item.quote?.citeText || '')}" />
      <input class="admin-input wi-quote-link-text" placeholder="Link text" value="${escapeHtml(item.quote?.citeLinkText || '')}" />
      <input class="admin-input wi-quote-link-href" placeholder="Link URL, e.g. post.html?slug=..." value="${escapeHtml(item.quote?.citeLinkHref || '')}" />
    </div>
    <div class="admin-field"><label>Images</label>
      <div class="wi-images"></div>
      <input type="file" accept="image/*" class="wi-image-upload" />
    </div>
  `;

  const rowsWrap = card.querySelector('.wi-rows');
  const renderRows = (rows) => {
    rowsWrap.innerHTML = '';
    rows.forEach((row, rIdx) => {
      const r = document.createElement('div');
      r.className = 'admin-row-item';
      r.innerHTML = `
        <input class="admin-input row-label" placeholder="Label" value="${escapeHtml(row.label || '')}" />
        <input class="admin-input row-text" placeholder="Text" value="${escapeHtml(row.text || '')}" />
        <button class="admin-mini-btn row-remove" type="button">✕</button>`;
      r.querySelector('.row-remove').addEventListener('click', () => {
        rows.splice(rIdx, 1);
        renderRows(rows);
      });
      rowsWrap.appendChild(r);
    });
  };
  if (!item.rows) item.rows = [];
  renderRows(item.rows);
  card.querySelector('.wi-add-row').addEventListener('click', () => {
    item.rows.push({ label: '', text: '' });
    renderRows(item.rows);
  });

  const imagesWrap = card.querySelector('.wi-images');
  const renderImages = () => {
    imagesWrap.innerHTML = '';
    (item.images || []).forEach((img, iIdx) => {
      const row = document.createElement('div');
      row.className = 'admin-image-item';
      row.innerHTML = `
        <img src="${img.src}" alt="" onerror="this.style.visibility='hidden'" />
        <input class="admin-input img-caption" placeholder="Caption" value="${escapeHtml(img.caption || '')}" />
        <button class="admin-mini-btn img-remove" type="button">✕</button>`;
      row.querySelector('.img-caption').addEventListener('input', (e) => (img.caption = e.target.value));
      row.querySelector('.img-remove').addEventListener('click', () => {
        item.images.splice(iIdx, 1);
        renderImages();
      });
      imagesWrap.appendChild(row);
    });
  };
  if (!item.images) item.images = [];
  renderImages();

  card.querySelector('.wi-image-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('status-work', 'Uploading image…');
    try {
      const path = await uploadImage(file);
      item.images.push({ src: path, alt: '', caption: '' });
      renderImages();
      setStatus('status-work', 'Image uploaded. Remember to Save.');
    } catch (err) {
      setStatus('status-work', err.message, true);
    }
    e.target.value = '';
  });

  card.querySelector('[data-action="remove"]').addEventListener('click', () => {
    workItems.splice(idx, 1);
    renderWorkItems();
  });
  card.querySelector('.wi-title').addEventListener('input', (e) => {
    card.querySelector('strong').textContent = e.target.value || 'Untitled';
  });

  return card;
}

document.getElementById('add-work-item').addEventListener('click', () => {
  workItems.push({ id: `item-${Date.now()}`, order: workItems.length + 1, eyebrow: '', title: 'New case study', rows: [], quote: null, images: [] });
  renderWorkItems();
});

document.getElementById('save-work').addEventListener('click', async () => {
  setStatus('status-work', 'Saving…');
  try {
    // Pull latest field values from the DOM into workItems before saving
    document.querySelectorAll('#work-items .admin-item-card').forEach((card, idx) => {
      const item = workItems[idx];
      item.order = Number(card.querySelector('.wi-order').value) || idx + 1;
      item.eyebrow = card.querySelector('.wi-eyebrow').value;
      item.title = card.querySelector('.wi-title').value;
      item.rows = Array.from(card.querySelectorAll('.wi-rows .admin-row-item')).map((r) => ({
        label: r.querySelector('.row-label').value,
        text: r.querySelector('.row-text').value,
      }));
      const qText = card.querySelector('.wi-quote-text').value.trim();
      item.quote = qText
        ? {
            text: qText,
            citeText: card.querySelector('.wi-quote-cite').value,
            citeLinkText: card.querySelector('.wi-quote-link-text').value,
            citeLinkHref: card.querySelector('.wi-quote-link-href').value,
          }
        : null;
    });
    const result = await putJson('content/work.json', workItems, workSha, 'Update work page via admin');
    workSha = result.content.sha;
    setStatus('status-work', 'Saved. Live in ~30s.');
  } catch (e) {
    setStatus('status-work', e.message, true);
  }
});

// ================= WRITING =================

let writingItems = [];
let writingSha = null;

async function initWriting() {
  const container = document.getElementById('writing-items');
  container.innerHTML = '<p style="color:var(--ink-soft)">Loading…</p>';
  try {
    const { json, sha } = await getJson('content/writing.json');
    writingItems = json;
    writingSha = sha;
    renderWritingItems();
  } catch (e) {
    container.innerHTML = `<p class="admin-error">${e.message}</p>`;
  }
}

function blocksToText(blocks) {
  return (blocks || [])
    .map((b) => (b.tag === 'h3' ? `## ${stripHtml(b.html)}` : stripHtml(b.html)))
    .join('\n\n');
}
function textToBlocks(text) {
  return text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      if (chunk.startsWith('## ')) return { tag: 'h3', html: escapeHtml(chunk.slice(3).trim()) };
      return { tag: 'p', html: escapeHtml(chunk) };
    });
}

function renderWritingItems() {
  const container = document.getElementById('writing-items');
  container.innerHTML = '';
  writingItems.forEach((post, idx) => container.appendChild(buildWritingCard(post, idx)));
}

function buildWritingCard(post, idx) {
  const card = document.createElement('div');
  card.className = 'admin-item-card';
  card.innerHTML = `
    <div class="admin-item-head">
      <strong>${escapeHtml(post.title || 'Untitled post')}</strong>
      <button class="admin-remove-btn" data-action="remove">Remove</button>
    </div>
    <div class="admin-field"><label>Title (wrap a word in &lt;em&gt;word&lt;/em&gt; to italicize it)</label>
      <input class="admin-input p-title" value="${escapeHtml(post.titleHtml || post.title || '')}" /></div>
    <div class="admin-field"><label>Slug (URL) — auto-fills from title if left blank</label>
      <input class="admin-input p-slug" value="${escapeHtml(post.slug || '')}" /></div>
    <div class="admin-field"><label>Tag (e.g. "Essay · Brand Strategy")</label>
      <input class="admin-input p-tag" value="${escapeHtml(post.tag || '')}" /></div>
    <div class="admin-field"><label>Excerpt (shown on the Writing list page)</label>
      <textarea class="admin-input p-excerpt" rows="2">${escapeHtml(post.excerpt || '')}</textarea></div>
    <div class="admin-field"><label>Deck (subtitle shown at top of the post)</label>
      <textarea class="admin-input p-deck" rows="2">${escapeHtml(post.deck || '')}</textarea></div>
    <div class="admin-field"><label>Date</label>
      <input type="date" class="admin-input p-date" value="${(post.date || '').slice(0, 10)}" /></div>
    <div class="admin-field"><label>Body</label>
      <textarea class="admin-input p-body" rows="12">${escapeHtml(blocksToText(post.blocks))}</textarea></div>
  `;
  card.querySelector('[data-action="remove"]').addEventListener('click', () => {
    writingItems.splice(idx, 1);
    renderWritingItems();
  });
  card.querySelector('.p-title').addEventListener('input', (e) => {
    card.querySelector('strong').textContent = stripHtml(e.target.value) || 'Untitled post';
  });
  return card;
}

document.getElementById('add-writing-item').addEventListener('click', () => {
  writingItems.push({
    id: `post-${Date.now()}`,
    slug: '',
    title: 'New post',
    titleHtml: 'New post',
    tag: 'Essay',
    excerpt: '',
    deck: '',
    date: new Date().toISOString().slice(0, 10),
    blocks: [],
  });
  renderWritingItems();
});

document.getElementById('save-writing').addEventListener('click', async () => {
  setStatus('status-writing', 'Saving…');
  try {
    document.querySelectorAll('#writing-items .admin-item-card').forEach((card, idx) => {
      const post = writingItems[idx];
      const titleHtml = card.querySelector('.p-title').value.trim();
      post.titleHtml = titleHtml;
      post.title = stripHtml(titleHtml);
      let slug = card.querySelector('.p-slug').value.trim();
      if (!slug) slug = slugify(post.title);
      post.slug = slug;
      post.id = post.id || slug;
      post.tag = card.querySelector('.p-tag').value;
      post.excerpt = card.querySelector('.p-excerpt').value;
      post.deck = card.querySelector('.p-deck').value;
      post.date = card.querySelector('.p-date').value;
      post.blocks = textToBlocks(card.querySelector('.p-body').value);
    });
    // Guard against duplicate slugs
    const slugs = writingItems.map((p) => p.slug);
    const dupe = slugs.find((s, i) => slugs.indexOf(s) !== i);
    if (dupe) throw new Error(`Two posts share the slug "${dupe}" — make them unique.`);

    const result = await putJson('content/writing.json', writingItems, writingSha, 'Update writing via admin');
    writingSha = result.content.sha;
    setStatus('status-writing', 'Saved. Live in ~30s.');
  } catch (e) {
    setStatus('status-writing', e.message, true);
  }
});

// ================= ABOUT =================

let aboutData = null;
let aboutSha = null;

async function initAbout() {
  try {
    const { json, sha } = await getJson('content/about.json');
    aboutData = json;
    aboutSha = sha;
    document.getElementById('about-profile').value = json.profile || '';
    document.getElementById('about-focus').value = json.focus || '';
    document.getElementById('about-languages').value = json.languages || '';
    document.getElementById('about-learning').value = json.learning || '';
    document.getElementById('about-based').value = json.based || '';
    renderSkillsItems(json.skills || []);
  } catch (e) {
    setStatus('status-about', e.message, true);
  }
}

function renderSkillsItems(skills) {
  const container = document.getElementById('skills-items');
  container.innerHTML = '';
  skills.forEach((col, idx) => {
    const card = document.createElement('div');
    card.className = 'admin-item-card';
    card.innerHTML = `
      <div class="admin-item-head">
        <strong>${escapeHtml(col.title || 'Untitled')}</strong>
        <button class="admin-remove-btn" data-action="remove">Remove</button>
      </div>
      <div class="admin-field"><label>Column title</label><input class="admin-input sk-title" value="${escapeHtml(col.title || '')}" /></div>
      <div class="admin-field"><label>Items (one per line)</label><textarea class="admin-input sk-items" rows="5">${escapeHtml((col.items || []).join('\n'))}</textarea></div>
    `;
    card.querySelector('[data-action="remove"]').addEventListener('click', () => {
      skills.splice(idx, 1);
      renderSkillsItems(skills);
    });
    card.querySelector('.sk-title').addEventListener('input', (e) => {
      card.querySelector('strong').textContent = e.target.value || 'Untitled';
    });
    container.appendChild(card);
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'admin-btn admin-btn-ghost';
  addBtn.type = 'button';
  addBtn.textContent = '+ Add column';
  addBtn.style.gridColumn = '1 / -1';
  addBtn.addEventListener('click', () => {
    skills.push({ title: 'New Column', items: [] });
    renderSkillsItems(skills);
  });
  container.appendChild(addBtn);
}

document.getElementById('save-about').addEventListener('click', async () => {
  setStatus('status-about', 'Saving…');
  try {
    aboutData.profile = document.getElementById('about-profile').value;
    aboutData.focus = document.getElementById('about-focus').value;
    aboutData.languages = document.getElementById('about-languages').value;
    aboutData.learning = document.getElementById('about-learning').value;
    aboutData.based = document.getElementById('about-based').value;
    aboutData.skills = Array.from(document.querySelectorAll('#skills-items .admin-item-card')).map((card) => ({
      title: card.querySelector('.sk-title').value,
      items: card.querySelector('.sk-items').value.split('\n').map((s) => s.trim()).filter(Boolean),
    }));
    const result = await putJson('content/about.json', aboutData, aboutSha, 'Update about page via admin');
    aboutSha = result.content.sha;
    setStatus('status-about', 'Saved. Live in ~30s.');
  } catch (e) {
    setStatus('status-about', e.message, true);
  }
});
