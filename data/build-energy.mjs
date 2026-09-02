// Builds data/energy.json (+ .js) from the committed source CSVs in data/source/.
//   node data/build-energy.mjs
//
// Unlike the gaming half of this project, the generation numbers here are NOT
// modelled — they are ingested verbatim from published statistics. The only
// derived quantity is the carbon series, which is generation x an emission factor.
//
// Pipeline:
//   1. read committed CSVs (OWID by fuel; Eurostat by sub-fuel)
//   2. build the group -> fuel -> sub-fuel tree per entity
//   3. sub-fuels are rescaled to their parent fuel's OWID total, so the two
//      independent sources reconcile exactly
//   4. emit TWh and MtCO2e series
//   5. validate modelled carbon intensity against OWID's published series

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ENERGY_GROUPS, ENERGY_FUELS, ENERGY_SUBFUELS, CARBON_FACTORS, ENERGY_ENTITIES,
} from './energy-sources.mjs';
import { ENERGY_NOTES } from './energy-descriptions.mjs';
import { ENERGY_EVENTS, ENERGY_ERAS } from './energy-events.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dir, 'source');

const readCsv = (name) => {
  const lines = readFileSync(join(SRC, name), 'utf8').split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'));
  const hdr = lines[0].split(',');
  return lines.slice(1).map((l) => {
    const p = l.split(',');
    const o = {};
    hdr.forEach((h, i) => { o[h] = p[i]; });
    return o;
  });
};

// ---------------------------------------------------------------- 1. read
const gen = readCsv('electricity-by-source.csv');
const sub = readCsv('eurostat-subfuels.csv');
const ciCheck = readCsv('carbon-intensity-check.csv');

const FUEL_IDS = ENERGY_FUELS.map((f) => f.id);
const ENTITY_IDS = ENERGY_ENTITIES.map((e) => e.id);

// year range actually present
let Y0 = Infinity, Y1 = -Infinity;
for (const r of gen) { const y = +r.year; if (y < Y0) Y0 = y; if (y > Y1) Y1 = y; }
const YEARS = [];
for (let y = Y0; y <= Y1; y++) YEARS.push(y);
const yi = (y) => y - Y0;

// entity -> fuel -> per-year TWh
const twh = {};
for (const e of ENTITY_IDS) {
  twh[e] = {};
  for (const f of FUEL_IDS) twh[e][f] = new Array(YEARS.length).fill(0);
}
// Coverage is deliberately the range over which a COMPLETE fuel mix exists, not
// merely the range with any data at all. The upstream source carries hydro,
// nuclear and renewables back to 1965 for most countries but fossil fuels only
// from 1985; charting 1965-84 for, say, Germany would show nuclear and hydro
// alone and imply a spotlessly clean grid that never existed.
const covered = {};      // entity -> [firstCompleteYear, lastYear]
const FOSSIL = ['coal', 'oil', 'gas'];
for (const r of gen) {
  const e = r.entity, y = +r.year;
  if (!twh[e]) continue;
  for (const f of FUEL_IDS) {
    const v = r[f] === '' || r[f] === undefined ? 0 : +r[f];
    if (Number.isFinite(v)) twh[e][f][yi(y)] = v;
  }
  const hasFossil = FOSSIL.some((f) => r[f] !== '' && r[f] !== undefined);
  if (!covered[e]) covered[e] = [hasFossil ? y : Infinity, y];
  if (hasFossil) covered[e][0] = Math.min(covered[e][0], y);
  covered[e][1] = Math.max(covered[e][1], y);
}
for (const e of Object.keys(covered)) {
  if (!Number.isFinite(covered[e][0])) covered[e][0] = covered[e][1];
  // years before the complete-mix window are blanked so a partial series can
  // never be mistaken for a real one
  const cut = covered[e][0];
  for (const f of FUEL_IDS) {
    for (let y = Y0; y < cut; y++) twh[e][f][yi(y)] = 0;
  }
}

// ---------------------------------------------------------------- 2/3. sub-fuels
// Eurostat and OWID are independent sources with slightly different definitions
// (gross vs net production, and Eurostat's "coal" includes derived gases). Rather
// than let the two disagree on screen, the sub-fuel shares from Eurostat are
// applied to the OWID fuel total. Shares are real; the level is OWID's.
const subTwh = {};      // entity -> subfuelId -> per-year TWh
const subAvail = {};    // entity -> fuelId -> [firstYear,lastYear]
for (const e of ENTITY_IDS) { subTwh[e] = {}; subAvail[e] = {}; }

