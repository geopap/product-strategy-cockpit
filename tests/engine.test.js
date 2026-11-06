// Driver model, bet value, product policy, experiment statistics, discovery and roadmap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { model, baseline, targets, betValue, policyCheck, normCdf, normInv, twoProportion, srm, sampleSize, readout, roadmap, gapCoverage, themeStats, guardrailStatus } from '../js/engine.js';
import { BETS, EXPERIMENTS, FEEDBACK, THEMES } from '../js/data.js';
import { GUARDRAILS, POLICY } from '../js/strategy.js';

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);
const bet = (id) => structuredClone(BETS.find((b) => b.id === id));
const exp = (id) => structuredClone(EXPERIMENTS.find((e) => e.id === id));

test('driver model reproduces the baseline and links engagement to retention', () => {
  const m = model(baseline());
  near(m.mau, 418000, 1);
  near(m.revenue, 1848797, 5);
  near(m.northStar, m.mau * 0.22, 1e-6);
  const more = model({ ...baseline(), engagement: 0.25 });
  assert.ok(more.mau > m.mau, 'more engagement keeps more households');
  assert.ok(model(targets()).revenue > 2 * m.revenue, 'the target roughly doubles revenue');
});

test('expected value is value if it works times confidence', () => {
  const v = betValue(bet('B-04'));
  near(v.expectedK, v.fullK * 0.7, 1e-9);
  near(v.roi, v.expectedK / 60, 1e-9);
  assert.ok(v.expectedK > 100 && v.expectedK < 150);
});

test('policy: the first saving is always free', () => {
  const b = { ...bet('B-01'), placement: 'Premium' };
  const p = policyCheck(b, BETS);
  assert.equal(p.ok, false);
  assert.match(p.errors[0], /first saving is always free/);
  const conv = policyCheck({ ...bet('B-03'), placement: 'Free' }, BETS);
  assert.equal(conv.ok, true, 'a conversion bet in Free is a note, not a block');
  assert.equal(conv.warnings.length, 1);
});

test('policy: no partner growth without the consent foundation', () => {
  assert.equal(policyCheck(bet('B-05'), BETS).ok, false);
  const withConsent = BETS.map((b) => (b.id === POLICY.partnerFoundation ? { ...b, status: 'approved' } : b));
  assert.equal(policyCheck(bet('B-05'), withConsent).ok, true);
  assert.match(policyCheck(bet('B-06'), withConsent).errors.join(' '), /guardrail risk/);
});

test('normal distribution helpers', () => {
  near(normCdf(1.96), 0.975, 1e-4);
  near(normCdf(0), 0.5, 1e-7);
  near(normInv(0.975), 1.96, 1e-3);
  near(normInv(0.8), 0.8416, 1e-3);
});

test('two-proportion test, sample ratio check and sample size', () => {
  const t = twoProportion({ n: 24120, conv: 1013 }, { n: 23880, conv: 1230 });
  assert.ok(t.p < 0.001 && t.diff > 0 && t.ci[0] > 0);
  const flat = twoProportion({ n: 1000, conv: 100 }, { n: 1000, conv: 104 });
  assert.ok(flat.p > 0.5 && flat.ci[0] < 0 && flat.ci[1] > 0);
  assert.equal(srm({ control: 24120, variant: 23880 }).ok, true);
  const bad = srm({ control: 12400, variant: 11100 });
  assert.equal(bad.ok, false);
  near(bad.chi2, 71.9, 0.1);
  assert.equal(sampleSize(0.042, 0.006), 18739);
  assert.ok(sampleSize(0.042, 0.003) > 3.5 * sampleSize(0.042, 0.006), 'halving the effect roughly quadruples the sample');
});

test('readouts recommend ship, iterate, kill and rerun for the four experiments', () => {
  assert.equal(readout(exp('EXP-01')).call, 'ship');
  assert.equal(readout(exp('EXP-02')).call, 'iterate');
  const k = readout(exp('EXP-03'));
  assert.equal(k.call, 'kill', 'a breached guardrail beats a significant win');
  assert.ok(k.test.p < 0.05 && k.test.diff > 0);
  const r = readout(exp('EXP-04'));
  assert.equal(r.call, 'rerun', 'a broken split invalidates a result that looks great');
  assert.ok(r.test.diff > 0.05);
});

test('under-powered and flat means keep running', () => {
  const e = { ...exp('EXP-02'), assigned: { control: 2000, variant: 2000 }, control: { n: 2000, conv: 440 }, variant: { n: 2000, conv: 452 } };
  assert.equal(readout(e).call, 'keep running');
});

test('discovery coverage and theme statistics', () => {
  const s = themeStats(THEMES, FEEDBACK);
  assert.equal(FEEDBACK.length, 104);
  assert.equal(s.unthemed.length, 12);
  const th1 = s.stats.find((x) => x.theme.id === 'TH-1');
  assert.equal(th1.size, 12);
  assert.ok(th1.avgRating < 3);
  assert.ok(THEMES.every((t) => t.evidence.every((id) => FEEDBACK.some((f) => f.id === id))), 'every cited item exists');
});

test('roadmap respects capacity, puts foundations first and reports an honest gap', () => {
  const r = roadmap(BETS);
  assert.deepEqual(r.now.map((a) => a.bet.id).sort(), ['B-01', 'B-02', 'B-04']);
  assert.equal(r.next[0].bet.id, 'B-09', 'the consent foundation leads Next');
  const nonFoundation = r.next.filter((a) => !a.bet.foundation).reduce((s, a) => s + a.bet.costK, 0);
  assert.ok(nonFoundation <= POLICY.capacityK);
  assert.ok(r.stopped.some((a) => a.bet.id === 'B-06'));
  const g = gapCoverage(BETS);
  assert.ok(g.share > 0.2 && g.share < 0.6);
  assert.equal(g.drivers.find((d) => d.key === 'newUsers').share, 0, 'no bet addresses new households');
});

test('guardrails: the app rating is breached today', () => {
  const g = guardrailStatus(GUARDRAILS);
  assert.deepEqual(g.filter((x) => x.breached).map((x) => x.id), ['rating']);
});
