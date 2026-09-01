// Regional split of the worldwide segment totals.
//
// WHY THIS EXISTS: the first version of this project sourced its numbers almost
// entirely from US (Play Meter, NPD/Circana) and Japanese (Capcom / Sega Sammy /
// JAMMA) data and treated everything else as a residual. That is a real weakness
// in a chart claiming to be worldwide: European, Chinese, Korean and Latin
// American markets behave very differently, and in several segments they are
// larger than the United States.
//
// HOW IT WORKS: shares are authored at ANCHOR YEARS and linearly interpolated
// between them. Each segment's seven regional shares are normalised to sum to 1,
// then multiplied by the researched worldwide segment total. The build then checks
// the resulting regional totals against independently published regional figures
// (Newzoo by region, CNG/GPC for China) and prints the gap — see REGION_CHECKS at
// the bottom of this file and the output of `node data/build.mjs`.
//
// CONFIDENCE: regional shares from about 2012 onward are anchored on published
// regional revenue. Before roughly 1995 they are reconstructed from unit-sales
// geography and contemporaneous trade reporting, and should be read as informed
// estimates rather than measurements.

export const REGIONS = [
  { id: 'na',    label: 'North America',        short: 'N. America',   color: '#4d9de0' },
  { id: 'eu',    label: 'Europe',               short: 'Europe',       color: '#3bb273' },
  { id: 'jp',    label: 'Japan',                short: 'Japan',        color: '#e15554' },
  { id: 'cn',    label: 'China',                short: 'China',        color: '#f4a259' },
  { id: 'apac',  label: 'Rest of Asia-Pacific', short: 'Rest of APAC', color: '#7768ae' },
  { id: 'latam', label: 'Latin America',        short: 'Latin Am.',    color: '#e1bc29' },
  { id: 'mea',   label: 'Middle East & Africa', short: 'MEA',          color: '#9aa6b8' },
];

// Order of every share array below: [na, eu, jp, cn, apac, latam, mea]
//
// Europe follows Newzoo's definition (EU + UK + Russia + Turkey).
// Rest of Asia-Pacific = Korea, Taiwan, South-East Asia, India, Australia/NZ.