const rawSub = {};      // entity -> fuel -> year -> {subId: twh}
for (const r of sub) {
  const e = r.entity, y = +r.year, f = r.fuel, s = r.subfuel, v = +r.twh;
  if (!twh[e] || !Number.isFinite(v)) continue;
  rawSub[e] = rawSub[e] || {};
  rawSub[e][f] = rawSub[e][f] || {};
  rawSub[e][f][y] = rawSub[e][f][y] || {};
  rawSub[e][f][y][s] = v;
}

for (const e of Object.keys(rawSub)) {
  for (const f of Object.keys(rawSub[e])) {
    const subs = ENERGY_SUBFUELS[f] || [];
    for (const s of subs) subTwh[e][s.id] = new Array(YEARS.length).fill(0);
    let first = Infinity, last = -Infinity;
    for (const yStr of Object.keys(rawSub[e][f])) {
      const y = +yStr;
      if (y < Y0 || y > Y1) continue;
      const parts = rawSub[e][f][y];
      const sum = Object.values(parts).reduce((a, b) => a + b, 0);
      const parent = twh[e][f][yi(y)];
      if (sum <= 0 || parent <= 0) continue;
      for (const s of subs) {
        subTwh[e][s.id][yi(y)] = ((parts[s.id] || 0) / sum) * parent;
      }
      first = Math.min(first, y); last = Math.max(last, y);
    }
    if (first <= last) subAvail[e][f] = [first, last];

    // Eurostat's detail starts in 1990, but the parent series goes back further.
    // Without this band, opening coal for Germany would make everything before
    // 1990 vanish. It carries whatever the detailed statistics do not account for.
    const unsplit = new Array(YEARS.length).fill(0);
    for (let i = 0; i < YEARS.length; i++) {
      const parent = twh[e][f][i];
      const known = subs.reduce((a, sf) => a + (subTwh[e][sf.id] ? subTwh[e][sf.id][i] : 0), 0);
      unsplit[i] = Math.max(0, parent - known);
    }
    if (unsplit.some((v) => v > 0.0001)) subTwh[e][f + '-unsplit'] = unsplit;
  }
}

// ---------------------------------------------------------------- 4. nodes
const nodes = [];       // every drawable band, with its parent chain
const series = {};      // entity -> nodeId -> TWh per year

for (const e of ENTITY_IDS) series[e] = {};

for (const g of ENERGY_GROUPS) {
  nodes.push({ id: `grp:${g.id}`, label: g.label, level: 'group', group: g.id, color: g.color,
    note: ENERGY_NOTES[`grp:${g.id}`] || null });
}
for (const f of ENERGY_FUELS) {
  nodes.push({ id: `fuel:${f.id}`, label: f.label, level: 'fuel', group: f.group, fuel: f.id,
    color: f.color, note: ENERGY_NOTES[`fuel:${f.id}`] || null,
    carbon: CARBON_FACTORS[f.id] });
}
for (const [parent, subs] of Object.entries(ENERGY_SUBFUELS)) {
  const pf = ENERGY_FUELS.find((x) => x.id === parent);
  for (const s of subs) {
    nodes.push({ id: `sub:${s.id}`, label: s.label, level: 'subfuel', group: pf.group,
      fuel: parent, subfuel: s.id, siec: s.siec,
      note: ENERGY_NOTES[`sub:${s.id}`] || null, carbon: CARBON_FACTORS[s.id] });
  }
  nodes.push({
    id: `sub:${parent}-unsplit`, label: pf.label + ' — type not reported',
    level: 'subfuel', group: pf.group, fuel: parent, subfuel: parent + '-unsplit',
    note: 'Generation that the detailed statistics do not break down by fuel type. The Eurostat '
      + 'fuel-level series begins in 1990, so earlier years sit entirely in this band, as does '
      + 'any generation the detailed return does not classify.',
    carbon: CARBON_FACTORS[parent],
  });
}

