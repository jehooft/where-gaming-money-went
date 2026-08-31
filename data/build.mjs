// Builds data/gaming-revenue.json from the researched inputs.
//   node data/build.mjs
//
// Pipeline:
//   1. hardware platforms  -> annual revenue from shipment curves
//   2. revenue entities    -> annual revenue taken as given
//   3. residual bands      -> whatever is left of the segment total
//   4. rescale             -> every segment-year sums exactly to segments.mjs
//   5. quarterise          -> seasonality + launch-quarter awareness
//   6. roll up             -> platform -> company -> segment -> total

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEGMENTS, SEGMENT_TOTALS, SEASONALITY, CPI, CPI_BASE_YEAR, CONFIDENCE } from './segments.mjs';
import { COMPANIES, HARDWARE, ENTITIES, liveServiceFactor } from './platforms.mjs';
import { EVENTS, ERAS } from './events.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));

const Y0 = 1970;
const Y1 = 2026;
const YEARS = [];
for (let y = Y0; y <= Y1; y++) YEARS.push(y);

const warn = [];

// ---------------------------------------------------------------------------
// 1. hardware platforms -> annual revenue
// ---------------------------------------------------------------------------

// How strongly a console bought `age` years ago still drives software spending
// this year. Index 0 is the purchase year itself (partial, and the buyer is still
// working through the pack-in), index 1 is the following year (peak).
const SW_CURVE = [0.55, 1.0, 0.86, 0.66, 0.46, 0.31, 0.21, 0.14, 0.09, 0.06, 0.04, 0.025, 0.015];

function hardwareAnnual(p) {
  const unitYears = Object.keys(p.units).map(Number).sort((a, b) => a - b);
  const launchYear = unitYears[0];
  const priceFloor = p.hwPrice * 0.42;

  const hw = {};
  for (const y of unitYears) {
    const price = Math.max(priceFloor, p.hwPrice * Math.pow(p.hwDecay, y - launchYear));
    hw[y] = p.units[y] * price; // millions of units x dollars = $ millions
  }

  // software weight by year
  const swWeight = {};
  for (const j of unitYears) {
    for (let k = 0; k < SW_CURVE.length; k++) {
      const y = j + k;
      if (y > Y1) break;
      swWeight[y] = (swWeight[y] || 0) + p.units[j] * SW_CURVE[k];
    }
  }
  const totalWeight = Object.values(swWeight).reduce((a, b) => a + b, 0);

  const out = {};
  const years = new Set([...Object.keys(hw), ...Object.keys(swWeight)].map(Number));
  for (const y of [...years].sort((a, b) => a - b)) {
    if (y > Y1) continue;
    const swUnits = totalWeight ? (p.swUnits * (swWeight[y] || 0)) / totalWeight : 0;
    const swRev = swUnits * p.swPrice * liveServiceFactor(y);
    const v = (hw[y] || 0) + swRev;
    if (v > 0.05) out[y] = v;
  }
  return { annual: out, launchYear, launchQ: p.launchQ || 1 };
}

// ---------------------------------------------------------------------------
// 2 + 3. assemble every band
// ---------------------------------------------------------------------------

const nodes = [];   // {id,label,segment,company,kind,note,titles,launch}
const raw = {};     // id -> {year: $M}

for (const p of HARDWARE) {
  const { annual, launchYear, launchQ } = hardwareAnnual(p);
  raw[p.id] = annual;
  nodes.push({
    id: p.id, label: p.label, segment: p.segment, company: p.company,
    kind: 'hardware', note: p.note || null, titles: p.titles || null,
    launch: { year: launchYear, quarter: launchQ },
    lifetimeUnits: +Object.values(p.units).reduce((a, b) => a + b, 0).toFixed(2),
    lifetimeSoftwareUnits: p.swUnits || 0,
    launchPrice: p.hwPrice,
  });
}

