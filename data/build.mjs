// Builds data/gaming-revenue.json (+ .js) from the researched inputs.
//   node data/build.mjs
//
// Pipeline:
//   1. hardware platforms  -> annual revenue from shipment curves
//   2. revenue entities    -> annual revenue taken as given
//   3. residual bands      -> whatever is left of the segment total
//   4. rescale             -> every segment-year sums exactly to segments.mjs
//   5. regionalise         -> segment regional shares x company affinity
//   6. roll up             -> platform -> company -> segment -> total
//   7. validate            -> compare regional totals against published figures
//
// The output is deterministic: the same inputs always produce byte-identical
// files, so CI can prove the committed dataset came from these sources.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEGMENTS, SEGMENT_TOTALS, CPI, CPI_BASE_YEAR, CONFIDENCE } from './segments.mjs';
import { COMPANIES, HARDWARE, ENTITIES, liveServiceFactor } from './platforms.mjs';
import { EVENTS, ERAS } from './events.mjs';
import { REGIONS, REGION_SHARES, COMPANY_REGION_AFFINITY, REGION_CHECKS } from './regions.mjs';
import { SEGMENT_NOTES, COMPANY_NOTES, REGION_NOTES } from './descriptions.mjs';

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
// working through the pack-in); index 1 is the following year (peak).
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
  const hwOnly = {};
  const years = new Set([...Object.keys(hw), ...Object.keys(swWeight)].map(Number));
  for (const y of [...years].sort((a, b) => a - b)) {
    if (y > Y1) continue;
    const swUnits = totalWeight ? (p.swUnits * (swWeight[y] || 0)) / totalWeight : 0;
    const swRev = swUnits * p.swPrice * liveServiceFactor(y);
    const v = (hw[y] || 0) + swRev;
    if (v > 0.05) { out[y] = v; hwOnly[y] = hw[y] || 0; }
  }
  return { annual: out, hardwareOnly: hwOnly, launchYear, launchQ: p.launchQ || 1 };
}

// ---------------------------------------------------------------------------
// 2 + 3. assemble every band
// ---------------------------------------------------------------------------

const nodes = [];   // {id,label,segment,company,kind,...}
const raw = {};     // id -> {year: $M}
const rawHw = {};   // id -> {year: $M} hardware component only (for the checks)

for (const p of HARDWARE) {
  const { annual, hardwareOnly, launchYear, launchQ } = hardwareAnnual(p);
  raw[p.id] = annual;
  rawHw[p.id] = hardwareOnly;
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
  rawHw[e.id] = {};
  const ys = Object.keys(e.rev).map(Number).sort((a, b) => a - b);
  nodes.push({
    id: e.id, label: e.label, segment: e.segment, company: e.company,
    kind: 'entity', note: e.note || null, titles: e.titles || null,
    launch: { year: ys[0], quarter: 1 },
  });
}