export const REGION_SHARES = {
  // ---------------------------------------------------------------- arcade
  // US coin drop (Play Meter / Vending Times), Japanese arcade *operations*
  // (JAMMA via Capcom and Sega Sammy), UK coin-op (GBP 434M in 1992, GBP 275M in
  // 2011-13), Korea (arcade was around 70% of a ~$440M market in 1995 and under
  // 1% of it after 2007), and the modern Chinese family-entertainment-centre boom.
  arcade: {
    1972: [0.75, 0.15, 0.08, 0.00,  0.01,  0.010, 0.000],
    1978: [0.35, 0.10, 0.52, 0.00,  0.02,  0.010, 0.000],
    1982: [0.66, 0.08, 0.23, 0.00,  0.02,  0.010, 0.000],
    1990: [0.41, 0.10, 0.42, 0.005, 0.05,  0.010, 0.005],
    1995: [0.32, 0.09, 0.50, 0.01,  0.06,  0.015, 0.005],
    2000: [0.26, 0.09, 0.55, 0.02,  0.06,  0.015, 0.005],
    2007: [0.22, 0.09, 0.58, 0.04,  0.05,  0.015, 0.005],
    2015: [0.24, 0.10, 0.46, 0.10,  0.07,  0.020, 0.010],
    2024: [0.26, 0.11, 0.34, 0.16,  0.09,  0.025, 0.015],
    2026: [0.26, 0.11, 0.32, 0.17,  0.10,  0.025, 0.015],
  },

  // ---------------------------------------------------------------- console
  // 1983-85 is the crash: North America collapses while the Famicom briefly makes
  // Japan the largest console market on earth. Modern splits follow the platform
  // holders' own regional reporting — Nintendo publishes Switch as Americas 38% /
  // Europe 26% / Japan 25% / other 11%.
  console: {
    1977: [0.85, 0.10, 0.05, 0.000, 0.000, 0.00,  0.000],
    1982: [0.78, 0.10, 0.11, 0.000, 0.000, 0.01,  0.000],
    1985: [0.25, 0.10, 0.63, 0.000, 0.000, 0.02,  0.000],
    1990: [0.48, 0.14, 0.36, 0.000, 0.005, 0.01,  0.005],
    1995: [0.44, 0.20, 0.32, 0.000, 0.010, 0.02,  0.010],
    2000: [0.42, 0.26, 0.27, 0.000, 0.020, 0.02,  0.010],
    2007: [0.44, 0.32, 0.16, 0.002, 0.030, 0.03,  0.018],
    2015: [0.42, 0.33, 0.11, 0.010, 0.050, 0.05,  0.030],
    2023: [0.405, 0.315, 0.115, 0.025, 0.065, 0.040, 0.035],
    2026: [0.395, 0.305, 0.120, 0.030, 0.065, 0.048, 0.037],
  },

  // ---------------------------------------------------------------- pc
  // The 1980s share is deliberately Europe-heavy: the ZX Spectrum, Commodore 64
  // and Amstrad CPC made home-computer software a mass market in the UK, France,
  // Germany and Spain at a time when US retail tracking barely covered it. From
  // the 2000s the story is Korea (Lineage, PC bangs) and then China, now the
  // single largest PC games market by a wide margin.
  pc: {
    1982: [0.55, 0.35, 0.09, 0.000, 0.005, 0.005, 0.000],
    1987: [0.45, 0.45, 0.08, 0.000, 0.010, 0.010, 0.000],
    1995: [0.50, 0.35, 0.10, 0.005, 0.030, 0.010, 0.005],
    2000: [0.45, 0.32, 0.07, 0.020, 0.110, 0.020, 0.010],
    2005: [0.33, 0.26, 0.05, 0.130, 0.170, 0.040, 0.020],
    2010: [0.27, 0.24, 0.03, 0.240, 0.140, 0.050, 0.030],
    2015: [0.24, 0.23, 0.03, 0.300, 0.120, 0.050, 0.030],
    2020: [0.24, 0.23, 0.03, 0.290, 0.110, 0.060, 0.040],
    2026: [0.24, 0.23, 0.03, 0.280, 0.110, 0.070, 0.040],
  },

  // ---------------------------------------------------------------- handheld
  // Japan over-indexes throughout: the Game Boy, DS and PSP were commuter devices
  // there in a way they never quite became in the West.
  handheld: {
    1980: [0.45, 0.15, 0.40, 0.00, 0.00, 0.000, 0.000],
    1990: [0.42, 0.16, 0.40, 0.00, 0.01, 0.010, 0.000],
    1999: [0.40, 0.24, 0.32, 0.00, 0.02, 0.015, 0.005],
    2007: [0.38, 0.28, 0.26, 0.00, 0.04, 0.025, 0.015],
    2014: [0.36, 0.29, 0.26, 0.00, 0.05, 0.030, 0.020],
    2026: [0.35, 0.30, 0.25, 0.00, 0.05, 0.030, 0.020],
  },

  // ---------------------------------------------------------------- mobile
  // Japan created the market (i-mode, carrier decks) and still spends far more per
  // player than anywhere else, but China overtook everyone on volume.
  mobile: {
    2000: [0.100, 0.20, 0.60, 0.00, 0.09,  0.010, 0.00],
    2005: [0.160, 0.22, 0.45, 0.03, 0.11,  0.020, 0.01],
    2010: [0.220, 0.20, 0.27, 0.10, 0.15,  0.040, 0.02],
    2015: [0.240, 0.16, 0.16, 0.22, 0.14,  0.050, 0.03],
    2020: [0.228, 0.14, 0.120, 0.28, 0.145, 0.050, 0.037],
    2024: [0.220, 0.14, 0.115, 0.28, 0.148, 0.050, 0.047],
    2026: [0.215, 0.14, 0.115, 0.28, 0.150, 0.055, 0.045],
  },

  // ---------------------------------------------------------------- vr
  vr: {
    2016: [0.45, 0.25, 0.10, 0.08, 0.08, 0.02, 0.02],
    2020: [0.48, 0.24, 0.06, 0.10, 0.07, 0.03, 0.02],
    2024: [0.45, 0.23, 0.05, 0.14, 0.07, 0.03, 0.03],
    2026: [0.44, 0.23, 0.05, 0.15, 0.07, 0.03, 0.03],
  },

  // ---------------------------------------------------------------- cloud
  cloud: {
    2015: [0.50, 0.30, 0.08, 0.03, 0.05, 0.02, 0.02],
    2020: [0.44, 0.28, 0.05, 0.12, 0.06, 0.03, 0.02],
    2026: [0.40, 0.26, 0.04, 0.18, 0.06, 0.03, 0.03],
  },
};

