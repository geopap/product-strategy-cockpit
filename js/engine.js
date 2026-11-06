// Deterministic engine: driver model, bet value, policy checks, experiment statistics and roadmap.
// Pure functions only, so every number on screen can be reproduced and tested.

import { DRIVERS, GUARDRAILS, MODEL, POLICY } from './strategy.js';

const KEYS = Object.keys(DRIVERS);
export const baseline = () => Object.fromEntries(KEYS.map((k) => [k, DRIVERS[k].baseline]));
export const targets = () => Object.fromEntries(KEYS.map((k) => [k, DRIVERS[k].target]));

// ── Driver model ────────────────────────────────────────────────────────────
export function model(d) {
  const retention = Math.min(0.99, d.retention + MODEL.engagementToRetention * (d.engagement - DRIVERS.engagement.baseline));
  const mau = (d.newUsers * d.activation) / (1 - retention);
  const subscribers = mau * d.conversion;
  const subRevenue = subscribers * d.arpu * 12;
  const partnerRevenue = mau * d.partnerRpu * 12;
  return { mau, northStar: mau * d.engagement, subscribers, subRevenue, partnerRevenue, revenue: subRevenue + partnerRevenue, effectiveRetention: retention };
}

// Progress of a driver from baseline to target (0 = at baseline, 1 = at target).
export function progress(key, value) {
  const { baseline: b, target: t } = DRIVERS[key];
  return t === b ? 1 : (value - b) / (t - b);
}

export function guardrailStatus(g = GUARDRAILS) {
  return g.map((x) => ({ ...x, breached: x.direction === 'min' ? x.current < x.limit : x.current > x.limit }));
}

// ── Bets ────────────────────────────────────────────────────────────────────
export function betValue(bet, base = baseline()) {
  const before = model(base);
  const after = model({ ...base, [bet.driver]: base[bet.driver] + bet.uplift });
  const fullK = (after.revenue - before.revenue) / 1000;
  const expectedK = fullK * bet.confidence;
  return {
    fullK, expectedK,
    northStar: (after.northStar - before.northStar) * bet.confidence,
    roi: bet.costK ? expectedK / bet.costK : null,
    gapShare: (bet.uplift * bet.confidence) / ((DRIVERS[bet.driver].target - DRIVERS[bet.driver].baseline) || Infinity),
  };
}

// Product policy checks. Errors block approval; warnings are shown with the bet.
export function policyCheck(bet, bets) {
  const errors = [], warnings = [];
  const expected = POLICY.placementByDriver[bet.driver];
  if (bet.placement !== 'Platform' && bet.placement !== expected) {
    (expected === 'Free' ? errors : warnings).push(expected === 'Free'
      ? `Moves ${DRIVERS[bet.driver].name.toLowerCase()} but sits in ${bet.placement}: the first saving is always free.`
      : `Placement ${bet.placement} differs from the usual ${expected} placement for this driver; record why.`);
  }
  if (bet.placement === 'Partner') {
    const f = bets.find((b) => b.id === POLICY.partnerFoundation);
    if (f && !['approved', 'validated'].includes(f.status)) errors.push(`Needs ${f.id} (${f.name}) approved first: no partner growth without consent.`);
  }
  if (bet.guardrailRisk === 'high') errors.push('High guardrail risk: needs an experiment that proves the guardrails hold.');
  return { errors, warnings, ok: errors.length === 0 };
}

export function assessBets(bets) {
  return bets.map((bet) => ({ bet, value: betValue(bet), policy: policyCheck(bet, bets) }))
    .sort((a, b) => rankOf(a) - rankOf(b) || (b.value.roi ?? 0) - (a.value.roi ?? 0));
}
const STATUS_RANK = { validated: 0, approved: 1, experiment: 2, proposed: 3, parked: 4, killed: 5 };
const rankOf = (a) => STATUS_RANK[a.bet.status] ?? 9;

