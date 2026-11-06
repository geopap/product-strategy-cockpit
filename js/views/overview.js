import { esc, tile, section, pageHead, eur, pct, num, meter, spark } from '../ui.js';
import { DRIVERS, GUARDRAILS, PRODUCT, COMPANY } from '../strategy.js';
import { baseline, targets, model, guardrailStatus, gapCoverage, themeStats, readout } from '../engine.js';
import { decisionsNeeded, fmtDriver } from '../handover.js';

export function render({ state }) {
  const base = baseline(), now = model(base), goal = model(targets());
  const gap = gapCoverage(state.bets);
  const guards = guardrailStatus(GUARDRAILS);
  const breached = guards.filter((g) => g.breached).length;
  const ts = themeStats(state.themes, state.feedback);
  const proposed = state.themes.filter((t) => t.status === 'proposed').length;
  const pending = state.experiments.filter((e) => !e.decision);
  const approved = state.bets.filter((b) => ['approved', 'validated'].includes(b.status)).length;

  const steps = [
    ['strategy', '1', 'Strategy & drivers', 'Goals → north star → driver tree, OKRs and guardrails', `${eur(now.revenue / 1000)} → ${eur(goal.revenue / 1000)}`],
    ['discovery', '2', 'Discovery', 'Feedback grouped into themes, each with its evidence', `${state.themes.length} themes · ${pct(ts.coverage, 0)} of feedback`],
    ['bets', '3', 'Bets', 'Ranked by expected value, checked against product policy', `${state.bets.length} bets · ${approved} approved`],
    ['experiments', '4', 'Experiments', 'Pre-registered tests with guardrails and a named decision', `${pending.length} awaiting a decision`],
    ['roadmap', '5', 'Outcome roadmap', 'Now / Next / Later by outcome, within capacity', `${pct(gap.share, 0)} of the gap covered`],
    ['review', '6', 'Strategy review', 'Quarterly pack, sign-off and hand-over to the portfolio', 'Q4 2026 draft'],
  ];
  const loop = steps.map(([h, n, t, d, s], i) => `${i ? '<span class="loop-arrow">→</span>' : ''}<a class="loop-step" href="#/${h}"><span class="step-n">${n}</span><b>${esc(t)}</b><span class="small muted">${esc(d)}</span><span class="loop-stat">${esc(s)}</span></a>`).join('');

  const drivers = Object.keys(DRIVERS).filter((k) => DRIVERS[k].target !== DRIVERS[k].baseline).map((k) => {
    const d = DRIVERS[k];
    const first = d.history[0];
    const p = (base[k] - first) / (d.target - first);
    return `<tr><td>${esc(d.name)}</td><td>${spark(d.history)}</td><td class="r">${fmtDriver(k, base[k])}</td><td class="r muted">${fmtDriver(k, d.target)}</td><td>${meter(p * 100, 'Progress since Q4 2025')} <span class="small">${pct(Math.max(0, p), 0)}</span></td></tr>`;
  }).join('');

  const decisions = decisionsNeeded(state);
  return `
    ${pageHead(`${COMPANY.name} · ${PRODUCT.name}`, 'Product strategy cockpit', `${esc(PRODUCT.pitch)} One page from company goals to the roadmap, with the evidence behind every bet.`)}
    <div class="tiles">
      ${tile('weekly saving households', num(now.northStar), `north star · target ${num(goal.northStar)}`)}
      ${tile('digital revenue run-rate', eur(now.revenue / 1000), `target ${eur(goal.revenue / 1000)} by ${PRODUCT.period.to}`)}
      ${tile('of the revenue gap covered', pct(gap.share, 0), `${eur(gap.coveredK)} of ${eur(gap.gapK)} by planned bets`, gap.share < 0.6 ? 'warn' : 'good')}
      ${tile('guardrails breached', breached, `of ${guards.length} · ${guards.filter((g) => g.breached).map((g) => esc(g.name.toLowerCase())).join(', ') || 'all hold'}`, breached ? 'bad' : 'good')}
      ${tile('experiments to decide', pending.length, pending.map((e) => `${esc(e.id)} → ${esc(readout(e).call)}`).join(' · '), pending.length ? 'warn' : '')}
      ${tile('themes to confirm', proposed, 'proposed by AI-assisted discovery')}
    </div>
    <div class="loop">${loop}</div>
    <div class="grid-2 wide-left">
      ${section('Drivers against target', `<div class="table-wrap"><table class="table compact"><thead><tr><th>Driver</th><th>Last 4 quarters</th><th class="r">Now</th><th class="r">Target</th><th>Progress since Q4 2025</th></tr></thead><tbody>${drivers}</tbody></table></div>
        <p class="small muted pad">Targets for ${esc(PRODUCT.period.to)}. Revenue is a steady-state run-rate from the <a href="#/strategy">driver model</a>.</p>`)}
      ${section('Decisions needed', `<ul class="issues">${decisions.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>`, `<a class="btn small" href="#/review">Open review</a>`)}
    </div>`;
}