// ---------------------------------------------------------------------------
// Company-level regional affinity
// ---------------------------------------------------------------------------
// A segment-wide regional share is not enough on its own: applying the console
// split evenly to every platform would give Xbox a healthy Japanese business,
// which it has never had. These multipliers tilt a company's regional mix away
// from its segment average, and the build renormalises afterwards so that each
// segment-year-region total is left unchanged.
//
// 1.0 means "behaves like the segment average". Anything not listed here is 1.0.
// Values are derived from published regional hardware splits and market reporting.

export const COMPANY_REGION_AFFINITY = {
  // Xbox has never had a Japanese market and over-indexes in North America.
  'console:microsoft': { na: 1.45, eu: 1.05, jp: 0.06, cn: 0.25, apac: 0.55, latam: 0.90, mea: 0.90 },
  // Nintendo over-indexes in Japan in every generation it has shipped.
  'console:nintendo':  { na: 1.02, eu: 0.88, jp: 1.85, cn: 0.50, apac: 0.90, latam: 0.70, mea: 0.60 },
  // PlayStation over-indexes in Europe and Latin America.
  'console:sony':      { na: 0.95, eu: 1.18, jp: 0.95, cn: 0.80, apac: 1.15, latam: 1.35, mea: 1.20 },
  'console:sega':      { na: 0.95, eu: 1.25, jp: 1.10, cn: 0.30, apac: 0.70, latam: 1.60, mea: 0.60 },
  'console:atari':     { na: 1.35, eu: 0.85, jp: 0.15, cn: 0.00, apac: 0.20, latam: 0.80, mea: 0.30 },
  'console:nec':       { na: 0.25, eu: 0.15, jp: 3.20, cn: 0.10, apac: 0.40, latam: 0.10, mea: 0.00 },
  'console:snk':       { na: 0.70, eu: 0.80, jp: 2.00, cn: 0.30, apac: 1.40, latam: 0.60, mea: 0.20 },
  'console:mattel':    { na: 1.50, eu: 0.60, jp: 0.10, cn: 0.00, apac: 0.10, latam: 0.50, mea: 0.10 },
  'console:coleco':    { na: 1.60, eu: 0.50, jp: 0.10, cn: 0.00, apac: 0.10, latam: 0.30, mea: 0.10 },
  'console:magnavox':  { na: 1.30, eu: 1.10, jp: 0.20, cn: 0.00, apac: 0.10, latam: 0.40, mea: 0.10 },

  'handheld:nintendo': { na: 1.00, eu: 0.95, jp: 1.30, cn: 0.30, apac: 0.90, latam: 0.70, mea: 0.60 },
  'handheld:sony':     { na: 0.90, eu: 1.05, jp: 1.35, cn: 0.50, apac: 1.30, latam: 1.10, mea: 0.90 },
  'handheld:sega':     { na: 1.00, eu: 1.20, jp: 1.00, cn: 0.20, apac: 0.50, latam: 1.40, mea: 0.40 },

  // PC storefronts. Tencent and NetEase are overwhelmingly domestic Chinese; the
  // Korean portals concentrate in Korea and adjacent markets.
  'pc:tencent':  { na: 0.15, eu: 0.15, jp: 0.10, cn: 3.10, apac: 0.50, latam: 0.20, mea: 0.15 },
  'pc:netease':  { na: 0.12, eu: 0.10, jp: 0.15, cn: 3.20, apac: 0.40, latam: 0.10, mea: 0.10 },
  'pc:korean':   { na: 0.50, eu: 0.35, jp: 0.50, cn: 0.70, apac: 3.40, latam: 0.40, mea: 0.30 },
  'pc:valve':    { na: 1.50, eu: 1.65, jp: 0.60, cn: 0.70, apac: 0.90, latam: 0.90, mea: 0.80 },
  'pc:blizzard': { na: 1.60, eu: 1.60, jp: 0.30, cn: 0.60, apac: 0.90, latam: 0.80, mea: 0.50 },
  'pc:epic':     { na: 1.70, eu: 1.60, jp: 0.40, cn: 0.20, apac: 0.70, latam: 1.10, mea: 0.70 },
  'pc:microsoft':{ na: 1.60, eu: 1.60, jp: 0.40, cn: 0.30, apac: 0.70, latam: 0.90, mea: 0.70 },
  'pc:ea':       { na: 1.70, eu: 1.70, jp: 0.20, cn: 0.20, apac: 0.60, latam: 1.00, mea: 0.80 },
  'pc:riot':     { na: 1.20, eu: 1.30, jp: 0.40, cn: 0.90, apac: 1.40, latam: 1.20, mea: 0.90 },
  'pc:retail':   { na: 1.40, eu: 1.60, jp: 0.50, cn: 0.20, apac: 0.50, latam: 0.70, mea: 0.50 },
  'pc:browser':  { na: 1.20, eu: 1.30, jp: 0.50, cn: 0.90, apac: 0.90, latam: 1.20, mea: 1.00 },

  // Mobile publishers.
  'mobile:tencent':    { na: 0.25, eu: 0.20, jp: 0.15, cn: 2.90, apac: 0.70, latam: 0.35, mea: 0.30 },
  'mobile:netease':    { na: 0.20, eu: 0.15, jp: 0.40, cn: 3.00, apac: 0.50, latam: 0.20, mea: 0.15 },
  'mobile:mihoyo':     { na: 0.90, eu: 0.70, jp: 1.60, cn: 1.80, apac: 1.10, latam: 0.40, mea: 0.30 },
  'mobile:aniplex':    { na: 0.20, eu: 0.10, jp: 6.50, cn: 0.40, apac: 0.50, latam: 0.05, mea: 0.05 },
  'mobile:bandai':     { na: 0.50, eu: 0.50, jp: 4.00, cn: 0.30, apac: 0.70, latam: 0.50, mea: 0.30 },
  'mobile:king':       { na: 1.90, eu: 1.80, jp: 0.40, cn: 0.05, apac: 0.50, latam: 0.90, mea: 0.70 },
  'mobile:supercell':  { na: 1.60, eu: 1.70, jp: 0.50, cn: 0.10, apac: 0.80, latam: 1.10, mea: 1.30 },
  'mobile:zynga':      { na: 2.00, eu: 1.60, jp: 0.30, cn: 0.05, apac: 0.40, latam: 0.80, mea: 0.60 },
  'mobile:playrix':    { na: 1.80, eu: 1.80, jp: 0.40, cn: 0.10, apac: 0.50, latam: 0.80, mea: 0.70 },
  'mobile:scopely':    { na: 2.10, eu: 1.50, jp: 0.30, cn: 0.05, apac: 0.40, latam: 0.70, mea: 0.50 },
  'mobile:moonactive': { na: 1.90, eu: 1.70, jp: 0.20, cn: 0.05, apac: 0.40, latam: 0.80, mea: 0.80 },
  'mobile:dreamgames': { na: 1.80, eu: 1.80, jp: 0.30, cn: 0.05, apac: 0.40, latam: 0.80, mea: 0.90 },
  'mobile:sea':        { na: 0.30, eu: 0.20, jp: 0.10, cn: 0.10, apac: 3.00, latam: 2.20, mea: 0.80 },
  'mobile:netmarble':  { na: 0.60, eu: 0.40, jp: 1.20, cn: 0.40, apac: 3.00, latam: 0.30, mea: 0.30 },
  'mobile:krafton':    { na: 0.70, eu: 0.60, jp: 0.30, cn: 0.20, apac: 3.00, latam: 0.90, mea: 1.20 },
  'mobile:niantic':    { na: 1.70, eu: 1.30, jp: 1.90, cn: 0.02, apac: 0.60, latam: 0.50, mea: 0.30 },
  'mobile:nintendo':   { na: 1.50, eu: 0.90, jp: 2.20, cn: 0.05, apac: 0.50, latam: 0.40, mea: 0.20 },
  'mobile:ea':         { na: 1.70, eu: 1.60, jp: 0.30, cn: 0.10, apac: 0.60, latam: 1.00, mea: 0.90 },
  'mobile:roblox':     { na: 2.10, eu: 1.60, jp: 0.20, cn: 0.02, apac: 0.40, latam: 0.90, mea: 0.60 },
  'mobile:nokia':      { na: 0.80, eu: 1.50, jp: 1.40, cn: 0.40, apac: 0.90, latam: 0.70, mea: 0.90 },

  // Arcade manufacturers, weighted by where their machines actually earned.
  'arcade:sega':     { na: 0.85, eu: 1.00, jp: 1.35, cn: 0.80, apac: 1.00, latam: 0.60, mea: 0.50 },
  'arcade:namco':    { na: 0.80, eu: 0.90, jp: 1.45, cn: 0.80, apac: 1.00, latam: 0.60, mea: 0.40 },
  'arcade:konami':   { na: 0.70, eu: 0.80, jp: 1.50, cn: 0.90, apac: 1.30, latam: 0.50, mea: 0.40 },
  'arcade:taito':    { na: 0.70, eu: 0.80, jp: 1.60, cn: 0.70, apac: 1.00, latam: 0.50, mea: 0.30 },
  'arcade:capcom':   { na: 0.95, eu: 1.00, jp: 1.20, cn: 0.90, apac: 1.40, latam: 0.90, mea: 0.60 },
  'arcade:snk':      { na: 0.80, eu: 0.90, jp: 1.20, cn: 0.90, apac: 1.70, latam: 1.40, mea: 0.70 },
  'arcade:atari':    { na: 1.60, eu: 1.30, jp: 0.20, cn: 0.10, apac: 0.30, latam: 0.90, mea: 0.40 },
  'arcade:midway':   { na: 1.80, eu: 1.10, jp: 0.15, cn: 0.10, apac: 0.30, latam: 0.90, mea: 0.40 },
  'arcade:nintendo': { na: 1.50, eu: 1.10, jp: 0.70, cn: 0.10, apac: 0.40, latam: 0.70, mea: 0.30 },

  'vr:sony':      { na: 0.85, eu: 1.15, jp: 1.90, cn: 0.40, apac: 1.10, latam: 1.00, mea: 0.80 },
  'vr:meta':      { na: 1.35, eu: 1.10, jp: 0.40, cn: 0.05, apac: 0.50, latam: 0.60, mea: 0.60 },
  'vr:bytedance': { na: 0.15, eu: 0.50, jp: 0.20, cn: 4.00, apac: 0.90, latam: 0.20, mea: 0.20 },
  'vr:apple':     { na: 1.70, eu: 1.10, jp: 0.80, cn: 0.90, apac: 0.70, latam: 0.30, mea: 0.30 },

  'cloud:microsoft': { na: 1.35, eu: 1.30, jp: 0.40, cn: 0.05, apac: 0.60, latam: 1.00, mea: 0.80 },
  'cloud:sony':      { na: 1.20, eu: 1.35, jp: 1.10, cn: 0.05, apac: 0.70, latam: 0.80, mea: 0.60 },
  'cloud:google':    { na: 1.50, eu: 1.40, jp: 0.20, cn: 0.00, apac: 0.40, latam: 0.60, mea: 0.40 },
  'cloud:nvidia':    { na: 1.30, eu: 1.40, jp: 0.50, cn: 0.10, apac: 0.70, latam: 0.90, mea: 0.70 },
  'cloud:amazon':    { na: 1.60, eu: 1.30, jp: 0.40, cn: 0.00, apac: 0.50, latam: 0.90, mea: 0.60 },
};

