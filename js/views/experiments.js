import { esc, section, pageHead, pct, num, call, guard, toast } from '../ui.js';
import { PEOPLE, POLICY } from '../strategy.js';
import { readout, sampleSize, pts, fmtP } from '../engine.js';
import { log } from '../store.js';

const planner = { base: 4.2, mde: 0.6, traffic: 2000 };
const CALLS = ['ship', 'iterate', 'kill', 'rerun'];
// What a decision does to the bet behind the experiment.
const BET_STATUS = { ship: 'validated', kill: 'killed', iterate: 'proposed', rerun: 'experiment' };

export function render({ state, params }) {
  const id = params.id || state.experiments[0].id;
  const list = state.experiments.map((e) => {
    const r = readout(e);
    return `<tr data-open="${esc(e.id)}" tabindex="0" class="${e.id === id ? 'selected' : ''}">
      <td><b>${esc(e.name)}</b><div class="small muted">${esc(e.id)} · ${esc(e.bet)} · ${esc(e.market)} · ${esc(e.window)}</div></td>
      <td>${esc(e.preReg.metric)}</td>
      <td class="r">${pct(r.test.pc)} → ${pct(r.test.pv)}</td>
      <td>${call(r.call)}</td>
      <td>${e.decision ? `${call(e.decision.call)}<div class="small muted">${esc(e.decision.by)}</div>` : '<span class="pill warn">awaiting decision</span>'}</td></tr>`;
  }).join('');
  const e = state.experiments.find((x) => x.id === id);
  return `
    ${pageHead('Evidence before scale', 'Experiments', 'Every test is pre-registered: hypothesis, primary metric, the smallest effect worth detecting and the guardrails. The readout recommends; a named person decides.')}
    <div class="card"><div class="table-wrap"><table class="table table-click"><thead><tr><th>Experiment</th><th>Primary metric</th><th class="r">Control → variant</th><th>Recommendation</th><th>Decision</th></tr></thead><tbody>${list}</tbody></table></div></div>
    ${e ? detail(e, state) : ''}
    ${section('Plan a test: sample size', plannerHtml(), '<span class="small muted">Two-sided test, 95% confidence, 80% power</span>')}`;
}

function ciBar(r, mde) {
  // Draw the 95% CI of the difference on a symmetric scale around zero.
  const span = Math.max(Math.abs(r.test.ci[0]), Math.abs(r.test.ci[1]), mde) * 1.3;
  const x = (v) => 50 + (v / span) * 50;
  const cls = r.test.ci[0] > 0 ? 'pos' : r.test.ci[1] < 0 ? 'neg' : 'flat';
  return `<div class="ci" role="img" aria-label="95% confidence interval from ${pts(r.test.ci[0])} to ${pts(r.test.ci[1])}">
    <span class="ci-zero" style="left:50%"></span><span class="ci-mde" style="left:${x(mde)}%" title="Minimum detectable effect"></span>
    <span class="ci-range ${cls}" style="left:${x(r.test.ci[0])}%;width:${x(r.test.ci[1]) - x(r.test.ci[0])}%"></span>
    <span class="ci-point" style="left:${x(r.test.diff)}%"></span></div>
    <div class="ci-legend small muted"><span>${pts(-span, 1)}</span><span>0</span><span>${pts(span, 1)}</span></div>`;
}

