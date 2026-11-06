// Outputs: approved bets as initiatives for the AI Portfolio Office (github.com/geopap/ai-portfolio-office),
// and the quarterly strategy review pack as Markdown.

import { DRIVERS, GUARDRAILS, OKRS, POLICY, PRODUCT, STRATEGY_VERSION } from './strategy.js';
import { assessBets, baseline, gapCoverage, guardrailStatus, model, readout, roadmap, targets } from './engine.js';

const clamp = (n) => Math.min(5, Math.max(1, Math.round(n)));
export const canHandOver = (bet) => ['approved', 'validated'].includes(bet.status);

// One approved bet → one initiative in the Portfolio Office data model.
export function toInitiative(bet, value, owner = 'Mara Lindqvist (Head of Product)', today = new Date().toISOString().slice(0, 10)) {
  const netSales = Math.round(value.fullK / 10) / 100; // EUR m, run-rate if the bet works
  const ebitda = Math.round(netSales * POLICY.contributionMargin * 100) / 100;
  const monthlyK = (value.expectedK * POLICY.contributionMargin) / 12;
  const load = Math.max(1, Math.round(bet.costK / 100));
  return {
    id: `VH-${bet.id.slice(2)}`,
    name: bet.name,
    subtitle: `Varnholt Home · ${bet.placement} · moves ${DRIVERS[bet.driver].name.toLowerCase()}`,
    objective: 'Growth',
    tier: 'Group pilot',
    markets: [...PRODUCT.markets],
    phase: bet.status === 'validated' ? 'Develop' : 'Explore',
    monthsInPhase: 0,
    sponsor: 'CPO',
    owner: owner.replace(/\s*\(.*\)$/, ''),
    aiSystem: false,
    rag: { timing: 'G', cost: 'G', scope: 'G' },
    budget: bet.costK,
    actuals: 0,
    kpi: null,
    ebitdaYtd: null,
    bc: { approved: false, netSales, ebitda, paybackMonths: monthlyK > 0 ? Math.max(1, Math.round(bet.costK / monthlyK)) : null },
    scores: {
      fit: OKRS.some((o) => o.krs.some((k) => k.driver === bet.driver)) ? 5 : 4,
      value: clamp(value.expectedK / 30),
      effort: clamp(bet.costK / 100),
      risk: { none: 2, low: 3, high: 5 }[bet.guardrailRisk] ?? 3,
    },
    dependsOn: bet.dependsOn || [],
    demand: { 'Product & Innovation': [load, load, load, Math.max(1, load - 1)], 'Digital & IT': [0, load, load, load] },
    lastUpdate: today,
    submitted: true,
    update: `Approved product bet from the strategy cockpit (${bet.id}). Expected value €${Math.round(value.expectedK)}k a year at ${Math.round(bet.confidence * 100)}% confidence.${bet.experiment ? ` Evidence: ${bet.experiment}.` : ''}`.slice(0, 400),
  };
}

const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
export function fmtDriver(key, v) {
  const u = DRIVERS[key].unit;
  // One decimal only where it carries information (4.2%, 94.5%), none for whole percentages (38%).
  const d = Math.round(v * 1000) % 10 === 0 ? 0 : 1;
  return u === 'pct' ? pct(v, d) : u === 'eur' ? `€${v.toFixed(2)}` : Math.round(v).toLocaleString('en-GB');
}
const eurM = (x) => `€${(x / 1e6).toFixed(2)}m`;

