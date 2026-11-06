// Synthetic discovery data, bets, experiments and review history for Varnholt Home.
// Everything here is invented. Feedback from DE, AT, CH and NL is shown in English.

// [id, source, market, segment, rating (reviews only), text]
const RAW = [
  // Setup and first saving
  ['F-001', 'review', 'DE', 'Free', 2, 'Took me 40 minutes to connect the heat pump. Gave up twice before it worked.'],
  ['F-002', 'ticket', 'DE', 'Free', null, 'Pairing with the smart meter fails at step 3 with "device not found". Router is right next to it.'],
  ['F-003', 'survey', 'AT', 'Free', null, 'I installed it, looked at an empty dashboard and never came back until today.'],
  ['F-004', 'review', 'NL', 'Free', 2, 'Onboarding asks for my tariff, meter number and floor area before showing anything useful.'],
  ['F-005', 'interview', 'DE', 'Free', null, 'The installer set up the heat pump but nobody showed me the app. I found it by accident in a letter.'],
  ['F-006', 'ticket', 'CH', 'Free', null, 'Cannot find the meter ID the app asks for. Is it on the bill or on the device?'],
  ['F-007', 'sales', 'DE', 'Installer', null, 'Our installers would happily pair the app during commissioning if it took less than five minutes.'],
  ['F-008', 'ticket', 'DE', 'Free', null, 'Setup keeps timing out. Please contact me at jan.k.example@mail.test, I have tried for a week.'],
  ['F-009', 'review', 'AT', 'Free', 3, 'Nice once it works, but the first day is just loading screens and permission requests.'],
  ['F-010', 'survey', 'NL', 'Free', null, 'Would be great if it just showed what I could save before asking me to connect everything.'],
  ['F-011', 'interview', 'CH', 'Free', null, 'I did not understand why it needs my location and my meter at the same time.'],
  ['F-012', 'review', 'DE', 'Free', 1, 'Connection to the inverter dropped after the update and the setup wizard starts from zero again.'],
  // Savings not tangible
  ['F-013', 'review', 'DE', 'Free', 3, 'Lots of kWh charts. I have no idea if I saved any money.'],
  ['F-014', 'survey', 'NL', 'Premium', null, 'Show me the euros. My partner asks every month whether the heat pump was worth it.'],
  ['F-015', 'interview', 'DE', 'Free', null, 'The tips are generic. "Lower the temperature" — I know. Tell me what it means for my house.'],
  ['F-016', 'review', 'AT', 'Free', 3, 'Graphs are pretty but there is no weekly summary of what I did right.'],
  ['F-017', 'survey', 'DE', 'Free', null, 'I would open it every week if it told me how much I saved compared with last winter.'],
  ['F-018', 'ticket', 'CH', 'Premium', null, 'The savings figure in the plan does not match what I see on my bill. Which one is right?'],
  ['F-019', 'review', 'NL', 'Free', 4, 'Good data. Missing a simple "you saved €12 this week" message.'],
  ['F-020', 'interview', 'AT', 'Free', null, 'I compare with neighbours on another app. Here I cannot tell if I am doing well.'],
  ['F-021', 'survey', 'DE', 'Free', null, 'Make the saving tips fit my heat pump model, not a generic house.'],
  ['F-022', 'review', 'DE', 'Free', 2, 'Stopped using it. Nothing changes from week to week.'],
  ['F-023', 'survey', 'CH', 'Free', null, 'A monthly report I could forward to my landlord would help.'],
  ['F-024', 'interview', 'NL', 'Premium', null, 'I want to see the money effect of each change I made, one by one.'],
  // Tariff automation
  ['F-025', 'review', 'DE', 'Premium', 5, 'Dynamic tariff plus heat pump scheduling is brilliant. Please make it fully automatic.'],
  ['F-026', 'survey', 'NL', 'Free', null, 'I switched to a dynamic tariff but I am not going to check prices every hour.'],
  ['F-027', 'interview', 'DE', 'Premium', null, 'I would pay more if the app moved hot water and heating to cheap hours by itself.'],
  ['F-028', 'ticket', 'DE', 'Premium', null, 'Schedule did not follow tomorrow\'s prices. Had to set it again by hand.'],
  ['F-029', 'review', 'AT', 'Free', 4, 'Tariff comparison is the reason I installed it. Wish it acted on it.'],
  ['F-030', 'survey', 'DE', 'Free', null, 'Would upgrade for automatic charging of the battery when power is cheapest.'],
  ['F-031', 'sales', 'NL', 'Prospect', null, 'Dutch prospects ask first whether the app supports their dynamic supplier.'],
  ['F-032', 'interview', 'CH', 'Free', null, 'Automation sounds good but I need to be able to override it on cold days.'],
  ['F-033', 'review', 'DE', 'Premium', 4, 'Scheduling saves real money. Setup of the price feed was fiddly.'],
  ['F-034', 'survey', 'NL', 'Premium', null, 'Let it combine solar forecast and tariff, then decide. That is what I pay for.'],
  ['F-035', 'ticket', 'AT', 'Free', null, 'Is tariff optimisation available for Austrian suppliers yet?'],
  // Premium value unclear
  ['F-036', 'review', 'DE', 'Free', 2, 'Paywall appears before I even know what Premium does.'],
  ['F-037', 'survey', 'NL', 'Free', null, '€4.99 a month for what exactly? The comparison table is confusing.'],
  ['F-038', 'interview', 'DE', 'Free', null, 'I would try Premium if I could see my own saving forecast first.'],
  ['F-039', 'review', 'AT', 'Free', 3, 'No trial. I am not paying for something I cannot test.'],
  ['F-040', 'ticket', 'DE', 'Premium', null, 'Upgraded, but cannot find which features are now unlocked.'],
  ['F-041', 'survey', 'CH', 'Free', null, 'Premium might pay for itself but the app does not show me that.'],
  ['F-042', 'review', 'NL', 'Free', 3, 'Annual price would be nice, monthly feels like another subscription to forget.'],
  ['F-043', 'interview', 'DE', 'Free', null, 'Show the euro saving Premium users get on houses like mine, then I decide.'],
  ['F-044', 'survey', 'DE', 'Premium', null, 'Worth it, but I only understood that after three months.'],
  ['F-045', 'review', 'CH', 'Free', 2, 'Constant upgrade banners. Feels like the free version is crippled on purpose.'],
  ['F-046', 'ticket', 'NL', 'Premium', null, 'Charged after cancelling in the app store. Please refund.'],
  // Offer fatigue
  ['F-047', 'review', 'DE', 'Free', 1, 'Three solar ads in one day. I already have solar panels!'],
  ['F-048', 'review', 'NL', 'Premium', 2, 'I pay for Premium and still get insulation offers in my feed.'],
  ['F-049', 'survey', 'DE', 'Free', null, 'The offers feel like the real purpose of the app. Turned them off.'],
  ['F-050', 'review', 'AT', 'Free', 2, 'Used to be helpful. Now it is a sales channel.'],
  ['F-051', 'ticket', 'DE', 'Free', null, 'How do I stop the installer offers? I cannot find the setting.'],
  ['F-052', 'review', 'CH', 'Free', 1, 'Push notification for a heat-pump offer at 7 am on a Sunday. Uninstalled.'],
  ['F-053', 'interview', 'NL', 'Free', null, 'One relevant offer is fine. The same offer every week is not.'],
  ['F-054', 'survey', 'DE', 'Premium', null, 'Offers do not match my house. I rent, I cannot install solar.'],
  ['F-055', 'review', 'DE', 'Free', 2, 'Rating dropped from me because of ads. The energy part is good.'],
  ['F-056', 'sales', 'DE', 'Partner', null, 'Sales asked for more solar placements in the feed to hit the Q4 lead target.'],
  ['F-057', 'review', 'AT', 'Free', 2, 'Feed is half offers now.'],
  ['F-058', 'survey', 'NL', 'Free', null, 'If offers were based on my actual usage I might be interested.'],
  // Trusted installer quotes
  ['F-059', 'interview', 'DE', 'Free', null, 'I want three comparable quotes for insulation without twenty phone calls.'],
  ['F-060', 'survey', 'AT', 'Free', null, 'Would love to book the yearly heat-pump service directly in the app.'],
  ['F-061', 'review', 'DE', 'Premium', 4, 'Got a fair quote for a battery through the app. Make that easier to find.'],
  ['F-062', 'ticket', 'NL', 'Free', null, 'Requested a solar quote two weeks ago, nobody called. My number is +31 6 1234 5678.'],
  ['F-063', 'sales', 'DE', 'Installer', null, 'Installers want qualified leads with house data attached, not cold contacts.'],
  ['F-064', 'interview', 'CH', 'Free', null, 'I trust a quote more if the app explains the expected saving for my house.'],
  ['F-065', 'survey', 'DE', 'Free', null, 'Service booking with a fixed price would make me use the app more.'],
  ['F-066', 'sales', 'AT', 'Installer', null, 'Partner installers in Austria report a 3x higher close rate on app leads with usage data.'],
  ['F-067', 'review', 'NL', 'Free', 4, 'Comparing installer prices in the app would be a killer feature.'],
  ['F-068', 'interview', 'DE', 'Premium', null, 'I asked for a quote because the app showed my old boiler costs me €900 a year.'],
  // Household sharing
  ['F-069', 'review', 'DE', 'Premium', 3, 'Only one login per home. My wife cannot see the plan.'],
  ['F-070', 'survey', 'NL', 'Free', null, 'Let me invite family members with their own accounts.'],
  ['F-071', 'ticket', 'AT', 'Premium', null, 'We have a holiday home. Can I manage two homes on one subscription?'],
  ['F-072', 'interview', 'DE', 'Free', null, 'The kids would compete on saving if they could see it.'],
  ['F-073', 'review', 'CH', 'Premium', 3, 'Shared account means shared password. Not great.'],
  ['F-074', 'survey', 'DE', 'Free', null, 'My parents\' heat pump is managed by me. Need to switch between homes.'],
  ['F-075', 'ticket', 'NL', 'Premium', null, 'Second phone logs the first one out.'],
  ['F-076', 'interview', 'AT', 'Free', null, 'Saving is a household thing. The app treats it as one person.'],
  // Alert noise (proposed, not yet confirmed)
  ['F-077', 'review', 'DE', 'Free', 2, 'Alerts at 2 am about a price change. Why?'],
  ['F-078', 'survey', 'NL', 'Premium', null, 'Too many notifications. I muted the app and now miss the useful ones.'],
  ['F-079', 'ticket', 'DE', 'Premium', null, 'Got 14 "heat pump offline" alerts in one evening during a Wi-Fi restart.'],
  ['F-080', 'review', 'AT', 'Free', 3, 'Battery drain since the update, probably the background refresh.'],
  ['F-081', 'interview', 'CH', 'Free', null, 'I want one alert when something is really wrong, not every small change.'],
  ['F-082', 'review', 'DE', 'Free', 2, 'Notifications cannot be grouped or scheduled.'],
  ['F-083', 'survey', 'DE', 'Free', null, 'Quiet hours, please.'],
  ['F-084', 'ticket', 'NL', 'Free', null, 'Same tip notification three days in a row.'],
  ['F-085', 'review', 'AT', 'Premium', 3, 'Useful alerts drown in marketing pushes.'],
  // Data sharing worries (proposed, not yet confirmed)
  ['F-086', 'survey', 'DE', 'Free', null, 'Does the installer see my consumption data when I ask for a quote?'],
  ['F-087', 'review', 'DE', 'Free', 2, 'Privacy policy is long and I cannot tell who gets my data.'],
  ['F-088', 'interview', 'NL', 'Free', null, 'I would share my data for a better quote, but I want to choose which installer sees it.'],
  ['F-089', 'ticket', 'CH', 'Free', null, 'Please delete my data from the partner you sent it to.'],
  ['F-090', 'survey', 'AT', 'Premium', null, 'Show me a simple list of everyone who has my data.'],
  ['F-091', 'review', 'DE', 'Free', 3, 'Consent pop-up is all or nothing.'],
  ['F-092', 'interview', 'DE', 'Free', null, 'If I could withdraw consent per partner I would trust the offers more.'],
  // Not yet themed
  ['F-093', 'review', 'DE', 'Free', 5, 'Best heat-pump app I have used. Clear and fast.'],
  ['F-094', 'survey', 'NL', 'Free', null, 'Dark mode please.'],
  ['F-095', 'review', 'AT', 'Free', 4, 'Would like a smartwatch complication for the current price.'],
  ['F-096', 'ticket', 'DE', 'Free', null, 'Android home-screen widget shows yesterday\'s data.'],
  ['F-097', 'survey', 'CH', 'Free', null, 'Italian language for Ticino would be appreciated.'],
  ['F-098', 'review', 'DE', 'Premium', 5, 'The heating curve advice alone saved me more than the subscription.'],
  ['F-099', 'interview', 'NL', 'Free', null, 'I would like to export my data to a spreadsheet.'],
  ['F-100', 'review', 'DE', 'Free', 4, 'Solid app, a bit slow to load on older phones.'],
  ['F-101', 'survey', 'AT', 'Free', null, 'Integration with my smart thermostat brand is missing.'],
  ['F-102', 'ticket', 'DE', 'Premium', null, 'Invoice download for my tax return?'],
  ['F-103', 'review', 'NL', 'Free', 4, 'Helpful during the cold snap, the alerts saved me from a frozen pipe.'],
  ['F-104', 'survey', 'DE', 'Free', null, 'Make the app work with EV charging too.'],
];