const residuals = [];
for (const e of ENTITIES) {
  if (e.residual) { residuals.push(e); continue; }
  raw[e.id] = { ...e.rev };
  const ys = Object.keys(e.rev).map(Number).sort((a, b) => a - b);
  nodes.push({
    id: e.id, label: e.label, segment: e.segment, company: e.company,
    kind: 'entity', note: e.note || null, titles: e.titles || null,
    launch: { year: ys[0], quarter: 1 },
  });
}

// residual bands: segment total minus everything named in that segment
for (const e of residuals) {
  const segIdx = SEGMENTS.findIndex((s) => s.id === e.segment);
  const series = {};
  for (const y of YEARS) {
    const total = (SEGMENT_TOTALS[y] || [])[segIdx] || 0;
    let named = 0;
    for (const n of nodes) if (n.segment === e.segment) named += raw[n.id][y] || 0;
    const rest = total - named;
    // Keep at least 4% of the segment for the long tail; if the named bands already
    // overshoot the researched total, they get scaled back in step 4 anyway.
    series[y] = Math.max(total * 0.04, rest);
    if (total > 0 && rest < 0) {
      warn.push(`${e.segment} ${y}: named bands exceed segment total by $${Math.round(-rest)}M`);
    }
  }
  raw[e.id] = series;
  nodes.push({
    id: e.id, label: e.label, segment: e.segment, company: e.company,
    kind: 'residual', note: e.note || null, titles: null,
    launch: { year: Y0, quarter: 1 },
  });
}

// ---------------------------------------------------------------------------
// 4. rescale so each segment-year matches the researched total exactly
// ---------------------------------------------------------------------------

const annual = {};
for (const n of nodes) annual[n.id] = new Array(YEARS.length).fill(0);

SEGMENTS.forEach((seg, segIdx) => {
  const members = nodes.filter((n) => n.segment === seg.id);
  YEARS.forEach((y, yi) => {
    const target = (SEGMENT_TOTALS[y] || [])[segIdx] || 0;
    const sum = members.reduce((a, n) => a + (raw[n.id][y] || 0), 0);
    if (target <= 0 || sum <= 0) return;
    const k = target / sum;
    for (const n of members) annual[n.id][yi] = (raw[n.id][y] || 0) * k;
  });
});

// ---------------------------------------------------------------------------
// 5. quarterise
// ---------------------------------------------------------------------------

const periods = [];
for (const y of YEARS) for (let q = 1; q <= 4; q++) periods.push({ year: y, q, t: y + (q - 1) / 4, label: `${y} Q${q}` });

const quarterly = {};
for (const n of nodes) quarterly[n.id] = new Array(periods.length).fill(0);

for (const n of nodes) {
  YEARS.forEach((y, yi) => {
    const v = annual[n.id][yi];
    if (v <= 0) return;
    let w = SEASONALITY[n.segment](y).slice();

    // A platform that launched in, say, Q4 earns nothing in Q1-Q3 of that year.
    if (n.kind === 'hardware' && y === n.launch.year && n.launch.quarter > 1) {
      for (let q = 0; q < n.launch.quarter - 1; q++) w[q] = 0;
      // launches are front-loaded: the launch quarter is a spike, not a normal quarter
      w[n.launch.quarter - 1] *= 1.6;
    }
    const s = w.reduce((a, b) => a + b, 0);
    for (let q = 0; q < 4; q++) quarterly[n.id][yi * 4 + q] = (v * w[q]) / s;
  });
}

// ---------------------------------------------------------------------------
// 6. roll up + package
// ---------------------------------------------------------------------------

const companySet = new Map(); // `${segment}:${company}` -> node ids
for (const n of nodes) {
  const key = `${n.segment}:${n.company}`;
  if (!companySet.has(key)) companySet.set(key, []);
  companySet.get(key).push(n.id);
}

const companyNodes = [...companySet.entries()].map(([key, ids]) => {
  const [segment, company] = key.split(':');
  return {
    id: `co:${key}`, label: COMPANIES[company]?.label || company,
    color: COMPANIES[company]?.color || '#999',
    segment, company, children: ids,
  };
});

function sumSeries(ids, table, len) {
  const out = new Array(len).fill(0);
  for (const id of ids) for (let i = 0; i < len; i++) out[i] += table[id][i];
  return out;
}