for (const e of residuals) {
  const segIdx = SEGMENTS.findIndex((s) => s.id === e.segment);
  const series = {};
  for (const y of YEARS) {
    const total = (SEGMENT_TOTALS[y] || [])[segIdx] || 0;
    let named = 0;
    for (const n of nodes) if (n.segment === e.segment) named += raw[n.id][y] || 0;
    const rest = total - named;
    series[y] = Math.max(total * 0.04, rest);
    if (total > 0 && rest < 0) {
      warn.push(`${e.segment} ${y}: named bands exceed segment total by $${Math.round(-rest)}M`);
    }
  }
  raw[e.id] = series;
  rawHw[e.id] = {};
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
const hardwareAnnualById = {};
for (const n of nodes) {
  annual[n.id] = new Array(YEARS.length).fill(0);
  hardwareAnnualById[n.id] = new Array(YEARS.length).fill(0);
}

SEGMENTS.forEach((seg, segIdx) => {
  const members = nodes.filter((n) => n.segment === seg.id);
  YEARS.forEach((y, yi) => {
    const target = (SEGMENT_TOTALS[y] || [])[segIdx] || 0;
    const sum = members.reduce((a, n) => a + (raw[n.id][y] || 0), 0);
    if (target <= 0 || sum <= 0) return;
    const k = target / sum;
    for (const n of members) {
      annual[n.id][yi] = (raw[n.id][y] || 0) * k;
      hardwareAnnualById[n.id][yi] = (rawHw[n.id][y] || 0) * k;
    }
  });
});

// ---------------------------------------------------------------------------
// 5. regionalise
// ---------------------------------------------------------------------------

const RIDS = REGIONS.map((r) => r.id);

/** Interpolate a segment's regional shares for one year, normalised to sum to 1. */
function sharesFor(segment, year) {
  const table = REGION_SHARES[segment];
  const anchors = Object.keys(table).map(Number).sort((a, b) => a - b);
  let arr;
  if (year <= anchors[0]) arr = table[anchors[0]];
  else if (year >= anchors[anchors.length - 1]) arr = table[anchors[anchors.length - 1]];
  else {
    let i = 0;
    while (i < anchors.length - 1 && anchors[i + 1] < year) i++;
    const a = anchors[i], b = anchors[i + 1];
    const t = (year - a) / (b - a);
    arr = table[a].map((v, k) => v + (table[b][k] - v) * t);
  }
  const sum = arr.reduce((x, y2) => x + y2, 0) || 1;
  return arr.map((v) => v / sum);
}

// regionAnnual[regionId][nodeId] = per-year array
const regionAnnual = {};
const regionHardware = {};
for (const r of RIDS) { regionAnnual[r] = {}; regionHardware[r] = {}; }
for (const n of nodes) for (const r of RIDS) {
  regionAnnual[r][n.id] = new Array(YEARS.length).fill(0);
  regionHardware[r][n.id] = new Array(YEARS.length).fill(0);
}

SEGMENTS.forEach((seg) => {
  const members = nodes.filter((n) => n.segment === seg.id);
  YEARS.forEach((y, yi) => {
    const shares = sharesFor(seg.id, y);

    // Weight = worldwide value x company affinity, per region; then renormalise so
    // the region's slice of the segment is exactly shares[k] x segmentTotal.
    for (let k = 0; k < RIDS.length; k++) {
      const rid = RIDS[k];
      let weightSum = 0;
      const weights = members.map((n) => {
        const aff = COMPANY_REGION_AFFINITY[`${n.segment}:${n.company}`];
        const m = aff && aff[rid] != null ? aff[rid] : 1;
        const w = annual[n.id][yi] * m;
        weightSum += w;
        return w;
      });
      const segTotal = members.reduce((a, n) => a + annual[n.id][yi], 0);
      const regionTotal = segTotal * shares[k];
      if (weightSum <= 0 || regionTotal <= 0) continue;
      members.forEach((n, mi) => {
        const v = (weights[mi] / weightSum) * regionTotal;
        regionAnnual[rid][n.id][yi] = v;
        // hardware share of that band, carried through at the same proportion
        const hwFrac = annual[n.id][yi] > 0 ? hardwareAnnualById[n.id][yi] / annual[n.id][yi] : 0;
        regionHardware[rid][n.id][yi] = v * hwFrac;
      });
    }
  });
});

// ---------------------------------------------------------------------------
// 6. roll up + package
// ---------------------------------------------------------------------------

const companySet = new Map();
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
    // A company band with a single platform IS that platform on screen, so it
    // inherits the platform's description rather than showing nothing.
    note: COMPANY_NOTES[key]
      || (ids.length === 1 ? (nodes.find((n) => n.id === ids[0]) || {}).note : null)
      || null,
  };
});

function sumInto(table, ids, len) {
  const out = new Array(len).fill(0);
  for (const id of ids) for (let i = 0; i < len; i++) out[i] += table[id][i];
  return out;
}

const L = YEARS.length;
for (const c of companyNodes) {
  annual[c.id] = sumInto(annual, c.children, L);
  for (const r of RIDS) regionAnnual[r][c.id] = sumInto(regionAnnual[r], c.children, L);
}
for (const s of SEGMENTS) {
  const ids = nodes.filter((n) => n.segment === s.id).map((n) => n.id);
  annual[`seg:${s.id}`] = sumInto(annual, ids, L);
  for (const r of RIDS) regionAnnual[r][`seg:${s.id}`] = sumInto(regionAnnual[r], ids, L);
}

const round = (arr) => arr.map((v) => +v.toFixed(2));
for (const k of Object.keys(annual)) annual[k] = round(annual[k]);
for (const r of RIDS) for (const k of Object.keys(regionAnnual[r])) {
  regionAnnual[r][k] = round(regionAnnual[r][k]);
}

const deflator = {};
for (const y of YEARS) deflator[y] = +(CPI[CPI_BASE_YEAR] / CPI[y]).toFixed(4);

// ---------------------------------------------------------------------------
// 7. validate the regional model against independently published figures
// ---------------------------------------------------------------------------

const checkResults = REGION_CHECKS.map((c) => {
  const yi = c.year - Y0;
  let modelled = SEGMENTS.reduce((a, s) => a + regionAnnual[c.region][`seg:${s.id}`][yi], 0);
  let note = 'all spending';
  if (c.contentOnly) {
    // published figure excludes hardware and (for Newzoo) arcade + cloud
    const hw = nodes.reduce((a, n) => a + regionHardware[c.region][n.id][yi], 0);
    const arcade = regionAnnual[c.region]['seg:arcade'][yi];
    const cloud = regionAnnual[c.region]['seg:cloud'][yi];
    modelled = modelled - hw - arcade - cloud;
    note = 'content only (hardware, arcade and cloud removed)';
  }
  const delta = (modelled - c.value) / c.value;
  return {
    year: c.year, region: c.region, published: c.value,
    modelled: +modelled.toFixed(0), delta: +(delta * 100).toFixed(1),
    pass: Math.abs(delta) <= c.tol, tol: +(c.tol * 100).toFixed(0),
    basis: note, source: c.source,
  };
});