for (const e of ENTITY_IDS) {
  for (const f of ENERGY_FUELS) series[e][`fuel:${f.id}`] = twh[e][f.id].map((v) => +v.toFixed(4));
  for (const [parent, subs] of Object.entries(ENERGY_SUBFUELS)) {
    for (const s of subs) {
      const arr = subTwh[e][s.id];
      if (arr) series[e][`sub:${s.id}`] = arr.map((v) => +v.toFixed(4));
    }
    const un = subTwh[e][parent + '-unsplit'];
    if (un) series[e][`sub:${parent}-unsplit`] = un.map((v) => +v.toFixed(4));
  }
  for (const g of ENERGY_GROUPS) {
    const members = ENERGY_FUELS.filter((f) => f.group === g.id);
    series[e][`grp:${g.id}`] = YEARS.map((_, i) =>
      +members.reduce((a, f) => a + twh[e][f.id][i], 0).toFixed(4));
  }
}

// ---------------------------------------------------------------- 5. carbon
// MtCO2e = TWh x gCO2/kWh / 1000
//   1 TWh = 1e9 kWh; x g/kWh = 1e9 g = 1e3 t = 1e-3 Mt  => TWh * g/kWh / 1000
const carbonOf = (nodeId) => {
  if (nodeId.startsWith('sub:')) {
    const id = nodeId.slice(4);
    if (id.endsWith('-unsplit')) return CARBON_FACTORS[id.replace('-unsplit', '')];
    return CARBON_FACTORS[id];
  }
  if (nodeId.startsWith('fuel:')) return CARBON_FACTORS[nodeId.slice(5)];
  return null;
};

const mt = {};        // lifecycle basis (IPCC AR5)
const mtDirect = {};  // combustion-only, fleet average
for (const e of ENTITY_IDS) {
  mt[e] = {}; mtDirect[e] = {};
  for (const n of nodes) {
    if (n.level === 'group') continue;
    const s2 = series[e][n.id];
    const cf = carbonOf(n.id);
    if (!s2 || !cf) continue;
    mt[e][n.id] = s2.map((v) => +(v * cf.life / 1000).toFixed(4));
    mtDirect[e][n.id] = s2.map((v) => +(v * (cf.direct || 0) / 1000).toFixed(4));
  }
  for (const g of ENERGY_GROUPS) {
    const members = ENERGY_FUELS.filter((f) => f.group === g.id);
    for (const [tbl, dst] of [[mt, mt], [mtDirect, mtDirect]]) {
      dst[e][`grp:${g.id}`] = YEARS.map((_, i) =>
        +members.reduce((a, f) => a + ((tbl[e][`fuel:${f.id}`] || [])[i] || 0), 0).toFixed(4));
    }
  }
}

// ---------------------------------------------------------------- 6. validate
// Modelled DIRECT intensity vs OWID's published carbon_intensity_elec.
const checks = [];
const published = {};
for (const r of ciCheck) {
  published[r.entity] = published[r.entity] || {};
  published[r.entity][+r.year] = +r.gco2_per_kwh;
}
for (const e of ENTITY_IDS) {
  for (const y of [2000, 2010, 2020, 2023]) {
    const p = published[e] && published[e][y];
    if (!p) continue;
    let gen2 = 0, co2g = 0;
    for (const f of ENERGY_FUELS) {
      const v = twh[e][f.id][yi(y)];
      gen2 += v;
      co2g += v * (CARBON_FACTORS[f.id].direct || 0);
    }
    if (gen2 <= 0) continue;
    const modelled = co2g / gen2;
    // A percentage error is unstable when the denominator is near zero: Norway's
    // grid is ~98% hydro, so a 24 gCO2/kWh absolute gap reads as -92%. A check
    // passes on EITHER a 20% relative or a 30 gCO2/kWh absolute agreement.
    const absDelta = modelled - p;
    checks.push({
      entity: e, year: y, published: p, modelled: +modelled.toFixed(1),
      delta: +(((modelled - p) / p) * 100).toFixed(1),
      absDelta: +absDelta.toFixed(1),
      pass: Math.abs((modelled - p) / p) <= 0.20 || Math.abs(absDelta) <= 30,
    });
  }
}
const bad = checks.filter((c) => !c.pass);

