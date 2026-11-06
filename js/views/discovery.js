import { esc, tile, section, pageHead, pct, toast } from '../ui.js';
import { DRIVERS, PEOPLE, SOURCES } from '../strategy.js';
import { themeStats } from '../engine.js';
import { MODELS, MIN_EVIDENCE, synthesiseThemes } from '../llm.js';
import { log, nextId, save, session } from '../store.js';

const filters = { theme: '', source: '', market: '', q: '' };
let running = false;

const stars = (n) => (n ? `<span class="stars" aria-label="${n} of 5 stars">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>` : '');
const driverChip = (k) => `<span class="chip-d">${esc(DRIVERS[k]?.name || k)}</span>`;

export function render({ state }) {
  const { stats, unthemed, coverage } = themeStats(state.themes.filter((t) => t.status !== 'rejected'), state.feedback);
  const byId = Object.fromEntries(state.feedback.map((f) => [f.id, f]));
  const themeOf = {};
  for (const t of state.themes) if (t.status !== 'rejected') for (const id of t.evidence) themeOf[id] = themeOf[id] || t;
  const confirmed = state.themes.filter((t) => t.status === 'confirmed').length;
  const proposed = state.themes.filter((t) => t.status === 'proposed').length;
  const sources = state.feedback.reduce((m, f) => ({ ...m, [f.source]: (m[f.source] || 0) + 1 }), {});

  const cards = stats.map(({ theme: t, size, segments, markets, avgRating, items }) => `
    <article class="theme ${t.status === 'proposed' ? 'is-proposed' : ''}" id="${esc(t.id)}">
      <header><span class="muted small">${esc(t.id)}${t.source === 'claude' ? ' · from live Claude run' : ''}</span>
        <span class="theme-status ${esc(t.status)}">${t.status === 'confirmed' ? '✓ Confirmed' : 'Proposed by AI · needs a person'}</span></header>
      <h3>${esc(t.name)}</h3>
      <p class="small">${esc(t.insight)}</p>
      <div class="row small">${driverChip(t.driver)}<span><b>${size}</b> pieces of evidence</span>
        <span class="muted">${Object.entries(segments).map(([k, v]) => `${esc(k)} ${v}`).join(' · ')}</span>
        <span class="muted">${Object.keys(markets).map(esc).join(', ')}</span>${avgRating ? `<span>${stars(Math.round(avgRating))} ${avgRating.toFixed(1)}</span>` : ''}</div>
      <details><summary class="small">Evidence (${size})</summary><ul class="evidence">${items.map((f) => `<li><span class="muted small">${esc(f.id)} · ${esc(SOURCES[f.source])} · ${esc(f.market)} · ${esc(f.segment)}</span> ${stars(f.rating)}<br>“${esc(f.text)}”</li>`).join('')}</ul></details>
      ${t.status === 'confirmed' ? `<p class="small muted">Confirmed by ${esc(t.confirmedBy)}</p>` : `
        <div class="row theme-actions"><select data-by="${esc(t.id)}" aria-label="Confirmed by"><option value="">Confirmed by…</option>${PEOPLE.map((p) => `<option>${esc(p)}</option>`).join('')}</select>
        <button class="btn small primary" data-confirm="${esc(t.id)}">Confirm theme</button><button class="btn small ghost" data-reject="${esc(t.id)}">Reject</button></div>`}
    </article>`).join('');

  const rows = state.feedback.filter((f) => (!filters.theme || (filters.theme === 'none' ? !themeOf[f.id] : themeOf[f.id]?.id === filters.theme))
      && (!filters.source || f.source === filters.source) && (!filters.market || f.market === filters.market)
      && (!filters.q || f.text.toLowerCase().includes(filters.q.toLowerCase())))
    .map((f) => `<tr><td class="small muted">${esc(f.id)}<br>${esc(f.date)}</td><td>${esc(SOURCES[f.source])}<div class="small muted">${esc(f.market)} · ${esc(f.segment)}</div></td>
      <td>${stars(f.rating)} ${esc(f.text)}</td>
      <td>${themeOf[f.id] ? `<a href="#/discovery" data-jump="${esc(themeOf[f.id].id)}" class="small">${esc(themeOf[f.id].id)} ${esc(themeOf[f.id].name)}</a>`
        : `<select data-assign="${esc(f.id)}" aria-label="Assign to theme"><option value="">Assign to theme…</option>${state.themes.filter((t) => t.status !== 'rejected').map((t) => `<option value="${esc(t.id)}">${esc(t.id)} ${esc(t.name)}</option>`).join('')}</select>`}</td></tr>`).join('');

  const sel = (key, label, opts) => `<label>${label}<select data-filter="${key}"><option value="">All</option>${opts.map(([v, l]) => `<option value="${esc(v)}" ${filters[key] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const live = state.liveThemes;

  return `
    ${pageHead('Continuous discovery', 'Discovery', 'Customer feedback from the app stores, surveys, support and sales, grouped into opportunity themes. AI proposes the themes and cites its evidence; a person confirms each one before it can carry a bet.')}
    <div class="tiles">
      ${tile('pieces of feedback', state.feedback.length, Object.entries(sources).map(([k, v]) => `${v} ${esc(SOURCES[k].toLowerCase())}`).join(' · '))}
      ${tile('covered by a theme', pct(coverage, 0), `${unthemed.length} not yet themed`)}
      ${tile('themes confirmed', confirmed, 'by a named person', 'good')}
      ${tile('themes proposed', proposed, 'waiting for a person', proposed ? 'warn' : '')}
    </div>
    ${section('Opportunity themes', `<div class="themes">${cards}</div>`, '<span class="small muted">Sorted as proposed; each theme maps to one driver</span>')}
    <details class="ai-panel card" ${live ? 'open' : ''}><summary><b>Re-run discovery live with Claude</b> <span class="small muted">optional · your own API key · nothing leaves your browser except the redacted feedback</span></summary>
      <div class="ai-form">
        <label>Anthropic API key<input type="password" id="key" value="${esc(session.get('psc.key'))}" placeholder="sk-ant-…" autocomplete="off"></label>
        <label>Model<select id="model">${MODELS.map((m) => `<option value="${m.id}">${esc(m.label)}</option>`).join('')}</select></label>
        <label>Feedback<select id="scope"><option value="unthemed">Not yet themed (${unthemed.length})</option><option value="all">All feedback (${state.feedback.length})</option></select></label>
        <div class="row"><button class="btn primary" id="run" ${running ? 'disabled' : ''}>${running ? 'Running…' : 'Propose themes'}</button>
        <span class="small muted">Emails and phone numbers are redacted. Themes need at least ${MIN_EVIDENCE} real pieces of evidence; invented IDs are dropped. The key stays in this tab only.</span></div>
      </div>
      ${live ? `<div class="live-out"><p class="small"><b>${live.themes.length} theme${live.themes.length === 1 ? '' : 's'} proposed</b> by ${esc(live.model)} · ${live.redactions} redaction${live.redactions === 1 ? '' : 's'} · ${live.invented} invented evidence ID${live.invented === 1 ? '' : 's'} dropped · ${live.discarded} theme${live.discarded === 1 ? '' : 's'} discarded for thin evidence</p>
        ${live.themes.map((t, i) => `<div class="flag"><div class="flag-head"><b>${esc(t.name)}</b> ${driverChip(t.driver)} <span class="small muted">${t.evidence.length} pieces of evidence: ${t.evidence.map(esc).join(', ')}</span></div>
          <div class="flag-body small">${esc(t.insight)}</div><button class="btn small" data-add="${i}" ${t.added ? 'disabled' : ''}>${t.added ? 'Added' : 'Add as proposed theme'}</button></div>`).join('')}</div>` : ''}
    </details>
    <div class="filters">
      <label class="grow">Search<input type="search" data-filter="q" data-keep="q" value="${esc(filters.q)}" placeholder="Search feedback"></label>
      ${sel('theme', 'Theme', [['none', 'Not yet themed'], ...state.themes.filter((t) => t.status !== 'rejected').map((t) => [t.id, `${t.id} ${t.name}`])])}
      ${sel('source', 'Source', Object.entries(SOURCES))}
      ${sel('market', 'Market', ['DE', 'AT', 'CH', 'NL'].map((m) => [m, m]))}
    </div>
    <div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>ID</th><th>Source</th><th>Feedback</th><th>Theme</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4" class="muted">No feedback matches the filters.</td></tr>'}</tbody></table></div></div>`;
}

export function bind({ root, state, refresh }) {
  root.querySelectorAll('[data-filter]').forEach((el) => el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', () => {
    filters[el.dataset.filter] = el.value;
    refresh({ keepFocus: el.dataset.keep });
  }));
  root.querySelectorAll('[data-jump]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); root.querySelector(`#${a.dataset.jump}`)?.scrollIntoView({ behavior: 'smooth' }); }));
  root.querySelectorAll('[data-confirm]').forEach((b) => b.addEventListener('click', async () => {
    const by = root.querySelector(`[data-by="${b.dataset.confirm}"]`).value;
    if (!by) return toast('Choose who confirms the theme.');
    const t = state.themes.find((x) => x.id === b.dataset.confirm);
    t.status = 'confirmed'; t.confirmedBy = by;
    await log(state, by, 'THEME_CONFIRMED', `${t.id} ${t.name} (${t.evidence.length} pieces of evidence)`);
    toast(`${t.id} confirmed. It can now carry bets.`);
    refresh();
  }));
  root.querySelectorAll('[data-reject]').forEach((b) => b.addEventListener('click', async () => {
    const t = state.themes.find((x) => x.id === b.dataset.reject);
    if (state.bets.some((x) => x.theme === t.id && x.status !== 'killed')) return toast('A bet depends on this theme. Kill or move the bet first.');
    t.status = 'rejected';
    await log(state, 'user', 'THEME_REJECTED', `${t.id} ${t.name}`);
    refresh();
  }));
  root.querySelectorAll('[data-assign]').forEach((s) => s.addEventListener('change', async () => {
    if (!s.value) return;
    const t = state.themes.find((x) => x.id === s.value);
    t.evidence.push(s.dataset.assign);
    await log(state, 'user', 'FEEDBACK_THEMED', `${s.dataset.assign} → ${t.id}`);
    refresh();
  }));
  root.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', async () => {
    const lt = state.liveThemes.themes[Number(b.dataset.add)];
    const id = nextId(state.themes, 'TH');
    state.themes.push({ id, name: lt.name, insight: lt.insight, driver: lt.driver, evidence: lt.evidence, status: 'proposed', source: 'claude' });
    lt.added = true;
    await log(state, 'claude-discovery', 'THEME_PROPOSED', `${id} ${lt.name} (${lt.evidence.length} pieces of evidence)`);
    refresh();
  }));
  root.querySelector('#run').addEventListener('click', async () => {
    const apiKey = root.querySelector('#key').value.trim();
    if (!apiKey) return toast('Enter your Anthropic API key first.');
    session.set('psc.key', apiKey);
    const scope = root.querySelector('#scope').value;
    const themed = new Set(state.themes.filter((t) => t.status !== 'rejected').flatMap((t) => t.evidence));
    const feedback = scope === 'all' ? state.feedback : state.feedback.filter((f) => !themed.has(f.id));
    running = true; refresh();
    try {
      const r = await synthesiseThemes({ apiKey, model: root.querySelector('#model').value, feedback });
      state.liveThemes = { ...r, at: new Date().toISOString() };
      await log(state, 'claude-discovery', 'DISCOVERY_RUN', `${feedback.length} items · ${r.themes.length} themes kept · ${r.invented} invented IDs dropped · ${r.redactions} redactions`);
    } catch (e) {
      toast(e.message);
    } finally {
      running = false; save(state); refresh();
    }
  });
}
