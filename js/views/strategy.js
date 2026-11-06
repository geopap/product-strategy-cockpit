import { esc, section, pageHead, eur, pct, num, meter, spark, guard } from '../ui.js';
import { DRIVERS, GOALS, GUARDRAILS, MODEL, NORTH_STAR, OKRS, OUTPUTS, PRODUCT, STRATEGY_VERSION } from '../strategy.js';
import { baseline, targets, model, guardrailStatus, gapCoverage } from '../engine.js';
import { fmtDriver } from '../handover.js';

let sim = null;

const out = (m, goal) => [
  ['revenue', eur(m.revenue / 1000), eur(goal.revenue / 1000)],
  ['subRevenue', eur(m.subRevenue / 1000), eur(goal.subRevenue / 1000)],
  ['partnerRevenue', eur(m.partnerRevenue / 1000), eur(goal.partnerRevenue / 1000)],
  ['mau', num(m.mau), num(goal.mau)],
  ['northStar', num(m.northStar), num(goal.northStar)],
  ['subscribers', num(m.subscribers), num(goal.subscribers)],
];

function simOutput(d) {
  const m = model(d), goal = model(targets());
  const share = m.revenue / goal.revenue;
  return `<div class="sim-head"><div><span class="small muted">Digital revenue run-rate</span><b class="sim-big">${eur(m.revenue / 1000)}</b></div>
      <div>${meter(share * 100, 'Share of target')} <span class="small">${pct(share, 0)} of the ${eur(goal.revenue / 1000)} target</span></div></div>
    <table class="table compact"><thead><tr><th>Output</th><th class="r">Simulated</th><th class="r">Target</th></tr></thead><tbody>
    ${out(m, goal).map(([k, v, t]) => `<tr><td>${esc(OUTPUTS[k])}</td><td class="r"><b>${v}</b></td><td class="r muted">${t}</td></tr>`).join('')}
    </tbody></table>`;
}