const day = (i) => new Date(Date.UTC(2026, 7, 1) + ((i * 37) % 92) * 86400000).toISOString().slice(0, 10);
export const FEEDBACK = RAW.map(([id, source, market, segment, rating, text], i) => ({ id, source, market, segment, rating, text, date: day(i) }));

// Themes proposed by AI-assisted discovery and confirmed (or not) by a person. Evidence = feedback IDs.
export const THEMES = [
  { id: 'TH-1', name: 'Setup is too hard to reach a first saving', driver: 'activation', status: 'confirmed', confirmedBy: 'Elena Fischer (Product Growth)', evidence: ['F-001', 'F-002', 'F-003', 'F-004', 'F-005', 'F-006', 'F-007', 'F-008', 'F-009', 'F-010', 'F-011', 'F-012'],
    insight: 'People quit before the first saving: pairing fails, the dashboard is empty, and installers do not hand over the app at commissioning.' },
  { id: 'TH-2', name: 'Savings are not tangible', driver: 'engagement', status: 'confirmed', confirmedBy: 'Elena Fischer (Product Growth)', evidence: ['F-013', 'F-014', 'F-015', 'F-016', 'F-017', 'F-018', 'F-019', 'F-020', 'F-021', 'F-022', 'F-023', 'F-024'],
    insight: 'Users see kWh, not euros, and get generic tips. Without a weekly "you saved" moment there is no reason to come back.' },
  { id: 'TH-3', name: 'Make tariff savings automatic', driver: 'conversion', status: 'confirmed', confirmedBy: 'Tobias Meier (Premium)', evidence: ['F-025', 'F-026', 'F-027', 'F-028', 'F-029', 'F-030', 'F-031', 'F-032', 'F-033', 'F-034', 'F-035'],
    insight: 'Dynamic-tariff households want the app to act for them, with an override. This is the clearest willingness to pay in the data.' },
  { id: 'TH-4', name: 'Premium value is unclear before paying', driver: 'conversion', status: 'confirmed', confirmedBy: 'Tobias Meier (Premium)', evidence: ['F-036', 'F-037', 'F-038', 'F-039', 'F-040', 'F-041', 'F-042', 'F-043', 'F-044', 'F-045', 'F-046'],
    insight: 'The paywall comes before the proof. People ask for a trial and a personal saving forecast; heavy banners make the free tier feel crippled.' },
  { id: 'TH-5', name: 'Offer fatigue is eroding trust', driver: 'partnerRpu', guardrail: 'rating', status: 'confirmed', confirmedBy: 'Sanne Visser (Partner product)', evidence: ['F-047', 'F-048', 'F-049', 'F-050', 'F-051', 'F-052', 'F-053', 'F-054', 'F-055', 'F-056', 'F-057', 'F-058'],
    insight: 'Irrelevant, repeated offers (solar to solar owners, insulation to renters) drive opt-outs and one-star reviews. Relevance, not volume, is the lever.' },
  { id: 'TH-6', name: 'People want trusted, comparable installer quotes', driver: 'partnerRpu', status: 'confirmed', confirmedBy: 'Sanne Visser (Partner product)', evidence: ['F-059', 'F-060', 'F-061', 'F-062', 'F-063', 'F-064', 'F-065', 'F-066', 'F-067', 'F-068'],
    insight: 'Users ask for comparable quotes and service booking; installers want qualified leads with house data. Both sides value the same thing.' },
  { id: 'TH-7', name: 'Saving is a household activity', driver: 'retention', status: 'confirmed', confirmedBy: 'Mara Lindqvist (Head of Product)', evidence: ['F-069', 'F-070', 'F-071', 'F-072', 'F-073', 'F-074', 'F-075', 'F-076'],
    insight: 'One login per home blocks partners, family members and people who look after a second home.' },
  { id: 'TH-8', name: 'Alerts are noisy and badly timed', driver: 'retention', status: 'proposed', evidence: ['F-077', 'F-078', 'F-079', 'F-080', 'F-081', 'F-082', 'F-083', 'F-084', 'F-085'],
    insight: 'Night-time and duplicate alerts lead people to mute the app, and then they miss the alerts that matter.' },
  { id: 'TH-9', name: 'People want control over who sees their data', driver: 'partnerRpu', guardrail: 'optOut', status: 'proposed', evidence: ['F-086', 'F-087', 'F-088', 'F-089', 'F-090', 'F-091', 'F-092'],
    insight: 'Willingness to share data for better offers is conditional on choosing which partner sees it and being able to withdraw.' },
];