for (const c of companyNodes) {
  annual[c.id] = sumSeries(c.children, annual, YEARS.length);
  quarterly[c.id] = sumSeries(c.children, quarterly, periods.length);
}
for (const s of SEGMENTS) {
  const ids = nodes.filter((n) => n.segment === s.id).map((n) => n.id);
  annual[`seg:${s.id}`] = sumSeries(ids, annual, YEARS.length);
  quarterly[`seg:${s.id}`] = sumSeries(ids, quarterly, periods.length);
}

const round = (arr) => arr.map((v) => +v.toFixed(2));
for (const k of Object.keys(annual)) annual[k] = round(annual[k]);
for (const k of Object.keys(quarterly)) quarterly[k] = round(quarterly[k]);

// inflation multipliers (nominal -> CPI_BASE_YEAR dollars)
const deflator = {};
for (const y of YEARS) deflator[y] = +(CPI[CPI_BASE_YEAR] / CPI[y]).toFixed(4);

const out = {
  meta: {
    // No build timestamp on purpose: the output must be byte-identical for the same
    // inputs, so CI can verify the committed dataset really came from these sources.
    unit: 'US$ millions',
    basis: 'worldwide consumer spending on video games, nominal US dollars',
    cpiBaseYear: CPI_BASE_YEAR,
    yearRange: [Y0, Y1],
    note: 'Quarterly values are modelled from annual research using segment seasonality and '
        + 'platform launch quarters. No public quarterly series exists before ~2010. '
        + 'See research/RESEARCH-NOTES.md.',
    confidence: CONFIDENCE,
  },
  yearRange: [Y0, Y1],
  segments: SEGMENTS,
  companies: COMPANIES,
  platforms: nodes,
  companyNodes,
  years: YEARS,
  periods,
  annual,
  quarterly,
  deflator,
  events: EVENTS,
  eras: ERAS,
};

mkdirSync(join(__dir), { recursive: true });
const path = join(__dir, 'gaming-revenue.json');
writeFileSync(path, JSON.stringify(out));
// Also emit a plain-script version so index.html works from a bare file:// double-click:
// browsers block fetch() and ES modules on the file: protocol, but a <script src> is fine.
writeFileSync(join(__dir, 'gaming-revenue.js'), `window.GAMING_DATA = ${JSON.stringify(out)};\n`);

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------
const totalAnnual = YEARS.map((y, i) => SEGMENTS.reduce((a, s) => a + annual[`seg:${s.id}`][i], 0));
console.log(`wrote ${path}`);
console.log(`${nodes.length} platform bands, ${companyNodes.length} company bands, ${periods.length} quarters`);
console.log('\nyear   total$M   arcade  console       pc handheld   mobile     vr  cloud');
for (const y of [1972, 1978, 1982, 1985, 1990, 1995, 2000, 2005, 2007, 2010, 2015, 2020, 2024, 2026]) {
  const i = y - Y0;
  const cols = SEGMENTS.map((s) => String(Math.round(annual[`seg:${s.id}`][i])).padStart(8));
  console.log(`${y}  ${String(Math.round(totalAnnual[i])).padStart(8)}  ${cols.join(' ')}`);
}
const q = quarterly;
const checkQ = YEARS.map((y, i) => {
  const a = SEGMENTS.reduce((t, s) => t + annual[`seg:${s.id}`][i], 0);
  const b = SEGMENTS.reduce((t, s) => t + q[`seg:${s.id}`].slice(i * 4, i * 4 + 4).reduce((x, v) => x + v, 0), 0);
  return Math.abs(a - b);
});
console.log(`\nmax annual-vs-quarterly reconciliation error: $${Math.max(...checkQ).toFixed(2)}M`);
if (warn.length) {
  console.log(`\n${warn.length} warnings (named bands over segment total):`);
  for (const w of warn.slice(0, 20)) console.log('  ' + w);
  if (warn.length > 20) console.log(`  ...and ${warn.length - 20} more`);
}