export function render({ state }) {
  if (!sim) sim = baseline();
  const base = baseline(), now = model(base), goal = model(targets());
  const node = (k) => {
    const d = DRIVERS[k];
    const first = d.history[0];
    const p = d.target === first ? 1 : (base[k] - first) / (d.target - first);
    return `<div class="dnode"><span class="dnode-name">${esc(d.name)}</span>
      <span class="dnode-val">${fmtDriver(k, base[k])} <span class="muted small">→ ${fmtDriver(k, d.target)}</span></span>
      ${spark(d.history)} ${d.target !== d.baseline ? meter(p * 100, 'Progress since Q4 2025') : '<span class="small muted">held flat</span>'}</div>`;
  };
  const outNode = (label, v, t, formula, cls = '') => `<div class="dnode out ${cls}"><span class="dnode-name">${esc(label)}</span><span class="dnode-val">${v} <span class="muted small">→ ${t}</span></span><span class="small muted">${esc(formula)}</span></div>`;

  const tree = `<div class="dtree">
    <div class="dtier">${outNode(OUTPUTS.revenue, eur(now.revenue / 1000), eur(goal.revenue / 1000), 'subscription + partner revenue', 'top')}${outNode(NORTH_STAR.name, num(now.northStar), num(goal.northStar), 'MAU × weekly saving action rate', 'top ns')}</div>
    <div class="dtier">${outNode(OUTPUTS.subRevenue, eur(now.subRevenue / 1000), eur(goal.subRevenue / 1000), 'MAU × Premium conversion × net revenue × 12')}${outNode(OUTPUTS.partnerRevenue, eur(now.partnerRevenue / 1000), eur(goal.partnerRevenue / 1000), 'MAU × partner revenue per MAU × 12')}${outNode('Monthly active households', num(now.mau), num(goal.mau), 'new households × activation ÷ (1 − retention)')}</div>
    <div class="dtier leaves">${Object.keys(DRIVERS).map(node).join('')}</div>
  </div>
  <p class="small muted pad">Retention also rises with engagement: each extra point of weekly saving actions adds ${MODEL.engagementToRetention} points of monthly retention. Steady-state run-rate model; the assumptions are on the <a href="#/method">Method</a> page.</p>`;

  const sliders = Object.entries(DRIVERS).map(([k, d]) => `<label class="slider"><span><b>${esc(d.name)}</b> <span class="sim-v" data-v="${k}">${fmtDriver(k, sim[k])}</span></span>
    <input type="range" data-sim="${k}" min="${d.min}" max="${d.max}" step="${d.step}" value="${sim[k]}" aria-label="${esc(d.name)}"></label>`).join('');

  const okrs = OKRS.map((o) => `<div class="okr"><h3>${esc(o.id)} · ${esc(o.objective)}</h3><p class="small muted">Owner: ${esc(o.owner)}</p><ul class="issues">
    ${o.krs.map((kr) => {
      if (kr.driver) { const p = (base[kr.driver] - kr.from) / (kr.to - kr.from); return `<li>${meter(p * 100)} ${esc(kr.text)} <span class="small muted">· now ${fmtDriver(kr.driver, base[kr.driver])}</span></li>`; }
      const g = guardrailStatus(GUARDRAILS).find((x) => x.id === kr.guardrail);
      return `<li>${guard(g.breached)} ${esc(kr.text)}</li>`;
    }).join('')}</ul></div>`).join('');

  const guards = guardrailStatus(GUARDRAILS).map((g) => `<tr><td><b>${esc(g.name)}</b><div class="small muted">${esc(g.why)}</div></td><td>${spark(g.history)}</td>
    <td class="r">${g.unit === 'pct' ? pct(g.current) : g.current}</td><td class="r muted">${g.direction === 'min' ? '≥' : '≤'} ${g.unit === 'pct' ? pct(g.limit) : g.limit}</td><td>${guard(g.breached)}</td></tr>`).join('');

  return `
    ${pageHead(`Strategy ${STRATEGY_VERSION} · ${PRODUCT.period.from} → ${PRODUCT.period.to}`, 'Strategy & drivers', 'Company goals broken down into the few numbers the product team can move, with the guardrails that must hold while we move them.')}
    <div class="grid-2">
      ${section('Company goals', `<ul class="issues">${GOALS.map((g) => `<li><b>${esc(g.id)}</b> ${esc(g.text)}</li>`).join('')}</ul>`)}
      ${section(`North star: ${NORTH_STAR.name}`, `<p>${esc(NORTH_STAR.definition)}</p><p class="small muted">Now ${num(now.northStar)} · target ${num(goal.northStar)}</p>`)}
    </div>
    ${section('Driver tree', tree)}
    <div class="grid-2 wide-left">
      ${section('What if? Move the drivers', `<div class="slider-grid sim">${sliders}</div>
        <div class="row"><button class="btn ghost small" data-preset="now">Reset to now</button><button class="btn ghost small" data-preset="target">Set to target</button><button class="btn ghost small" data-preset="bets">Apply planned bets</button></div>`, '<span class="small muted">Nothing here is saved</span>')}
      ${section('Simulated outcome', `<div id="sim-out">${simOutput(sim)}</div>`)}
    </div>
    ${section('OKRs · first half of 2027', `<div class="grid-3">${okrs}</div>`)}
    ${section('Guardrails', `<div class="table-wrap"><table class="table"><thead><tr><th>Metric</th><th>Trend</th><th class="r">Now</th><th class="r">Limit</th><th>Status</th></tr></thead><tbody>${guards}</tbody></table></div>`)}`;
}

export function bind({ root, state }) {
  const update = () => {
    root.querySelector('#sim-out').innerHTML = simOutput(sim);
    root.querySelectorAll('[data-v]').forEach((el) => { el.textContent = fmtDriver(el.dataset.v, sim[el.dataset.v]); });
    root.querySelectorAll('[data-sim]').forEach((el) => { el.value = sim[el.dataset.sim]; });
  };
  root.querySelectorAll('[data-sim]').forEach((el) => el.addEventListener('input', () => { sim[el.dataset.sim] = Number(el.value); update(); }));
  root.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
    sim = b.dataset.preset === 'target' ? targets() : b.dataset.preset === 'bets' ? { ...gapCoverage(state.bets).projected } : baseline();
    update();
  }));
}
