// Small rendering helpers. All dynamic text goes through esc() before it reaches innerHTML.

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function tile(label, value, sub = '', cls = '') {
  return `<div class="tile ${cls}"><div class="tile-value">${value}</div><div class="tile-label">${esc(label)}</div>${sub ? `<div class="tile-sub">${sub}</div>` : ''}</div>`;
}

export function section(title, body, extra = '') {
  return `<section class="card"><header class="card-head"><h2>${esc(title)}</h2>${extra}</header>${body}</section>`;
}

export function pageHead(kicker, title, lede) {
  return `<header class="page-head"><div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}</header>`;
}

export function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 3200);
}

export const eur = (k) => (Math.abs(k) >= 1000 ? `€${(k / 1000).toFixed(2)}m` : `€${Math.round(k)}k`);
export const pct = (x, d = 1) => (x === null || x === undefined ? '–' : `${(x * 100).toFixed(d)}%`);
export const num = (x) => Math.round(x).toLocaleString('en-GB');

export function meter(v, label = '') {
  return `<span class="meter" title="${esc(label)}"><span style="width:${Math.max(0, Math.min(100, v))}%"></span></span>`;
}

const STATUS = { proposed: 'Proposed', approved: 'Approved', experiment: 'In experiment', validated: 'Validated', parked: 'Parked', killed: 'Killed' };
export function betStatus(s) {
  return `<span class="bst bst-${esc(s)}">${esc(STATUS[s] || s)}</span>`;
}

export function call(c) {
  const cls = { ship: 'go', iterate: 'cond', 'keep running': 'cond', rerun: 'no', kill: 'no' }[c] || 'cond';
  return `<span class="decision-badge dec-${cls}">${esc(String(c).toUpperCase())}</span>`;
}

export function placement(p) {
  return `<span class="plc plc-${esc(String(p).toLowerCase())}">${esc(p)}</span>`;
}

export function guard(breached) {
  return breached ? '<span class="pill bad">✕ breached</span>' : '<span class="pill ok">✓ holds</span>';
}

// Tiny inline trend line for quarterly history.
export function spark(values, { w = 84, h = 24 } = {}) {
  if (!values?.length) return '';
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => `${(i * (w - 4)) / (values.length - 1) + 2},${h - 3 - ((v - min) / span) * (h - 6)}`).join(' ');
  const [lx, ly] = pts.split(' ').pop().split(',');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}"/><circle cx="${lx}" cy="${ly}" r="2.4"/></svg>`;
}
