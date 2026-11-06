// App state, persisted per browser; every storage access is guarded.

import { FEEDBACK, THEMES, BETS, EXPERIMENTS, REVIEWS } from './data.js';
import { appendEntry, verifyChain } from './audit.js';

const KEY = 'psc.state.v1';

export function freshState() {
  return {
    feedback: structuredClone(FEEDBACK),
    themes: structuredClone(THEMES),
    bets: structuredClone(BETS),
    experiments: structuredClone(EXPERIMENTS),
    reviews: structuredClone(REVIEWS),
    reviewSignoff: {},
    liveThemes: null,
    sim: null,
    audit: [],
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...freshState(), ...JSON.parse(raw) };
  } catch { /* storage unavailable or corrupt */ }
  return freshState();
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export async function log(state, actor, action, detail) {
  state.audit = await appendEntry(state.audit, { actor, action, detail });
  save(state);
}

export function nextId(list, prefix) {
  const n = Math.max(0, ...list.map((x) => Number(String(x.id).replace(/\D/g, '')) || 0)) + 1;
  return `${prefix}-${String(n).padStart(2, '0')}`;
}

// Full backup and restore. A restore is refused unless the shape is right and the audit chain verifies.
const BACKUP_APP = 'product-strategy-cockpit';

export function toBackup(state, now = new Date()) {
  return JSON.stringify({ app: BACKUP_APP, version: 1, exportedAt: now.toISOString(), state }, null, 2);
}

export async function restoreBackup(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Not a valid JSON file.'); }
  if (data?.app !== BACKUP_APP || data.version !== 1 || !data.state || typeof data.state !== 'object') throw new Error('Not a Product Strategy Cockpit backup.');
  const s = data.state;
  for (const k of ['feedback', 'themes', 'bets', 'experiments', 'audit']) if (!Array.isArray(s[k])) throw new Error(`Backup is missing "${k}".`);
  const chain = await verifyChain(s.audit);
  if (!chain.ok) throw new Error(`Audit chain is broken at entry ${chain.brokenAt}; backup rejected.`);
  return { ...freshState(), ...s };
}

export const session = {
  get(k) { try { return sessionStorage.getItem(k) || ''; } catch { return ''; } },
  set(k, v) { try { v ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k); } catch { /* ignore */ } },
};