function detail(e, state) {
  const r = readout(e);
  const bet = state.bets.find((b) => b.id === e.bet);
  return section(`${e.id} · ${e.name}`, `
    <div class="grid-2">
      <div>
        <h3>Pre-registration</h3>
        <dl class="kv">
          <dt>Bet</dt><dd><a href="#/bets?id=${esc(e.bet)}">${esc(e.bet)} ${esc(bet?.name || '')}</a></dd>
          <dt>Hypothesis</dt><dd>${esc(bet?.hypothesis || '')}</dd>
          <dt>Primary metric</dt><dd>${esc(e.preReg.metric)} · baseline ${pct(e.preReg.baselineRate)}</dd>
          <dt>Smallest effect worth detecting</dt><dd>${pts(e.preReg.mde)}</dd>
          <dt>Planned sample</dt><dd>${num(r.planned)} per arm · actual ${num(e.control.n)} / ${num(e.variant.n)} ${r.powered ? '<span class="pill ok">✓ powered</span>' : '<span class="pill warn">under-powered</span>'}</dd>
          <dt>Decision rule</dt><dd>${esc(e.preReg.decisionRule)}</dd>
          <dt>Owner</dt><dd>${esc(e.owner)}</dd>
        </dl>
        <h3>Sample ratio check</h3>
        <p>${r.srm.ok ? '<span class="pill ok">✓ split as planned</span>' : '<span class="pill bad">✕ sample ratio mismatch</span>'} <span class="small">${num(e.assigned.control)} vs ${num(e.assigned.variant)} assigned for a ${pct(1 - e.preReg.split, 0)} / ${pct(e.preReg.split, 0)} split · χ² ${r.srm.chi2.toFixed(1)}, ${fmtP(r.srm.p)} (alarm below p = ${POLICY.stats.srmAlpha})</span></p>
      </div>
      <div>
        <h3>Result</h3>
        <div class="mini-kpis"><div><b>${pct(r.test.pc)}</b><span>control</span></div><div><b>${pct(r.test.pv)}</b><span>variant</span></div><div><b>${pts(r.test.diff)}</b><span>difference</span></div><div><b>${r.test.lift === null ? '–' : `${r.test.lift >= 0 ? '+' : ''}${(r.test.lift * 100).toFixed(0)}%`}</b><span>relative</span></div></div>
        <p class="small">95% confidence interval ${pts(r.test.ci[0])} to ${pts(r.test.ci[1])} · ${fmtP(r.test.p)}</p>
        ${ciBar(r, e.preReg.mde)}
        <h3>Guardrails</h3>
        <table class="table compact"><thead><tr><th>Metric</th><th class="r">Control</th><th class="r">Variant</th><th class="r">Limit</th><th></th></tr></thead><tbody>
        ${r.guardrails.map((g) => { const f = (v) => (v < 1 ? pct(v) : v); return `<tr><td>${esc(g.name)}</td><td class="r">${f(g.control)}</td><td class="r">${f(g.variant)}</td><td class="r muted">${g.direction === 'min' ? '≥' : '≤'} ${f(g.limit)}</td><td>${guard(g.breached)}</td></tr>`; }).join('')}
        </tbody></table>
        <div class="recommend"><span class="small muted">Recommendation</span> ${call(r.call)}<p class="small">${esc(r.reason)}</p></div>
      </div>
    </div>
    <h3>Decision</h3>
    ${e.decision ? `<p>${call(e.decision.call)} by <b>${esc(e.decision.by)}</b> on ${esc(e.decision.at)}${e.decision.call !== r.call ? ' <span class="pill warn">differs from the recommendation</span>' : ''}</p><blockquote>${esc(e.decision.rationale)}</blockquote>` : `
      <div class="form-grid two"><label>Decision<select id="call">${CALLS.map((c) => `<option value="${c}" ${c === r.call ? 'selected' : ''}>${c}${c === r.call ? ' (recommended)' : ''}</option>`).join('')}</select></label>
      <label>Decided by<select id="by"><option value="">Choose…</option>${PEOPLE.map((p) => `<option>${esc(p)}</option>`).join('')}</select></label></div>
      <label>Rationale<textarea id="why" rows="3" placeholder="What the evidence says and what happens next. Required, and longer if you overrule the recommendation."></textarea></label>
      <div class="row"><button class="btn primary" id="decide" data-exp="${esc(e.id)}">Record decision</button><span class="small muted">Ship validates the bet, kill stops it, iterate sends it back to proposed, rerun keeps it in experiment.</span></div>`}`);
}

function plannerHtml() {
  const p1 = planner.base / 100, mde = planner.mde / 100;
  const n = p1 > 0 && mde > 0 && p1 + mde < 1 ? sampleSize(p1, mde) : null;
  return `<div class="calc"><div class="calc-inputs">
      <label>Baseline rate (%)<input type="number" data-plan="base" value="${planner.base}" min="0.1" max="95" step="0.1"></label>
      <label>Smallest effect worth detecting (points)<input type="number" data-plan="mde" value="${planner.mde}" min="0.05" max="50" step="0.05"></label>
      <label>Eligible users per day<input type="number" data-plan="traffic" value="${planner.traffic}" min="10" step="10"></label></div>
    <div class="calc-out">${n ? `<p><b>${num(n)}</b> users per arm · <b>${num(n * 2)}</b> in total</p><p>About <b>${Math.ceil((n * 2) / planner.traffic)}</b> days at ${num(planner.traffic)} eligible users a day.</p>
      <p class="small muted">Halving the effect you want to detect roughly quadruples the sample. Decide the smallest effect that would change the decision before you launch, not after.</p>` : '<p class="muted">Enter a valid rate and effect.</p>'}</div></div>`;
}

export function bind({ root, state, refresh, go }) {
  root.querySelectorAll('[data-open]').forEach((tr) => {
    const open = () => go(`#/experiments?id=${tr.dataset.open}`);
    tr.addEventListener('click', open);
    tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
  });
  root.querySelectorAll('[data-plan]').forEach((el) => el.addEventListener('change', () => { planner[el.dataset.plan] = Number(el.value); refresh(); }));
  root.querySelector('#decide')?.addEventListener('click', async (ev) => {
    const e = state.experiments.find((x) => x.id === ev.target.dataset.exp);
    const r = readout(e);
    const c = root.querySelector('#call').value, by = root.querySelector('#by').value, why = root.querySelector('#why').value.trim();
    const min = c === r.call ? 10 : 60;
    if (!by || why.length < min) return toast(c === r.call ? 'Name who decides and give a short rationale.' : 'Overruling the recommendation needs a full rationale (60+ characters).');
    if (c === 'ship' && r.guardrails.some((g) => g.breached)) return toast('A breached guardrail cannot ship. Kill or iterate instead.');
    e.decision = { call: c, by, at: new Date().toISOString().slice(0, 10), rationale: why.slice(0, 600) };
    const bet = state.bets.find((b) => b.id === e.bet);
    if (bet) { bet.status = BET_STATUS[c]; bet.decidedBy = by; }
    await log(state, by, 'EXPERIMENT_DECIDED', `${e.id} ${c}${c !== r.call ? ` (recommendation was ${r.call})` : ''} → ${e.bet} ${bet ? bet.status : ''}`);
    toast(`${e.id}: ${c}.`);
    refresh();
  });
}
