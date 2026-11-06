import { esc, section, pageHead, eur, pct, betStatus, placement, meter, tile } from '../ui.js';
import { DRIVERS, PRODUCT } from '../strategy.js';
import { roadmap, gapCoverage, pts } from '../engine.js';
import { fmtDriver } from '../handover.js';

const outcome = (b) => {
  const u = DRIVERS[b.driver].unit;
  const f = (x) => (u === 'pct' ? pts(x) : u === 'eur' ? `+€${x.toFixed(2)}` : `+${Math.round(x)}`);
  return `${DRIVERS[b.driver].name}: ${f(b.uplift)} if it works (${f(b.uplift * b.confidence)} expected)`;
};

export function render({ state }) {
  const r = roadmap(state.bets);
  const g = gapCoverage(state.bets);
  const card = ({ bet: b, value: v, policy: p }) => `<a class="rm-card" href="#/bets?id=${esc(b.id)}">
    <span class="small muted">${esc(b.id)} · ${placement(b.placement)} ${betStatus(b.status)}</span>
    <b>${esc(b.name)}</b>
    <span class="small">${esc(outcome(b))}</span>
    <span class="small muted">${eur(v.expectedK)} expected · ${eur(b.costK)} cost${b.foundation ? ' · foundation' : ''}</span>
    ${b.status === 'proposed' && p.errors.length ? `<span class="small warn-text">${esc(p.errors[0])}</span>` : ''}${b.rationale ? `<span class="small muted">${esc(b.rationale)}</span>` : ''}</a>`;
  const col = (title, sub, items) => `<div class="rm-col"><header><h3>${esc(title)}</h3><span class="small muted">${sub}</span></header>${items.map(card).join('') || '<p class="small muted">Nothing here.</p>'}</div>`;

  const drivers = g.drivers.map((d) => `<div class="bar-row"><span class="bar-label">${esc(DRIVERS[d.key].name)}</span>
    <span>${meter((d.share || 0) * 100, 'Share of the gap covered')}</span><span class="small ${d.share === 0 ? 'warn-text' : ''}">${pct(d.share || 0, 0)} of ${fmtDriver(d.key, d.gap)}</span></div>`).join('');

  return `
    ${pageHead(`${PRODUCT.name} · ${PRODUCT.period.from} → ${PRODUCT.period.to}`, 'Outcome roadmap', 'Organised by the outcome each bet should move, not by feature or date. Now is in progress, Next fills the build capacity of the next two quarters by expected value per €, Later waits for capacity or evidence.')}
    <div class="tiles">
      ${tile('of the revenue gap covered', pct(g.share, 0), `${eur(g.coveredK)} expected of ${eur(g.gapK)}`, g.share < 0.6 ? 'warn' : 'good')}
      ${tile('capacity used', `${eur(r.usedK)}`, `of ${eur(r.capacityK)} for the next two quarters`)}
      ${tile('in progress', r.now.length, 'approved, validated or in experiment')}
      ${tile('stopped', r.stopped.length, 'killed, parked or blocked by a guardrail')}
    </div>
    <div class="rm">
      ${col('Now', 'in progress', r.now)}
      ${col('Next', `${eur(r.usedK)} of ${eur(r.capacityK)} capacity`, r.next)}
      ${col('Later', 'needs capacity or evidence', r.later)}
      ${col('Stopped', 'and why', r.stopped)}
    </div>
    ${section('Is the roadmap enough to reach the target?', `${drivers}
      <p class="small pad">${g.share < 0.6 ? `<b>No.</b> Now and Next are expected to deliver ${pct(g.share, 0)} of the revenue gap. That is a strategy decision for the quarterly review, not something to hide in a roadmap.` : 'The planned bets cover most of the gap.'} Expected values are confidence-weighted; the full picture is in the <a href="#/strategy">driver simulator</a> under "Apply planned bets".</p>`)}`;
}
