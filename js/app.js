import { load, save, log } from './store.js';
import * as overview from './views/overview.js';
import * as strategy from './views/strategy.js';
import * as discovery from './views/discovery.js';
import * as bets from './views/bets.js';
import * as experiments from './views/experiments.js';
import * as roadmap from './views/roadmap.js';
import * as review from './views/review.js';
import * as method from './views/method.js';
import * as audit from './views/audit.js';
import * as about from './views/about.js';

const ROUTES = { overview, strategy, discovery, bets, experiments, roadmap, review, method, audit, about };

let state = load();
const root = document.getElementById('view');

function parseHash() {
  const [p, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  return { name: ROUTES[p] ? p : 'overview', params: Object.fromEntries(new URLSearchParams(query)) };
}

function render({ keepFocus } = {}) {
  const { name, params } = parseHash();
  const view = ROUTES[name];
  const ctx = {
    state, params, root,
    refresh: (o) => render(o),
    go: (h) => { if (location.hash === h) render(); else location.hash = h; },
    replaceState: (s) => { state = s; render(); },
  };
  const y = window.scrollY;
  root.innerHTML = view.render(ctx);
  view.bind?.(ctx);
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#/${name}`));
  document.body.classList.remove('nav-open');
  const proposed = state.themes.filter((t) => t.status === 'proposed').length;
  const badge = document.getElementById('todo');
  badge.textContent = proposed ? `${proposed} to confirm` : '';
  badge.hidden = !proposed;
  if (keepFocus) {
    const el = root.querySelector(`[data-keep="${keepFocus}"]`);
    if (el) { el.focus(); if (el.type === 'search') el.setSelectionRange(el.value.length, el.value.length); }
  }
  window.scrollTo(0, y);
  save(state);
}

let lastRoute = '';
window.addEventListener('hashchange', () => {
  const { name, params } = parseHash();
  const key = name + (params.id || '');
  render();
  if (key !== lastRoute) window.scrollTo(0, 0);
  lastRoute = key;
});
document.getElementById('menu').addEventListener('click', () => document.body.classList.toggle('nav-open'));

const applyTheme = (t) => { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; };
try { applyTheme(localStorage.getItem('psc.theme')); } catch { /* ignore */ }
document.getElementById('theme').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme === 'dark'
    || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const next = dark ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('psc.theme', next); } catch { /* ignore */ }
});

(async () => {
  if (!state.audit.length) await log(state, 'system', 'STRATEGY_LOADED', `${state.bets.length} bets, ${state.experiments.length} experiments, ${state.feedback.length} feedback items`);
  const { name, params } = parseHash();
  lastRoute = name + (params.id || '');
  render();
})();