export function reviewMarkdown(state, quarter = 'Q4 2026') {
  const base = baseline();
  const now = model(base), goal = model(targets());
  const gap = gapCoverage(state.bets);
  const rm = roadmap(state.bets);
  const guards = guardrailStatus(GUARDRAILS);
  const assessed = assessBets(state.bets);
  const lines = [
    `# ${PRODUCT.name} · Strategy review ${quarter}`,
    '',
    `Strategy ${STRATEGY_VERSION} · data as of ${PRODUCT.asOf}`,
    '',
    '## Where we stand',
    '',
    `- Digital revenue run-rate **${eurM(now.revenue)}** against a target of ${eurM(goal.revenue)}.`,
    `- North star (weekly saving households): **${Math.round(now.northStar).toLocaleString('en-GB')}**, target ${Math.round(goal.northStar).toLocaleString('en-GB')}.`,
    `- Planned bets (Now and Next) are expected to close **${pct(gap.share, 0)}** of the revenue gap.`,
    '',
    '| Driver | Current | Target | Progress |', '|---|---|---|---|',
    ...Object.keys(DRIVERS).filter((k) => DRIVERS[k].target !== DRIVERS[k].baseline).map((k) => {
      const h = DRIVERS[k].history; const first = h[0];
      return `| ${DRIVERS[k].name} | ${fmtDriver(k, base[k])} | ${fmtDriver(k, DRIVERS[k].target)} | ${pct(Math.max(0, (base[k] - first) / (DRIVERS[k].target - first)), 0)} of the way since Q4 2025 |`;
    }),
    '',
    '## Guardrails',
    '',
    ...guards.map((g) => `- ${g.breached ? '**BREACHED**' : 'OK'} · ${g.name}: ${g.unit === 'pct' ? pct(g.current) : g.current} (limit ${g.direction === 'min' ? '≥' : '≤'} ${g.unit === 'pct' ? pct(g.limit) : g.limit})`),
    '',
    '## What we learnt',
    '',
    ...state.experiments.map((e) => {
      const r = readout(e);
      const d = e.decision ? `decided **${e.decision.call}** by ${e.decision.by}` : 'decision pending';
      return `- **${e.id} ${e.name}**: recommendation *${r.call}*, ${d}. ${r.reason}`;
    }),
    '',
    '## Roadmap',
    '',
    `- **Now:** ${rm.now.map((a) => `${a.bet.id} ${a.bet.name}`).join('; ') || '–'}`,
    `- **Next** (€${rm.usedK}k of €${rm.capacityK}k capacity): ${rm.next.map((a) => `${a.bet.id} ${a.bet.name}`).join('; ') || '–'}`,
    `- **Later:** ${rm.later.map((a) => `${a.bet.id} ${a.bet.name}`).join('; ') || '–'}`,
    `- **Stopped:** ${rm.stopped.map((a) => `${a.bet.id} ${a.bet.name}`).join('; ') || '–'}`,
    '',
    '## Decisions needed',
    '',
    ...decisionsNeeded(state, gap, guards, assessed).map((d) => `- ${d}`),
    '',
  ];
  const signed = state.reviewSignoff?.[quarter];
  lines.push(signed ? `Signed off by ${signed.by} on ${signed.at}. ${signed.note}` : '*Draft: not yet signed off.*', '', '---', '*Synthetic data. Generated by the Product Strategy Cockpit.*');
  return lines.join('\n');
}

export function decisionsNeeded(state, gap = gapCoverage(state.bets), guards = guardrailStatus(GUARDRAILS), assessed = assessBets(state.bets)) {
  const out = [];
  if (gap.share < 0.6) out.push(`The planned bets close only ${pct(gap.share, 0)} of the revenue gap: fund more discovery, take bigger bets, or reset the ${PRODUCT.period.to} target.`);
  for (const d of gap.drivers) if (d.share === 0) out.push(`No bet addresses ${DRIVERS[d.key].name.toLowerCase()} (gap ${fmtDriver(d.key, d.gap)}): assign an owner or drop it from the target.`);
  for (const g of guards) if (g.breached) out.push(`${g.name} is outside its guardrail: no bet that risks it should ship until it recovers.`);
  for (const e of state.experiments) if (!e.decision) out.push(`${e.id} ${e.name}: record a decision (recommended: ${readout(e).call}).`);
  const blocked = assessed.filter((a) => a.bet.status === 'proposed' && a.policy.errors.length);
  for (const a of blocked) out.push(`${a.bet.id} ${a.bet.name} is blocked: ${a.policy.errors[0]}`);
  return out;
}

