import { esc, section, pageHead, eur, pct, betStatus, placement, toast, num } from '../ui.js';
import { DRIVERS, PEOPLE, POLICY } from '../strategy.js';
import { assessBets, betValue, policyCheck, pts } from '../engine.js';
import { fmtDriver } from '../handover.js';
import { log, nextId } from '../store.js';

let showForm = false;
const draft = { name: '', theme: '', driver: '', uplift: '', confidence: 0.5, costK: '', placement: 'Free', guardrailRisk: 'none', hypothesis: '' };

const upliftText = (k, u) => (DRIVERS[k].unit === 'pct' ? pts(u) : DRIVERS[k].unit === 'eur' ? `+€${u.toFixed(2)}` : `+${num(u)}`);

export function render({ state, params }) {
  const assessed = assessBets(state.bets);
  const themeName = (id) => state.themes.find((t) => t.id === id)?.name || id;
  const rows = assessed.map(({ bet: b, value: v, policy: p }) => `
    <tr data-open="${esc(b.id)}" tabindex="0" class="${params.id === b.id ? 'selected' : ''}">
      <td><b>${esc(b.name)}</b><div class="small muted">${esc(b.id)} · ${esc(b.theme)} ${esc(themeName(b.theme))}${b.source ? ` · ${esc(b.source)}` : ''}</div></td>
      <td>${esc(DRIVERS[b.driver].name)}<div class="small muted">${upliftText(b.driver, b.uplift)} if it works</div></td>
      <td>${placement(b.placement)}</td>
      <td class="r">${pct(b.confidence, 0)}</td>
      <td class="r"><b>${eur(v.expectedK)}</b><div class="small muted">of ${eur(v.fullK)}</div></td>
      <td class="r">${eur(b.costK)}</td>
      <td class="r">${v.roi === null ? '–' : `€${v.roi.toFixed(2)}`}</td>
      <td>${betStatus(b.status)}</td>
      <td>${['killed', 'parked'].includes(b.status) ? '<span class="muted">–</span>' : p.errors.length ? `<span class="pill bad" title="${esc(p.errors.join(' '))}">✕ ${p.errors.length} blocking</span>` : p.warnings.length ? `<span class="pill warn">${p.warnings.length} note</span>` : '<span class="pill ok">✓</span>'}</td>
    </tr>`).join('');

  const sel = assessed.find((a) => a.bet.id === params.id);
  return `
    ${pageHead('From opportunities to bets', 'Bets', 'Every bet names the driver it should move, by how much, how sure we are and what it costs. Expected value is the revenue effect if it works, times the confidence that it will. Product policy is checked before anyone can approve.')}
    <div class="row head-actions"><button class="btn primary" id="new">${showForm ? 'Close the form' : '+ New bet from a confirmed theme'}</button>
      <span class="small muted">Ranked by status, then by expected value per € of cost. Click a bet for details and a decision.</span></div>
    ${showForm ? newBetForm(state) : ''}
    <div class="card"><div class="table-wrap"><table class="table table-click">
      <thead><tr><th>Bet</th><th>Driver</th><th>Placement</th><th class="r">Confidence</th><th class="r">Expected value / yr</th><th class="r">Cost</th><th class="r">Value per €</th><th>Status</th><th>Policy</th></tr></thead>
      <tbody>${rows}</tbody></table></div></div>
    ${sel ? detail(sel, state) : ''}`;
}