// ---------------------------------------------------------------------------
// Independently published regional figures, used by the build as a check.
// ---------------------------------------------------------------------------
// `contentOnly: true` means the published figure excludes hardware, so the check
// subtracts this project's hardware estimate for that region before comparing.
// If the model drifts past the stated tolerance, `node data/build.mjs` says so.
export const REGION_CHECKS = [
  { year: 2023, region: 'na',    value: 51600, tol: 0.18, contentOnly: true,
    source: 'Newzoo Global Games Market Report 2023, revenue per region' },
  { year: 2023, region: 'eu',    value: 34400, tol: 0.18, contentOnly: true,
    source: 'Newzoo Global Games Market Report 2023, revenue per region' },
  { year: 2023, region: 'latam', value: 8800,  tol: 0.25, contentOnly: true,
    source: 'Newzoo Global Games Market Report 2023, revenue per region' },
  { year: 2023, region: 'mea',   value: 7200,  tol: 0.28, contentOnly: true,
    source: 'Newzoo Global Games Market Report 2023, revenue per region' },
  { year: 2023, region: 'cn',    value: 42600, tol: 0.18, contentOnly: false,
    source: 'CNG / Game Publishing Committee: RMB 303bn actual sales revenue, 2023' },
  { year: 2024, region: 'cn',    value: 44800, tol: 0.18, contentOnly: false,
    source: 'CNG / Game Publishing Committee: RMB 325.8bn actual sales revenue, 2024' },
  { year: 2022, region: 'latam', value: 8400,  tol: 0.28, contentOnly: true,
    source: 'Newzoo 2022, LATAM' },
  { year: 2022, region: 'mea',   value: 6800,  tol: 0.30, contentOnly: true,
    source: 'Newzoo 2022, MENA' },
  { year: 2021, region: 'na',    value: 42600, tol: 0.22, contentOnly: true,
    source: 'Newzoo 2021, North America' },
  { year: 2025, region: 'mea',   value: 7100,  tol: 0.30, contentOnly: true,
    source: 'Newzoo 2025, MENA' },
  { year: 2023, region: 'jp',    value: 19000, tol: 0.25, contentOnly: true,
    source: 'Japan consumer market, commonly reported at $18-20bn (Famitsu/Kadokawa, CESA)' },
];