// Bets: what we will try, which driver it should move, by how much, and how sure we are.
// uplift = absolute change of the driver if the bet works; confidence = probability it works as expected; costK = build cost (EUR k).
export const BETS = [
  { id: 'B-01', name: 'Installer-assisted setup at commissioning', theme: 'TH-1', driver: 'activation', uplift: 0.05, confidence: 0.6, costK: 180, placement: 'Free', guardrailRisk: 'none', status: 'experiment', experiment: 'EXP-04', dependsOn: ['FSA-04'],
    hypothesis: 'If installers pair the app during commissioning and the first screen shows a saving estimate before any device is connected, more new households reach a first saving within 7 days.' },
  { id: 'B-02', name: 'Weekly savings report in euros', theme: 'TH-2', driver: 'engagement', uplift: 0.03, confidence: 0.55, costK: 90, placement: 'Free', guardrailRisk: 'none', status: 'experiment', experiment: 'EXP-02', dependsOn: ['CDP-02'],
    hypothesis: 'If every household gets a weekly "you saved €X" report with one personal next step, more of them act on a recommendation each week.' },
  { id: 'B-03', name: 'Tariff autopilot for dynamic tariffs', theme: 'TH-3', driver: 'conversion', uplift: 0.009, confidence: 0.5, costK: 420, placement: 'Premium', guardrailRisk: 'low', status: 'proposed', dependsOn: ['SHB-13'],
    hypothesis: 'If Premium runs the heat pump and battery on the cheapest hours automatically, with a one-tap override, dynamic-tariff households upgrade.' },
  { id: 'B-04', name: 'Premium trial with a personal saving forecast', theme: 'TH-4', driver: 'conversion', uplift: 0.008, confidence: 0.7, costK: 60, placement: 'Premium', guardrailRisk: 'low', status: 'experiment', experiment: 'EXP-01', dependsOn: [],
    hypothesis: 'If free users see their own Premium saving forecast and can try Premium for 14 days, more of them convert, without higher churn after the trial.' },
  { id: 'B-05', name: 'Comparable installer quotes and service booking', theme: 'TH-6', driver: 'partnerRpu', uplift: 0.05, confidence: 0.5, costK: 260, placement: 'Partner', guardrailRisk: 'low', status: 'proposed', dependsOn: ['PRT-14'],
    hypothesis: 'If users can request three comparable quotes, with their house data shared only with the installers they pick, partner revenue grows without hurting trust.' },
  { id: 'B-06', name: 'More solar placements in the feed', theme: 'TH-5', driver: 'partnerRpu', uplift: 0.03, confidence: 0.4, costK: 20, placement: 'Partner', guardrailRisk: 'high', status: 'killed', experiment: 'EXP-03', dependsOn: [], decidedBy: 'Mara Lindqvist (Head of Product)', source: 'Sales request',
    hypothesis: 'If we double solar offer slots in the feed, partner revenue per MAU rises.' },
  { id: 'B-07', name: 'Household sharing and multi-home', theme: 'TH-7', driver: 'retention', uplift: 0.003, confidence: 0.6, costK: 150, placement: 'Free', guardrailRisk: 'none', status: 'proposed', dependsOn: [],
    hypothesis: 'If everyone in a household can join with their own login, and one account can manage two homes, fewer households drop out.' },
  { id: 'B-08', name: 'Quiet hours and smarter alerts', theme: 'TH-8', driver: 'retention', uplift: 0.002, confidence: 0.75, costK: 40, placement: 'Free', guardrailRisk: 'none', status: 'proposed', dependsOn: [],
    hypothesis: 'If alerts respect quiet hours and duplicates are merged, fewer people mute or uninstall the app.' },
  { id: 'B-09', name: 'Consent centre for partner data sharing', theme: 'TH-9', driver: 'partnerRpu', uplift: 0.01, confidence: 0.6, costK: 70, placement: 'Platform', guardrailRisk: 'none', status: 'proposed', dependsOn: [], foundation: true,
    hypothesis: 'If people choose per partner who sees their data and can withdraw at any time, more of them opt in, and offers can be targeted lawfully.' },
];

