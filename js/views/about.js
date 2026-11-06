import { section, pageHead } from '../ui.js';

export function render() {
  return `
    ${pageHead('About this project', 'Product strategy that shows its working', 'Most product strategies live in slides, and most roadmaps are feature lists with dates. Neither shows why a bet was chosen, what evidence supports it, or whether the plan is enough to reach the target. This cockpit keeps that chain in one place.')}
    <div class="grid-2">
      ${section('The problem', `<ul class="checklist">
        <li><b>Strategy and roadmap are disconnected.</b> Company goals sit in one deck, the roadmap in another tool, and nobody can say which feature moves which number.</li>
        <li><b>Discovery is anecdotal.</b> The loudest quote wins. Feedback from stores, support and sales is never put together.</li>
        <li><b>Commercial pressure has no counterweight.</b> "More offers" always looks good on the metric it targets; the cost shows up in ratings and trust later.</li>
        <li><b>Experiments are read generously.</b> Broken splits, under-powered tests and moved goalposts turn noise into launches.</li>
        <li><b>Nobody checks whether the plan adds up.</b> The roadmap is full, but it would not reach the target even if everything worked.</li></ul>`)}
      ${section('The loop', `<ol class="reasoning">
        <li><b>Strategy</b>: goals broken into a north star and a driver tree, with OKRs and guardrails.</li>
        <li><b>Discovery</b>: AI groups feedback into themes and cites its evidence; a person confirms each theme.</li>
        <li><b>Bets</b>: each bet names its driver, uplift, confidence and cost; expected value ranks them; product policy is checked before approval.</li>
        <li><b>Experiments</b>: pre-registered, checked for broken splits and guardrails; the readout recommends, a person decides.</li>
        <li><b>Outcome roadmap</b>: Now / Next / Later by outcome, filled within capacity, with an honest view of how much of the target it covers.</li>
        <li><b>Review</b>: a quarterly pack, a signed decision, and approved bets handed to the AI Portfolio Office.</li></ol>`)}
    </div>
    <div class="grid-2">
      ${section('Design choices', `<ul class="checklist">
        <li><b>Users and revenue in one model.</b> Partner revenue and subscriptions share a tree with retention and the north star, so a trade-off is visible as a trade-off.</li>
        <li><b>Policy as code.</b> "The first saving is always free" and "no partner growth without consent" are rules that block approval, not slogans.</li>
        <li><b>AI where it removes work.</b> Reading a hundred pieces of feedback is the work AI takes on; deciding what matters stays with the team.</li>
        <li><b>No backend needed.</b> Everything runs in the browser; the optional Claude call uses your own key.</li></ul>`)}
      ${section('Try it', `<ol class="reasoning">
        <li>On <a href="#/strategy">Strategy</a>, move the drivers in the simulator, then click <i>Apply planned bets</i>.</li>
        <li>On <a href="#/discovery">Discovery</a>, confirm one of the two themes proposed by AI.</li>
        <li>On <a href="#/experiments">Experiments</a>, see why EXP-04 looks like a win but must be rerun, and record a decision on EXP-01.</li>
        <li>On <a href="#/bets">Bets</a>, try to approve B-05 and see which policy blocks it, then approve B-09 first.</li>
        <li>On <a href="#/review">Strategy review</a>, sign off the quarter and hand the approved bets over to the Portfolio Office.</li></ol>
        <p class="small muted">All data is synthetic; Varnholt Group is a fictional company. Part of an AI life cycle with <a href="https://geopap.github.io/ai-use-case-intake/" target="_blank" rel="noopener">AI Use-Case Intake</a>, <a href="https://github.com/geopap/claude-code-sdlc" target="_blank" rel="noopener">Claude Code SDLC</a>, <a href="https://geopap.github.io/ai-eval-workbench/" target="_blank" rel="noopener">AI Eval Workbench</a> and <a href="https://geopap.github.io/ai-portfolio-office/" target="_blank" rel="noopener">AI Portfolio Office</a>.</p>`)}
    </div>
    <p class="small muted">Built by George Papadongonas. Source on <a href="https://github.com/geopap/product-strategy-cockpit" target="_blank" rel="noopener">GitHub</a>.</p>`;
}