const out = {
  yearRange: [Y0, Y1],
  meta: {
    // No build timestamp on purpose: the output must be byte-identical for the
    // same inputs, so CI can verify the committed dataset came from these sources.
    unit: 'US$ millions',
    basis: 'worldwide consumer spending on video games, nominal US dollars',
    cpiBaseYear: CPI_BASE_YEAR,
    yearRange: [Y0, Y1],
    aiDisclosure: 'This dataset and the application around it were researched, modelled '
      + 'and written by an AI system (Claude). Figures are compiled and estimated from '
      + 'public sources and have not been independently audited by a human analyst. '
      + 'AI systems can and do make mistakes, including confidently stated ones. Treat '
      + 'every number here as a sourced estimate, not as a measurement, and check the '
      + 'primary sources in research/RESEARCH-NOTES.md before relying on any of it.',
    note: 'Annual resolution. Regional splits are modelled from published regional '
      + 'totals; see data/regions.mjs and the validation table printed by the build.',
    confidence: CONFIDENCE,
  },
  segments: SEGMENTS.map((x) => ({ ...x, note: SEGMENT_NOTES[x.id] || null })),
  regions: REGIONS.map((x) => ({ ...x, note: REGION_NOTES[x.id] || null })),
  companies: COMPANIES,
  platforms: nodes,
  companyNodes,
  years: YEARS,
  annual,
  regionAnnual,
  deflator,
  events: EVENTS,
  eras: ERAS,
  regionChecks: checkResults,
};

const path = join(__dir, 'gaming-revenue.json');
writeFileSync(path, JSON.stringify(out));
// Plain-script version so index.html works from a bare file:// double-click:
// browsers block fetch() and ES modules on the file: protocol, but <script src> is fine.
writeFileSync(join(__dir, 'gaming-revenue.js'), `window.GAMING_DATA = ${JSON.stringify(out)};\n`);

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------
const totalAnnual = YEARS.map((y, i) => SEGMENTS.reduce((a, s) => a + annual[`seg:${s.id}`][i], 0));
console.log(`wrote ${path}`);
console.log(`${nodes.length} platform bands, ${companyNodes.length} company bands, ${REGIONS.length} regions`);

console.log('\nyear   total$M   arcade  console       pc handheld   mobile     vr  cloud');
for (const y of [1972, 1978, 1982, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024, 2026]) {
  const i = y - Y0;
  const cols = SEGMENTS.map((s) => String(Math.round(annual[`seg:${s.id}`][i])).padStart(8));
  console.log(`${y}  ${String(Math.round(totalAnnual[i])).padStart(8)}  ${cols.join(' ')}`);
}

console.log('\nRegional totals, $M (all spending incl. hardware)');
console.log('year  ' + REGIONS.map((r) => r.short.padStart(11)).join(''));
for (const y of [1982, 1990, 2000, 2010, 2020, 2024, 2026]) {
  const i = y - Y0;
  const cells = REGIONS.map((r) =>
    String(Math.round(SEGMENTS.reduce((a, s) => a + regionAnnual[r.id][`seg:${s.id}`][i], 0))).padStart(11));
  console.log(`${y}  ${cells.join('')}`);
}

console.log('\nValidation against independently published regional figures');
let failed = 0;
for (const c of checkResults) {
  if (!c.pass) failed++;
  console.log(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.year} ${c.region.padEnd(5)} `
    + `published $${(c.published / 1000).toFixed(1)}B  modelled $${(c.modelled / 1000).toFixed(1)}B  `
    + `${c.delta > 0 ? '+' : ''}${c.delta}% (tol ${c.tol}%)`);
}
console.log(failed ? `\n${failed} regional check(s) outside tolerance.` : '\nAll regional checks within tolerance.');

// Every region's shares must sum to the segment total, by construction — verify.
let maxRegErr = 0;
SEGMENTS.forEach((s) => YEARS.forEach((y, i) => {
  const ww = annual[`seg:${s.id}`][i];
  const rr = RIDS.reduce((a, r) => a + regionAnnual[r][`seg:${s.id}`][i], 0);
  maxRegErr = Math.max(maxRegErr, Math.abs(ww - rr));
}));
console.log(`max worldwide-vs-sum-of-regions error: $${maxRegErr.toFixed(2)}M`);

if (warn.length) {
  console.log(`\n${warn.length} warnings (named bands over segment total):`);
  for (const w of warn.slice(0, 10)) console.log('  ' + w);
  if (warn.length > 10) console.log(`  ...and ${warn.length - 10} more`);
}