// ---------------------------------------------------------------- 7. emit
const out = {
  meta: {
    unit: 'TWh (generation) / MtCO2e (carbon)',
    yearRange: [Y0, Y1],
    generationSource: 'Our World in Data, "Electricity production by source" (Ember + '
      + 'Energy Institute Statistical Review + historical estimates), CC BY 4.0.',
    subfuelSource: 'Eurostat nrg_bal_peh, gross electricity production by fuel. '
      + 'Sub-fuel shares are applied to the OWID parent total so the two sources reconcile.',
    carbonSource: 'IPCC AR5 WGIII Annex III Table A.III.2 lifecycle medians (gCO2eq/kWh), '
      + 'read from the published PDF. Fuels absent from that table are derived and flagged.',
    aiDisclosure: 'The application around this dataset was built by an AI system. The '
      + 'generation figures are ingested verbatim from published statistics and are not '
      + 'modelled; the carbon series is generation multiplied by a published emission factor.',
  },
  years: YEARS,
  groups: ENERGY_GROUPS,
  fuels: ENERGY_FUELS,
  entities: ENERGY_ENTITIES.map((e) => ({
    id: e.id, label: e.label,
    coverage: covered[e.id] || null,
    subfuels: Object.keys(subAvail[e.id] || {}),
    note: ENERGY_NOTES[`entity:${e.id}`] || null,
  })),
  nodes,
  series,
  carbon: mt,
  carbonDirect: mtDirect,
  factors: CARBON_FACTORS,
  events: ENERGY_EVENTS,
  eras: ENERGY_ERAS,
  checks,
};

writeFileSync(join(__dir, 'energy.json'), JSON.stringify(out));
writeFileSync(join(__dir, 'energy.js'), `window.ENERGY_DATA = ${JSON.stringify(out)};\n`);

// ---------------------------------------------------------------- report
console.log(`wrote data/energy.json — ${YEARS.length} years (${Y0}-${Y1}), `
  + `${ENERGY_ENTITIES.length} entities, ${nodes.length} bands`);

console.log('\nCoverage:');
for (const e of ENERGY_ENTITIES) {
  const c = covered[e.id];
  const subs = Object.keys(subAvail[e.id] || {});
  console.log('  ' + e.label.padEnd(16) + (c ? c[0] + '-' + c[1] : 'NO DATA').padEnd(12)
    + (subs.length ? 'sub-fuels: ' + subs.join(',') : ''));
}

console.log('\nWorld generation, TWh:');
console.log('  year  ' + ENERGY_FUELS.map((f) => f.label.slice(0, 8).padStart(9)).join(''));
for (const y of [1900, 1925, 1950, 1975, 2000, 2024]) {
  if (y < Y0 || y > Y1) continue;
  console.log('  ' + y + '  ' + ENERGY_FUELS.map((f) =>
    twh.world[f.id][yi(y)].toFixed(0).padStart(9)).join(''));
}

console.log('\nCarbon-intensity validation (modelled direct vs OWID published, gCO2/kWh):');
const show = checks.filter((c) => [2000, 2023].includes(c.year)
  && ['world', 'usa', 'china', 'germany', 'france', 'india', 'norway', 'poland'].includes(c.entity));
for (const c of show) {
  console.log('  ' + (c.pass ? 'ok  ' : 'OFF ') + c.entity.padEnd(9) + c.year
    + '  published ' + String(c.published).padStart(7) + '  modelled ' + String(c.modelled).padStart(7)
    + '  ' + (c.delta > 0 ? '+' : '') + String(c.delta).padStart(6) + '%'
    + '  (' + (c.absDelta > 0 ? '+' : '') + c.absDelta + ' g/kWh)');
}
console.log(`\n${checks.length - bad.length}/${checks.length} checks pass `
  + '(within 20% relative OR 30 gCO2/kWh absolute).');
if (bad.length) {
  console.log('failing: ' + bad.map((c) =>
    `${c.entity}/${c.year} ${c.delta > 0 ? '+' : ''}${c.delta}% (${c.absDelta > 0 ? '+' : ''}${c.absDelta} g)`).join(', '));
  console.log('These are grids where combined heat and power or a very low carbon\n'
    + 'intensity makes a single fleet-average factor a poor fit. See research/ENERGY-NOTES.md.');
}
