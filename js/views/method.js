import { esc, section, pageHead } from '../ui.js';
import { DRIVERS, MODEL, POLICY } from '../strategy.js';

export function render() {
  return `
    ${pageHead('How the numbers work', 'Method', 'Every number in the cockpit comes from a rule on this page. The rules are plain code in this repository, so they can be read and challenged.')}
    <div class="grid-2">
      ${section('1 · Driver model', `<p>Revenue is modelled as a steady-state run-rate from seven drivers:</p>
        <pre class="rules">MAU          = new households × activation ÷ (1 − retention)
retention    = retention + ${MODEL.engagementToRetention} × (engagement − baseline engagement)
north star   = MAU × weekly saving action rate
subscribers  = MAU × Premium conversion
revenue      = subscribers × net revenue × 12 + MAU × partner revenue per MAU × 12</pre>
        <p class="small muted">Steady state means the level the business settles at if the drivers hold; it is reached over months, not instantly. Treat it as a way to compare bets, not as a forecast.</p>`)}
      ${section('2 · Expected value of a bet', `<pre class="rules">value if it works = revenue(driver + uplift) − revenue(today)
expected value    = value if it works × confidence
value per €       = expected value ÷ build cost</pre>
        <p class="small">Confidence is a stated probability, not a feeling. A confirmed theme with many pieces of evidence, a working competitor pattern or a previous experiment justifies more of it.</p>`)}
      ${section('3 · Product policy as code', `<ul class="issues">
        <li><b>The first saving is always free.</b> Bets that move ${['newUsers', 'activation', 'retention', 'engagement'].map((k) => esc(DRIVERS[k].name.toLowerCase())).join(', ')} must not sit behind the paywall. Breaking this blocks approval.</li>
        <li><b>No partner growth without consent.</b> Partner bets need ${esc(POLICY.partnerFoundation)} (consent centre) approved first.</li>
        <li><b>Guardrails beat drivers.</b> A bet with high guardrail risk needs an experiment that proves the guardrails hold. A breached guardrail in an experiment cannot ship.</li>
        <li><b>Only confirmed themes carry bets.</b> AI proposes themes; a named person confirms them.</li>
        <li><b>Capacity is real.</b> Next is filled up to €${POLICY.capacityK}k by value per €; foundations go first.</li></ul>`)}
      ${section('4 · Experiments', `<ul class="issues">
        <li><b>Pre-registration.</b> Metric, smallest effect worth detecting, guardrails and decision rule are fixed before launch.</li>
        <li><b>Sample size.</b> Two-proportion test, two-sided, α = ${POLICY.stats.alpha}, power ${POLICY.stats.power * 100}%.</li>
        <li><b>Sample ratio check.</b> χ² test on assignment; below p = ${POLICY.stats.srmAlpha} the result is invalid, however good it looks.</li>
        <li><b>Readout.</b> Difference with a 95% confidence interval (unpooled) and a pooled z-test.</li>
        <li><b>Recommendation order:</b> rerun if the split is broken → kill if a guardrail is breached → ship if significant and positive → keep running if under-powered → iterate if powered and flat.</li>
        <li><b>A person decides.</b> Overruling the recommendation needs a longer written rationale.</li></ul>`)}
      ${section('5 · AI-assisted discovery', `<ul class="issues">
        <li>Claude groups feedback into themes and must cite the feedback IDs behind each one.</li>
        <li>Cited IDs are checked against the input; invented ones are dropped, and a theme with fewer than three real pieces of evidence is discarded.</li>
        <li>Emails and phone numbers are redacted before anything is sent. Feedback is wrapped as untrusted data.</li>
        <li>Themes from the model start as <i>proposed</i>. Only a named person can confirm one.</li>
        <li>The model never estimates value, cost or confidence: those are the product team's accountable inputs.</li></ul>`)}
      ${section('6 · Further reading', `<ul class="issues">
        <li>Teresa Torres, <i>Continuous Discovery Habits</i>: opportunity solution trees.</li>
        <li>Ron Kohavi, Diane Tang, Ya Xu, <i>Trustworthy Online Controlled Experiments</i>: guardrails and sample ratio mismatch.</li>
        <li>John Cutler and the North Star Framework: metric trees.</li>
        <li>Marty Cagan, <i>Inspired</i> and <i>Transformed</i>: outcome-based roadmaps and product operating models.</li></ul>`)}
    </div>`;
}
