import { esc, section, pageHead, download, toast, tile, eur, pct } from '../ui.js';
import { PEOPLE, PRODUCT } from '../strategy.js';
import { assessBets, gapCoverage, guardrailStatus, model, baseline } from '../engine.js';
import { reviewMarkdown, decisionsNeeded, toInitiative, canHandOver } from '../handover.js';
import { GUARDRAILS } from '../strategy.js';
import { log } from '../store.js';

const QUARTER = 'Q4 2026';

export function render({ state }) {
  const md = reviewMarkdown(state, QUARTER);
  const signed = state.reviewSignoff[QUARTER];
  const decisions = decisionsNeeded(state);
  const ready = assessBets(state.bets).filter((a) => canHandOver(a.bet));
  const g = gapCoverage(state.bets);
  const breached = guardrailStatus(GUARDRAILS).filter((x) => x.breached).length;
  const history = state.reviews.map((r) => `<div class="flag"><div class="flag-head"><b>${esc(r.quarter)}</b> <span class="small muted">signed off by ${esc(r.signedBy)} on ${esc(r.at)}</span></div><div class="flag-body small">${esc(r.summary)}</div></div>`).join('');

  return `
    ${pageHead(`${PRODUCT.name} · quarterly`, `Strategy review ${QUARTER}`, 'Once a quarter the leadership team looks at the drivers, what the experiments taught us, and whether the roadmap still reaches the target. The pack is generated from the same data; a person signs it off.')}
    <div class="tiles">
      ${tile('revenue run-rate', eur(model(baseline()).revenue / 1000))}
      ${tile('gap covered by plan', pct(g.share, 0), '', g.share < 0.6 ? 'warn' : 'good')}
      ${tile('guardrails breached', breached, '', breached ? 'bad' : 'good')}
      ${tile('decisions needed', decisions.length, '', decisions.length ? 'warn' : 'good')}
    </div>
    <div class="grid-2 wide-left">
      ${section('Review pack', `<pre class="facts review-md">${esc(md)}</pre>`, `<button class="btn small" id="export-md">Download Markdown</button>`)}
      <div>
        ${section('Sign-off', signed ? `<p><span class="pill ok">✓ Signed off</span> by <b>${esc(signed.by)}</b> on ${esc(signed.at)}</p><blockquote>${esc(signed.note)}</blockquote>` : `
          <p class="small">Signing off confirms the drivers, the roadmap and the decisions in this pack. ${decisions.length ? `There ${decisions.length === 1 ? 'is' : 'are'} ${decisions.length} open decision${decisions.length === 1 ? '' : 's'}: record how each is handled in the note.` : ''}</p>
          <label>Signed off by<select id="by"><option value="">Choose…</option>${PEOPLE.map((p) => `<option>${esc(p)}</option>`).join('')}</select></label>
          <label>Decisions and note<textarea id="note" rows="4" placeholder="For example: target kept; discovery sprint on acquisition funded; partner offers stay frozen until rating ≥ 4.5."></textarea></label>
          <button class="btn primary" id="sign">Sign off ${QUARTER}</button>`)}
        ${section('Hand over to the AI Portfolio Office', `
          <p class="small">Approved and validated bets become initiatives in the <a href="https://geopap.github.io/ai-portfolio-office/" target="_blank" rel="noopener">AI Portfolio Office</a>, where delivery, budget and confirmed value are tracked. Import the file there with <i>Audit trail &amp; data → Add to portfolio</i>.</p>
          ${ready.length ? `<ul class="issues">${ready.map((a) => `<li><code>VH-${esc(a.bet.id.slice(2))}</code> ${esc(a.bet.name)} · ${eur(a.value.expectedK)} expected · ${eur(a.bet.costK)} budget</li>`).join('')}</ul>
            <button class="btn" id="handover">Download ${ready.length} initiative${ready.length === 1 ? '' : 's'} (JSON)</button>` : '<p class="muted small">No approved or validated bets yet. Approve a bet, or ship an experiment, to hand it over.</p>'}`)}
        ${section('Previous reviews', history)}
      </div>
    </div>`;
}

export function bind({ root, state, refresh }) {
  root.querySelector('#export-md').addEventListener('click', () => download(`varnholt-home-strategy-review-${QUARTER.replace(' ', '-')}.md`, reviewMarkdown(state, QUARTER), 'text/markdown'));
  root.querySelector('#sign')?.addEventListener('click', async () => {
    const by = root.querySelector('#by').value, note = root.querySelector('#note').value.trim();
    if (!by || note.length < 20) return toast('Name who signs off and record the decisions (20+ characters).');
    state.reviewSignoff[QUARTER] = { by, at: new Date().toISOString().slice(0, 10), note: note.slice(0, 800) };
    await log(state, by, 'REVIEW_SIGNED_OFF', `${QUARTER}: ${note.slice(0, 200)}`);
    toast(`${QUARTER} review signed off.`);
    refresh();
  });
  root.querySelector('#handover')?.addEventListener('click', async () => {
    const ready = assessBets(state.bets).filter((a) => canHandOver(a.bet));
    const initiatives = ready.map((a) => toInitiative(a.bet, a.value, a.bet.decidedBy));
    download('varnholt-home-initiatives.json', JSON.stringify(initiatives, null, 2), 'application/json');
    await log(state, 'user', 'HANDED_OVER', `${initiatives.length} initiatives to the Portfolio Office: ${initiatives.map((i) => i.id).join(', ')}`);
    refresh();
  });
}