function detail({ bet: b, value: v, policy: p }, state) {
  const exp = b.experiment && state.experiments.find((e) => e.id === b.experiment);
  const theme = state.themes.find((t) => t.id === b.theme);
  const open = b.status === 'proposed';
  return section(`${b.id} · ${b.name}`, `
    <div class="grid-2">
      <div>
        <p><b>Hypothesis.</b> ${esc(b.hypothesis)}</p>
        <dl class="kv">
          <dt>Opportunity</dt><dd>${esc(b.theme)} ${esc(theme?.name || '')} ${theme ? `<span class="small muted">(${theme.evidence.length} pieces of evidence, ${esc(theme.status)})</span>` : ''}</dd>
          <dt>Driver</dt><dd>${esc(DRIVERS[b.driver].name)}: ${fmtDriver(b.driver, DRIVERS[b.driver].baseline)} → ${fmtDriver(b.driver, DRIVERS[b.driver].baseline + b.uplift)} if it works</dd>
          <dt>Share of driver gap</dt><dd>${v.gapShare === null || !isFinite(v.gapShare) ? '–' : pct(v.gapShare, 0)} of the distance to target (confidence-weighted)</dd>
          <dt>Value if it works</dt><dd>${eur(v.fullK)} a year</dd>
          <dt>Expected value</dt><dd><b>${eur(v.expectedK)}</b> a year at ${pct(b.confidence, 0)} confidence${v.northStar >= 1 ? ` · north star +${num(v.northStar)} households` : ''}</dd>
          <dt>Cost</dt><dd>${eur(b.costK)} · €${v.roi?.toFixed(2) ?? '–'} expected value per € in year one</dd>
          <dt>Placement</dt><dd>${placement(b.placement)} <span class="small muted">policy for this driver: ${esc(POLICY.placementByDriver[b.driver])}</span></dd>
          <dt>Depends on</dt><dd>${b.dependsOn?.length ? b.dependsOn.map((d) => `<code>${esc(d)}</code>`).join(' ') + ' <span class="small muted">(Portfolio Office initiatives)</span>' : '–'}</dd>
          <dt>Experiment</dt><dd>${exp ? `<a href="#/experiments?id=${esc(exp.id)}">${esc(exp.id)} ${esc(exp.name)}</a>` : 'none yet'}</dd>
          ${b.decidedBy ? `<dt>Decided by</dt><dd>${esc(b.decidedBy)}${b.rationale ? ` · ${esc(b.rationale)}` : ''}</dd>` : ''}
        </dl>
      </div>
      <div>
        <h3>Policy checks</h3>
        <ul class="issues">${p.errors.map((e) => `<li><span class="pill bad">blocking</span> ${esc(e)}</li>`).join('')}${p.warnings.map((w) => `<li><span class="pill warn">note</span> ${esc(w)}</li>`).join('')}${!p.errors.length && !p.warnings.length ? '<li><span class="pill ok">✓</span> Placement, consent foundation and guardrail risk are in line with product policy.</li>' : ''}</ul>
        <h3>Decision</h3>
        ${open ? `<div class="decide-form">
          <label>Decided by<select id="by"><option value="">Choose…</option>${PEOPLE.map((x) => `<option>${esc(x)}</option>`).join('')}</select></label>
          <label>Rationale<textarea id="why" rows="3" placeholder="Why this decision, and what would change it"></textarea></label></div>
          <div class="row"><button class="btn primary" data-decide="approved" ${p.ok ? '' : 'disabled title="Resolve the blocking policy checks first"'}>Approve</button>
          <button class="btn" data-decide="parked">Park</button><button class="btn danger" data-decide="killed">Kill</button></div>
          ${p.ok ? '' : '<p class="small warn-text">Approval is blocked until the policy checks pass.</p>'}`
        : `<p>${esc({ approved: 'Approved. Hand it over to the AI Portfolio Office from the strategy review.', experiment: 'Running as an experiment: the decision follows the readout.', validated: 'Validated by an experiment. Ready to hand over.', killed: 'Killed. It stays here as a record of what we learnt.', parked: 'Parked.' }[b.status] || '')}</p>
          ${b.status === 'parked' ? '<button class="btn small" data-reopen>Reopen</button>' : ''}`}
      </div>
    </div>`, `<a class="btn small ghost" href="#/bets">Close</a>`);
}