// ── Experiment statistics ───────────────────────────────────────────────────
// Standard normal CDF (Abramowitz–Stegun 7.1.26, error < 1.5e-7).
export function normCdf(z) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}
// Inverse via bisection: precise enough for planning and fully deterministic.
export function normInv(p) {
  let lo = -10, hi = 10;
  for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (normCdf(mid) < p) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

export function twoProportion(c, v, alpha = POLICY.stats.alpha) {
  const pc = c.conv / c.n, pv = v.conv / v.n, diff = pv - pc;
  const pooled = (c.conv + v.conv) / (c.n + v.n);
  const z = diff / Math.sqrt(pooled * (1 - pooled) * (1 / c.n + 1 / v.n));
  const se = Math.sqrt((pc * (1 - pc)) / c.n + (pv * (1 - pv)) / v.n);
  const zc = normInv(1 - alpha / 2);
  return { pc, pv, diff, lift: pc ? diff / pc : null, z, p: 2 * (1 - normCdf(Math.abs(z))), ci: [diff - zc * se, diff + zc * se] };
}

// Sample ratio mismatch: chi-square goodness of fit with one degree of freedom.
export function srm(assigned, split = 0.5, alpha = POLICY.stats.srmAlpha) {
  const total = assigned.control + assigned.variant;
  const ec = total * (1 - split), ev = total * split;
  const chi2 = (assigned.control - ec) ** 2 / ec + (assigned.variant - ev) ** 2 / ev;
  const p = 2 * (1 - normCdf(Math.sqrt(chi2)));
  return { chi2, p, ok: p >= alpha };
}

export function sampleSize(p1, mde, { alpha = POLICY.stats.alpha, power = POLICY.stats.power } = {}) {
  const p2 = p1 + mde, pbar = (p1 + p2) / 2;
  const a = normInv(1 - alpha / 2) * Math.sqrt(2 * pbar * (1 - pbar));
  const b = normInv(power) * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
  return Math.ceil(((a + b) ** 2) / (mde ** 2));
}

export function guardrailBreached(g) {
  return g.direction === 'min' ? g.variant < g.limit : g.variant > g.limit;
}

export function readout(exp) {
  const test = twoProportion(exp.control, exp.variant);
  const ratio = srm(exp.assigned, exp.preReg.split);
  const planned = exp.preReg.plannedPerArm || sampleSize(exp.preReg.baselineRate, exp.preReg.mde);
  const powered = Math.min(exp.control.n, exp.variant.n) >= planned;
  const guardrails = exp.guardrails.map((g) => ({ ...g, breached: guardrailBreached(g) }));
  const breached = guardrails.filter((g) => g.breached);
  const significant = test.p < POLICY.stats.alpha;
  let call, reason;
  if (!ratio.ok) { call = 'rerun'; reason = `Sample ratio mismatch (${fmtP(ratio.p)}): traffic was not split as planned, so the result cannot be trusted. Fix assignment and rerun.`; }
  else if (breached.length) { call = 'kill'; reason = `Guardrail breached: ${breached.map((g) => g.name.toLowerCase()).join(', ')}. A win on the primary metric does not justify it.`; }
  else if (significant && test.diff > 0) { call = 'ship'; reason = `Significant improvement of ${pts(test.diff)} (95% CI ${pts(test.ci[0])} to ${pts(test.ci[1])}), guardrails hold.`; }
  else if (significant) { call = 'kill'; reason = `Significant deterioration of ${pts(test.diff)}.`; }
  else if (!powered) { call = 'keep running'; reason = `Not significant yet and below the planned ${planned.toLocaleString('en-GB')} per arm.`; }
  else { call = 'iterate'; reason = `No significant effect at full sample (${fmtP(test.p)}). The effect, if any, is smaller than the ${pts(exp.preReg.mde)} we designed for: change the idea, not the sample.`; }
  return { test, srm: ratio, planned, powered, guardrails, call, reason };
}

export const pts = (x, d = 1) => `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(d)} pts`;
export const fmtP = (p) => (p < 0.001 ? 'p < 0.001' : `p = ${p.toFixed(3)}`);

// ── Discovery ───────────────────────────────────────────────────────────────
export function themeStats(themes, feedback) {
  const byId = Object.fromEntries(feedback.map((f) => [f.id, f]));
  const themed = new Set(themes.flatMap((t) => t.evidence));
  const stats = themes.map((t) => {
    const items = t.evidence.map((id) => byId[id]).filter(Boolean);
    const ratings = items.filter((f) => f.rating).map((f) => f.rating);
    const count = (key) => items.reduce((m, f) => ({ ...m, [f[key]]: (m[f[key]] || 0) + 1 }), {});
    return { theme: t, items, size: items.length, sources: count('source'), markets: count('market'), segments: count('segment'), avgRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null };
  });
  return { stats, unthemed: feedback.filter((f) => !themed.has(f.id)), coverage: themed.size / feedback.length };
}

// ── Roadmap ─────────────────────────────────────────────────────────────────
export function roadmap(bets, capacityK = POLICY.capacityK) {
  const assessed = assessBets(bets);
  const now = assessed.filter((a) => ['validated', 'approved', 'experiment'].includes(a.bet.status));
  const candidates = assessed.filter((a) => a.bet.status === 'proposed' && a.policy.errors.every((e) => !e.startsWith('High guardrail')))
    .sort((a, b) => (b.value.roi ?? 0) - (a.value.roi ?? 0));
  const next = [], later = [];
  let used = 0;
  for (const a of candidates) {
    // Foundations go first, because other bets depend on them.
    if (a.bet.foundation || used + a.bet.costK <= capacityK) { next.push(a); used += a.bet.costK; } else later.push(a);
  }
  next.sort((a, b) => (b.bet.foundation ? 1 : 0) - (a.bet.foundation ? 1 : 0));
  const stopped = assessed.filter((a) => ['killed', 'parked'].includes(a.bet.status) || (a.bet.status === 'proposed' && !candidates.includes(a)));
  return { now, next, later, stopped, usedK: used, capacityK };
}

// How much of the gap to target the Now and Next columns are expected to close.
export function gapCoverage(bets) {
  const r = roadmap(bets);
  const planned = [...r.now, ...r.next];
  const base = baseline();
  const withBets = { ...base };
  for (const a of planned) withBets[a.bet.driver] += a.bet.uplift * a.bet.confidence;
  const gapK = (model(targets()).revenue - model(base).revenue) / 1000;
  const coveredK = (model(withBets).revenue - model(base).revenue) / 1000;
  const drivers = Object.keys(DRIVERS).map((k) => {
    const gap = DRIVERS[k].target - DRIVERS[k].baseline;
    const covered = planned.filter((a) => a.bet.driver === k).reduce((s, a) => s + a.bet.uplift * a.bet.confidence, 0);
    return { key: k, gap, covered, share: gap ? covered / gap : null };
  }).filter((d) => d.gap);
  return { gapK, coveredK, share: gapK ? coveredK / gapK : 1, drivers, projected: withBets };
}
