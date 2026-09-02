// Trims the large upstream downloads into small, committed CSVs so that
// `node data/build-energy.mjs` is reproducible from a clean clone with no network.
//
//   node data/stage-energy-sources.mjs
//
// Upstream files (downloaded into research/sources/energy/, git-ignored):
//   owid_elec_by_source.csv   Our World in Data, "Electricity production by source"
//                             https://ourworldindata.org/grapher/electricity-production-by-source
//                             (Ember + Energy Institute; CC BY 4.0)
//   eurostat_coalrank.json    Eurostat nrg_bal_peh, gross electricity production by fuel
//                             https://ec.europa.eu/eurostat  (© European Union, reuse permitted)
//
// Outputs (committed):
//   data/source/electricity-by-source.csv
//   data/source/eurostat-subfuels.csv

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENERGY_ENTITIES, ENERGY_FUELS, ENERGY_SUBFUELS } from './energy-sources.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dir, '..', 'research', 'sources', 'energy');
const OUT = join(__dir, 'source');
mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------- OWID
const owidPath = join(SRC, 'owid_elec_by_source.csv');
if (!existsSync(owidPath)) {
  console.error('missing ' + owidPath + '\nDownload it with:\n'
    + '  curl -L -o "' + owidPath + '" "https://ourworldindata.org/grapher/electricity-production-by-source.csv?csvType=full"');
  process.exit(1);
}

const lines = readFileSync(owidPath, 'utf8').trim().split('\n');
const hdr = lines[0].split(',');
const iEnt = hdr.indexOf('Entity'), iYear = hdr.indexOf('Year');
const fuelCols = ENERGY_FUELS.map((f) => ({ id: f.id, i: hdr.indexOf(f.owid) }));
const missing = fuelCols.filter((f) => f.i < 0);
if (missing.length) throw new Error('OWID columns not found: ' + missing.map((m) => m.id).join(', '));

const wanted = new Map(ENERGY_ENTITIES.map((e) => [e.owid, e.id]));
const rows = [];
for (let i = 1; i < lines.length; i++) {
  const p = lines[i].split(',');
  const eid = wanted.get(p[iEnt]);
  if (!eid) continue;
  const year = +p[iYear];
  if (!Number.isFinite(year)) continue;
  const vals = fuelCols.map((f) => {
    const v = p[f.i];
    return v === '' || v === undefined ? '' : +(+v).toFixed(4);
  });
  if (vals.every((v) => v === '' || v === 0)) continue;
  rows.push([eid, year, ...vals].join(','));
}
rows.sort((a, b) => {
  const [ea, ya] = a.split(','), [eb, yb] = b.split(',');
  return ea === eb ? +ya - +yb : ea.localeCompare(eb);
});
writeFileSync(join(OUT, 'electricity-by-source.csv'),
  '# Electricity generation by source, TWh.\n'
  + '# Source: Our World in Data, "Electricity production by source" (Ember + Energy Institute\n'
  + '#   Statistical Review of World Energy + historical estimates). Licensed CC BY 4.0.\n'
  + '#   https://ourworldindata.org/grapher/electricity-production-by-source\n'
  + '# Trimmed to the entities in data/energy-sources.mjs by data/stage-energy-sources.mjs.\n'
  + ['entity,year,' + ENERGY_FUELS.map((f) => f.id).join(',')].concat(rows).join('\n') + '\n');
console.log(`electricity-by-source.csv: ${rows.length} rows`);

// ---------------------------------------------------------------- Eurostat
const euPath = join(SRC, 'eurostat_coalrank.json');
if (!existsSync(euPath)) {
  console.error('missing ' + euPath + ' — see research/ENERGY-NOTES.md for the API call');
  process.exit(1);
}
const j = JSON.parse(readFileSync(euPath, 'utf8'));
const dimIds = j.id, size = j.size;
const axis = dimIds.map((k) => {
  const c = j.dimension[k].category.index;
  const arr = [];
  for (const key in c) arr[c[key]] = key;
  return arr;
});
const iSiec = dimIds.indexOf('siec'), iGeo = dimIds.indexOf('geo'), iTime = dimIds.indexOf('time');

// flat index -> coordinate
const strides = size.map((_, i) => size.slice(i + 1).reduce((a, b) => a * b, 1));
const coord = (flat) => size.map((_, i) => Math.floor(flat / strides[i]) % size[i]);

const geoToEntity = new Map(ENERGY_ENTITIES.filter((e) => e.eurostat).map((e) => [e.eurostat, e.id]));
const siecToSub = new Map();
for (const [parent, subs] of Object.entries(ENERGY_SUBFUELS)) {
  for (const s of subs) siecToSub.set(s.siec, { id: s.id, parent });
}

const euRows = [];
for (const flat in j.value) {
  const v = j.value[flat];
  if (v == null) continue;
  const c = coord(+flat);
  const sub = siecToSub.get(axis[iSiec][c[iSiec]]);
  const eid = geoToEntity.get(axis[iGeo][c[iGeo]]);
  if (!sub || !eid) continue;
  euRows.push([eid, axis[iTime][c[iTime]], sub.parent, sub.id, +(v / 1000).toFixed(4)].join(','));
}
euRows.sort();
writeFileSync(join(OUT, 'eurostat-subfuels.csv'),
  '# Gross electricity production by detailed fuel, TWh (converted from GWh).\n'
  + '# Source: Eurostat, nrg_bal_peh "Production of electricity and derived heat by type of fuel",\n'
  + '#   indicator GEP (gross electricity production). (c) European Union; reuse permitted with attribution.\n'
  + '#   https://ec.europa.eu/eurostat/databrowser/view/nrg_bal_peh\n'
  + '# Trimmed by data/stage-energy-sources.mjs.\n'
  + ['entity,year,fuel,subfuel,twh'].concat(euRows).join('\n') + '\n');
console.log(`eurostat-subfuels.csv: ${euRows.length} rows`);

// -------------------------------------------- carbon-intensity cross-check
// OWID publishes carbon_intensity_elec (gCO2/kWh, direct/operational emissions of
// the power sector). The build compares its own modelled direct intensity against
// this, which is an independent test of the whole factor set.
const ciPath = join(SRC, 'owid_energy.csv');
if (existsSync(ciPath)) {
  const NL = '\n';
  const cl = readFileSync(ciPath, 'utf8').trim().split(NL);
  const ch = cl[0].split(',');
  const cEnt = ch.indexOf('country'), cYear = ch.indexOf('year'), cCI = ch.indexOf('carbon_intensity_elec');
  const out = [];
  for (let i = 1; i < cl.length; i++) {
    const p = cl[i].split(',');
    const eid = wanted.get(p[cEnt]);
    if (!eid || !p[cCI]) continue;
    out.push([eid, +p[cYear], +(+p[cCI]).toFixed(2)].join(','));
  }
  out.sort();
  writeFileSync(join(OUT, 'carbon-intensity-check.csv'),
    '# Published carbon intensity of electricity, gCO2/kWh (direct power-sector emissions).' + NL
    + '# Source: Our World in Data energy dataset, column carbon_intensity_elec. CC BY 4.0.' + NL
    + '#   https://github.com/owid/energy-data' + NL
    + '# Used by data/build-energy.mjs purely as an independent check on CARBON_FACTORS.' + NL
    + ['entity,year,gco2_per_kwh'].concat(out).join(NL) + NL);
  console.log(`carbon-intensity-check.csv: ${out.length} rows`);
} else {
  console.log('carbon-intensity-check.csv: SKIPPED (owid_energy.csv not present)');
}