function newBetForm(state) {
  const confirmed = state.themes.filter((t) => t.status === 'confirmed');
  const d = { ...draft, driver: draft.driver || confirmed.find((t) => t.id === draft.theme)?.driver || 'activation' };
  const preview = Number(draft.uplift) > 0 ? betValue({ driver: d.driver, uplift: Number(draft.uplift) / (DRIVERS[d.driver].unit === 'pct' ? 100 : 1), confidence: Number(draft.confidence), costK: Number(draft.costK) || 0 }) : null;
  const check = policyCheck({ ...d, guardrailRisk: draft.guardrailRisk }, state.bets);
  return `<section class="card"><header class="card-head"><h2>New bet</h2><span class="small muted">Only confirmed themes can carry a bet</span></header>
    <div class="form-grid two">
      <label>Name<input data-d="name" value="${esc(draft.name)}" maxlength="70" placeholder="What we will build or change"></label>
      <label>Opportunity theme<select data-d="theme"><option value="">Choose a confirmed theme…</option>${confirmed.map((t) => `<option value="${esc(t.id)}" ${draft.theme === t.id ? 'selected' : ''}>${esc(t.id)} ${esc(t.name)}</option>`).join('')}</select></label>
      <label>Driver<select data-d="driver">${Object.entries(DRIVERS).map(([k, x]) => `<option value="${k}" ${d.driver === k ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
      <label>Uplift if it works (${DRIVERS[d.driver].unit === 'pct' ? 'points' : DRIVERS[d.driver].unit === 'eur' ? '€' : 'households'})<input data-d="uplift" type="number" step="any" min="0" value="${esc(draft.uplift)}"></label>
      <label>Confidence it works: <b>${pct(Number(draft.confidence), 0)}</b><input data-d="confidence" type="range" min="0.1" max="0.9" step="0.05" value="${draft.confidence}"></label>
      <label>Cost (€k)<input data-d="costK" type="number" min="0" step="5" value="${esc(draft.costK)}"></label>
      <label>Placement<select data-d="placement">${['Free', 'Premium', 'Partner', 'Platform'].map((x) => `<option ${draft.placement === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      <label>Guardrail risk<select data-d="guardrailRisk">${['none', 'low', 'high'].map((x) => `<option ${draft.guardrailRisk === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
    </div>
    <label>Hypothesis<textarea data-d="hypothesis" rows="2" placeholder="If we …, then … will …, because …">${esc(draft.hypothesis)}</textarea></label>
    <div class="row">${preview ? `<span>Expected value <b>${eur(preview.expectedK)}</b> a year${preview.roi !== null && Number(draft.costK) ? ` · €${preview.roi.toFixed(2)} per €` : ''}</span>` : '<span class="small muted">Enter an uplift to see the expected value.</span>'}
      ${check.errors.map((e) => `<span class="pill bad">${esc(e)}</span>`).join('')}${check.warnings.map((w) => `<span class="pill warn">${esc(w)}</span>`).join('')}</div>
    <div class="row"><button class="btn primary" id="save-bet">Add bet as proposed</button></div></section>`;
}

export function bind({ root, state, refresh, go }) {
  root.querySelector('#new').addEventListener('click', () => { showForm = !showForm; refresh(); });
  root.querySelectorAll('[data-open]').forEach((tr) => {
    const open = () => go(`#/bets?id=${tr.dataset.open}`);
    tr.addEventListener('click', open);
    tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
  });
  root.querySelectorAll('[data-d]').forEach((el) => el.addEventListener(el.tagName === 'SELECT' || el.type === 'range' ? 'change' : 'input', () => {
    draft[el.dataset.d] = el.value;
    if (el.dataset.d === 'theme') draft.driver = state.themes.find((t) => t.id === el.value)?.driver || draft.driver;
    if (el.tagName === 'SELECT' || el.type === 'range') refresh();
  }));
  root.querySelectorAll('[data-d]').forEach((el) => { if (el.tagName === 'INPUT' && el.type !== 'range') el.addEventListener('change', () => refresh()); });
  root.querySelector('#save-bet')?.addEventListener('click', async () => {
    const driver = draft.driver || 'activation';
    const uplift = Number(draft.uplift) / (DRIVERS[driver].unit === 'pct' ? 100 : 1);
    if (!draft.name.trim() || !draft.theme || !(uplift > 0) || !(Number(draft.costK) >= 0) || !draft.hypothesis.trim()) return toast('Name, theme, uplift, cost and hypothesis are required.');
    const bet = { id: nextId(state.bets, 'B'), name: draft.name.trim().slice(0, 70), theme: draft.theme, driver, uplift, confidence: Number(draft.confidence), costK: Number(draft.costK), placement: draft.placement, guardrailRisk: draft.guardrailRisk, status: 'proposed', dependsOn: [], hypothesis: draft.hypothesis.trim().slice(0, 400) };
    state.bets.push(bet);
    await log(state, 'user', 'BET_PROPOSED', `${bet.id} ${bet.name} · ${driver} ${uplift} at ${bet.confidence}`);
    Object.assign(draft, { name: '', theme: '', driver: '', uplift: '', confidence: 0.5, costK: '', placement: 'Free', guardrailRisk: 'none', hypothesis: '' });
    showForm = false;
    go(`#/bets?id=${bet.id}`);
  });
  root.querySelectorAll('[data-decide]').forEach((b) => b.addEventListener('click', async () => {
    const by = root.querySelector('#by').value, why = root.querySelector('#why').value.trim();
    if (!by || why.length < 10) return toast('Name who decides and give a short rationale.');
    const bet = state.bets.find((x) => x.id === new URLSearchParams(location.hash.split('?')[1]).get('id'));
    bet.status = b.dataset.decide; bet.decidedBy = by; bet.rationale = why.slice(0, 400);
    await log(state, by, `BET_${b.dataset.decide.toUpperCase()}`, `${bet.id} ${bet.name}: ${why.slice(0, 200)}`);
    toast(`${bet.id} ${b.dataset.decide}.`);
    refresh();
  }));
  root.querySelector('[data-reopen]')?.addEventListener('click', async () => {
    const bet = state.bets.find((x) => x.id === new URLSearchParams(location.hash.split('?')[1]).get('id'));
    bet.status = 'proposed';
    await log(state, 'user', 'BET_REOPENED', `${bet.id} ${bet.name}`);
    refresh();
  });
}
