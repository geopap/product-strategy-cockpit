// The strategy as data: goals, north-star metric, driver tree, guardrails, OKRs and product
// policies for Varnholt Home, a fictional freemium app. Versioned with the strategy, not the code.

export const STRATEGY_VERSION = '2027.1';

export const COMPANY = { name: 'Varnholt Group', tagline: 'Home energy & smart living · 9 European markets' };

export const PRODUCT = {
  name: 'Varnholt Home',
  pitch: 'The energy app for every home: see what your home uses, get a personal saving plan, and run your heat pump on the cheapest hours.',
  markets: ['DE', 'AT', 'CH', 'NL'],
  tiers: {
    Free: 'Usage insights, weekly saving tips, the first personal saving',
    Premium: '€4.99 a month: personal saving plan, tariff autopilot, heat-pump scheduling, multi-home',
    Partner: 'Installer and product offers inside the app: solar, insulation, heat-pump servicing',
  },
  period: { from: 'Q3 2026', to: 'Q4 2027' },
  asOf: '2026-11-03',
};

export const GOALS = [
  { id: 'G1', text: 'Make Varnholt Home the daily energy companion of every Varnholt household, and the way new households find us.' },
  { id: 'G2', text: 'Double digital revenue to a €3.9m run-rate by Q4 2027, from subscriptions and partner offers in equal measure.' },
  { id: 'G3', text: 'Earn trust: no growth that costs us app rating, consent or customer confidence.' },
];

// Driver tree. Values are monthly rates unless stated. `history` = last four quarters (Q4 2025 → Q3 2026).
export const DRIVERS = {
  newUsers:   { name: 'New households / month', unit: 'count', baseline: 66000, target: 70000, history: [58000, 61000, 64000, 66000], placement: 'Free', step: 1000, min: 40000, max: 100000 },
  activation: { name: 'Activation (saving within 7 days)', unit: 'pct', baseline: 0.38, target: 0.46, history: [0.35, 0.36, 0.37, 0.38], placement: 'Free', step: 0.005, min: 0.2, max: 0.7 },
  retention:  { name: 'Monthly retention', unit: 'pct', baseline: 0.94, target: 0.945, history: [0.935, 0.937, 0.939, 0.94], placement: 'Free', step: 0.001, min: 0.9, max: 0.97 },
  engagement: { name: 'Weekly saving action rate', unit: 'pct', baseline: 0.22, target: 0.28, history: [0.2, 0.21, 0.21, 0.22], placement: 'Free', step: 0.005, min: 0.1, max: 0.45 },
  conversion: { name: 'Premium conversion (of MAU)', unit: 'pct', baseline: 0.042, target: 0.058, history: [0.036, 0.038, 0.04, 0.042], placement: 'Premium', step: 0.001, min: 0.02, max: 0.1 },
  arpu:       { name: 'Premium net revenue / subscriber / month', unit: 'eur', baseline: 4.49, target: 4.49, history: [4.49, 4.49, 4.49, 4.49], placement: 'Premium', step: 0.05, min: 3, max: 7 },
  partnerRpu: { name: 'Partner revenue / MAU / month', unit: 'eur', baseline: 0.18, target: 0.26, history: [0.12, 0.14, 0.17, 0.18], placement: 'Partner', step: 0.01, min: 0.05, max: 0.5 },
};

// Model assumptions, stated openly so they can be challenged.
export const MODEL = {
  // Steady-state run-rate: MAU = new households × activation ÷ (1 − monthly retention).
  // Each extra point of weekly saving actions adds this many points of monthly retention (from the 2026 cohort analysis).
  engagementToRetention: 0.05,
};

export const OUTPUTS = {
  mau: 'Monthly active households (steady state)',
  northStar: 'Weekly saving households (north star)',
  subscribers: 'Premium subscribers',
  subRevenue: 'Subscription revenue (annual run-rate)',
  partnerRevenue: 'Partner revenue (annual run-rate)',
  revenue: 'Digital revenue (annual run-rate)',
};

export const NORTH_STAR = {
  name: 'Weekly saving households',
  definition: 'Households that act on at least one saving recommendation in a week. It rises only when people actually save energy, so it serves customers, the climate goal and revenue at the same time.',
};

// Guardrails: metrics that must not get worse while we chase the drivers. `limit` is the line we do not cross.
export const GUARDRAILS = [
  { id: 'rating', name: 'App store rating', current: 4.4, limit: 4.5, direction: 'min', unit: 'stars', history: [4.6, 4.6, 4.5, 4.4], why: 'Our main acquisition channel is the store; ratings below 4.5 cut organic installs.' },
  { id: 'optOut', name: 'Partner offer opt-out rate', current: 0.061, limit: 0.08, direction: 'max', unit: 'pct', history: [0.042, 0.049, 0.055, 0.061], why: 'Opting out of offers is the clearest signal that partner revenue is costing trust.' },
  { id: 'churn', name: 'Premium monthly churn', current: 0.039, limit: 0.045, direction: 'max', unit: 'pct', history: [0.044, 0.042, 0.04, 0.039], why: 'Conversion bought with discounts or dark patterns shows up here first.' },
  { id: 'contacts', name: 'Support contacts per 1,000 MAU', current: 8.2, limit: 10, direction: 'max', unit: 'count', history: [9.1, 8.8, 8.5, 8.2], why: 'Setup and billing friction lands in customer service, which costs money and goodwill.' },
];

export const OKRS = [
  { id: 'O1', objective: 'Every new household saves within its first week', owner: 'Head of Product Growth', krs: [
    { text: 'Activation from 38% to 43%', driver: 'activation', from: 0.38, to: 0.43 },
    { text: 'Support contacts per 1,000 MAU stay below 10', guardrail: 'contacts' },
  ] },
  { id: 'O2', objective: 'Premium pays for itself, visibly', owner: 'Premium product lead', krs: [
    { text: 'Premium conversion from 4.2% to 5.0%', driver: 'conversion', from: 0.042, to: 0.05 },
    { text: 'Premium churn stays below 4.5% a month', guardrail: 'churn' },
  ] },
  { id: 'O3', objective: 'Partner offers customers thank us for', owner: 'Partner product lead', krs: [
    { text: 'Partner revenue per MAU from €0.18 to €0.22', driver: 'partnerRpu', from: 0.18, to: 0.22 },
    { text: 'App rating back to 4.5 or higher', guardrail: 'rating' },
  ] },
];

// Product policy as code.
export const POLICY = {
  // The first saving is always free: bets that grow the top of the tree must not sit behind the paywall.
  placementByDriver: { newUsers: 'Free', activation: 'Free', retention: 'Free', engagement: 'Free', conversion: 'Premium', arpu: 'Premium', partnerRpu: 'Partner' },
  // Partner bets need the consent foundation in place before they can be approved.
  partnerFoundation: 'B-09',
  // Contribution margin used when handing value over to the Portfolio Office.
  contributionMargin: 0.7,
  stats: { alpha: 0.05, power: 0.8, srmAlpha: 0.001 },
  // How much of a driver's distance to target a bet must close to count as "material".
  material: 0.1,
  // Build capacity for the next two quarters (EUR k), used to fill the Next column of the roadmap.
  capacityK: 600,
};

export const SOURCES = {
  review: 'App-store review',
  survey: 'Survey answer',
  ticket: 'Support ticket',
  sales: 'Sales & partner note',
  interview: 'User interview',
};

export const PEOPLE = ['Mara Lindqvist (Head of Product)', 'Jonas Albrecht (CPO)', 'Elena Fischer (Product Growth)', 'Tobias Meier (Premium)', 'Sanne Visser (Partner product)'];
