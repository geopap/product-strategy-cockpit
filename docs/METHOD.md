# Method

> Illustrative. The driver model compares bets; it is not a forecast.

## 1. Strategy: north star and driver tree

The north star is **weekly saving households**: households that act on at least one saving recommendation in a week. It rises only when people actually save energy, so it serves customers, the climate goal and revenue at once.

Revenue is a steady-state run-rate from seven drivers (`js/strategy.js`, `js/engine.js`):

```
MAU          = new households × activation ÷ (1 − retention)
retention    = retention + 0.05 × (engagement − baseline engagement)
north star   = MAU × weekly saving action rate
subscribers  = MAU × Premium conversion
revenue      = subscribers × net revenue × 12 + MAU × partner revenue per MAU × 12
```

Steady state means the level the business settles at if the drivers hold. It is reached over months, so treat it as a way to compare options, not as a forecast. The engagement-to-retention link is a stated assumption that can be challenged.

**Guardrails** are metrics that must not get worse while the team chases the drivers: app rating, partner offer opt-out, Premium churn and support contacts.

## 2. Discovery

1. Collect feedback from app stores, surveys, support, sales and interviews.
2. AI proposes opportunity themes and cites the feedback IDs behind each one.
3. The app checks the citations: invented IDs are dropped, and themes with fewer than three real pieces of evidence are discarded.
4. A named person confirms, renames or rejects each theme. Only confirmed themes can carry bets.

Each theme maps to exactly one driver, so every opportunity is tied to a number.

## 3. Bets and expected value

```
value if it works = revenue(driver + uplift) − revenue(today)
expected value    = value if it works × confidence
value per €       = expected value ÷ build cost
```

**Product policy as code**, checked before approval:

| Rule | Effect |
|---|---|
| The first saving is always free | Bets that move new households, activation, retention or engagement cannot sit behind the paywall (blocking) |
| No partner growth without consent | Partner bets need the consent centre (B-09) approved first (blocking) |
| Guardrails beat drivers | A bet with high guardrail risk needs an experiment that proves the guardrails hold (blocking) |
| Usual placement | Conversion bets usually sit in Premium, partner bets in Partner; differences are flagged (note) |

## 4. Experiments

| Step | Rule |
|---|---|
| Pre-registration | Primary metric, smallest effect worth detecting, guardrails and decision rule fixed before launch |
| Sample size | Two-proportion test, two-sided, α = 0.05, power 80% |
| Sample ratio check | χ² goodness of fit on assignment; below p = 0.001 the result is invalid |
| Result | Difference with a 95% confidence interval (unpooled) and a pooled z-test |
| Recommendation | rerun if the split is broken → kill if a guardrail is breached → ship if significant and positive → keep running if under-powered → iterate if powered and flat |
| Decision | A named person; overruling the recommendation needs a longer written rationale; a breached guardrail cannot ship |

A *ship* decision validates the bet, *kill* stops it, *iterate* sends it back to proposed, and *rerun* keeps it in experiment.

## 5. Outcome roadmap

- **Now**: approved, validated or in experiment.
- **Next**: proposed bets ranked by expected value per €, filled up to the build capacity of the next two quarters (€600k). Foundations go first, regardless of capacity, because other bets depend on them.
- **Later**: proposed bets that do not fit.
- **Stopped**: killed, parked, or blocked by a guardrail.

**Gap coverage**: the confidence-weighted uplift of Now and Next, applied to the driver model, compared with the revenue gap to target. Coverage is also shown per driver, so a driver with no bets is visible.

## 6. Quarterly review and hand-over

The review pack is generated from the same data: drivers against target, guardrails, what each experiment taught us, the roadmap, and the decisions needed. A named person signs it off.

Approved and validated bets export as initiatives in the [AI Portfolio Office](https://github.com/geopap/ai-portfolio-office) data model (`js/handover.js`). The mapping:

- the budget is the bet's cost
- net sales is the value if it works
- EBITDA uses a 70% contribution margin
- dependencies point to existing portfolio initiatives
- the format passes the same validation the Portfolio Office applies on import.