// Experiments: pre-registered before launch; results are synthetic counts.
export const EXPERIMENTS = [
  {
    id: 'EXP-01', bet: 'B-04', name: 'Premium trial with saving forecast', status: 'complete', owner: 'Tobias Meier (Premium)',
    window: '2026-09-01 → 2026-10-12', market: 'DE, NL',
    preReg: { metric: 'Premium conversion within 30 days', baselineRate: 0.042, mde: 0.006, split: 0.5, plannedPerArm: null, decisionRule: 'Ship if conversion rises with 95% confidence and no guardrail is breached.' },
    assigned: { control: 24120, variant: 23880 },
    control: { n: 24120, conv: 1013 }, variant: { n: 23880, conv: 1230 },
    guardrails: [
      { id: 'churn', name: 'Premium churn, first month after trial', control: 0.041, variant: 0.043, limit: 0.045, direction: 'max' },
      { id: 'contacts', name: 'Billing contacts per 1,000 users', control: 1.9, variant: 2.3, limit: 3, direction: 'max' },
    ],
    decision: null,
  },
  {
    id: 'EXP-02', bet: 'B-02', name: 'Weekly savings report in euros', status: 'complete', owner: 'Elena Fischer (Product Growth)',
    window: '2026-09-15 → 2026-10-27', market: 'DE, AT',
    preReg: { metric: 'Households with a saving action in week 4', baselineRate: 0.22, mde: 0.02, split: 0.5, plannedPerArm: null, decisionRule: 'Ship if the weekly action rate rises by 2 points or more with 95% confidence.' },
    assigned: { control: 9050, variant: 8950 },
    control: { n: 9050, conv: 1991 }, variant: { n: 8950, conv: 2041 },
    guardrails: [
      { id: 'pushOptOut', name: 'Push notification opt-out', control: 0.031, variant: 0.034, limit: 0.05, direction: 'max' },
    ],
    decision: null,
  },
  {
    id: 'EXP-03', bet: 'B-06', name: 'Double solar placements in the feed', status: 'complete', owner: 'Sanne Visser (Partner product)',
    window: '2026-08-18 → 2026-09-15', market: 'DE',
    preReg: { metric: 'Partner offer click-through', baselineRate: 0.021, mde: 0.004, split: 0.5, plannedPerArm: null, decisionRule: 'Ship only if partner revenue rises and offer opt-out stays below 8%.' },
    assigned: { control: 30200, variant: 29800 },
    control: { n: 30200, conv: 634 }, variant: { n: 29800, conv: 745 },
    guardrails: [
      { id: 'optOut', name: 'Partner offer opt-out', control: 0.061, variant: 0.094, limit: 0.08, direction: 'max' },
      { id: 'rating', name: 'In-app rating prompt score', control: 4.4, variant: 4.1, limit: 4.3, direction: 'min' },
    ],
    decision: { call: 'kill', by: 'Mara Lindqvist (Head of Product)', at: '2026-09-18', rationale: 'Click-through rose, but opt-out crossed the 8% guardrail and rating fell. More volume is the wrong lever; relevance (B-05, B-09) is the right one. Sales informed with the data.' },
  },
  {
    id: 'EXP-04', bet: 'B-01', name: 'Installer-assisted setup', status: 'complete', owner: 'Elena Fischer (Product Growth)',
    window: '2026-09-22 → 2026-10-30', market: 'DE',
    preReg: { metric: 'Activation within 7 days', baselineRate: 0.38, mde: 0.04, split: 0.5, plannedPerArm: null, decisionRule: 'Ship if activation rises by 4 points or more with 95% confidence.' },
    assigned: { control: 12400, variant: 11100 },
    control: { n: 12400, conv: 4700 }, variant: { n: 11100, conv: 4930 },
    guardrails: [
      { id: 'contacts', name: 'Setup support contacts per 1,000 users', control: 4.1, variant: 3.2, limit: 5, direction: 'max' },
    ],
    decision: null,
  },
];

// The last signed-off quarterly strategy review.
export const REVIEWS = [
  {
    quarter: 'Q3 2026', signedBy: 'Jonas Albrecht (CPO)', at: '2026-10-06',
    summary: 'Revenue run-rate €1.85m (target path €2.0m). Activation and partner revenue are the gaps. Rating slipped to 4.4 after offer volume grew; offer volume frozen. Approved the Premium trial and two experiments; asked for a consent-first plan for partner revenue.',
  },
];
