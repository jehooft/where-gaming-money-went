/* Two datasets, one chart engine.
 *
 *   Tab 1  Where gaming's money went  — worldwide video game revenue, 1970-2026
 *   Tab 2  Where our electricity comes from — generation by source, 1900-2025
 *
 * Both are drawn by the same streamgraph code; a "dataset adapter" supplies the
 * tree, the series, the colours and the number formatting. Data:
 * data/gaming-revenue.js and data/energy.js. Maths: js/stream.js.
 */
(function () {
'use strict';

const S = window.Stream;
const SVGNS = 'http://www.w3.org/2000/svg';

const el = (id) => document.getElementById(id);
const svg = el('chart');
const stage = el('stage');
const tooltip = el('tooltip');

const measureCtx = document.createElement('canvas').getContext('2d');
function textWidth(str, font) { measureCtx.font = font; return measureCtx.measureText(str).width; }

function make(tag, attrs, parent) {
  const n = document.createElementNS(SVGNS, tag);
  if (attrs) for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
/** Colours reach innerHTML inside style attributes; validate the shape. */
function safeColor(c) {
  return /^#[0-9a-fA-F]{3,8}$/.test(String(c)) ? String(c) : '#8b8b8b';
}
function fmtPct(frac) {
  if (!isFinite(frac)) return '—';
  return (frac * 100).toFixed(frac < 0.001 && frac > 0 ? 2 : 1) + '%';
}
function siFmt(v, unit, big, bigDiv) {
  if (v == null || !isFinite(v)) return '—';
  if (v >= bigDiv) return (v / bigDiv).toFixed(v >= bigDiv * 100 ? 0 : 1) + big;
  if (v >= 1) return v.toFixed(v >= 100 ? 0 : 1) + unit;
  if (v > 0) return '<1' + unit;
  return '—';
}

// ===========================================================================
// Dataset adapters
// ===========================================================================
// Each returns a common shape the chart engine understands.

function buildTreeIndex(roots) {
  const byKey = new Map(), parent = new Map();
  (function walk(list, p) {
    for (const n of list) {
      byKey.set(n.key, n);
      parent.set(n.key, p);
      if (n.children) walk(n.children, n);
    }
  })(roots, null);
  return { byKey, parent };
}

// ---------------------------------------------------------------- gaming
function makeGaming() {
  const D = window.GAMING_DATA;
  const SEG = new Map(D.segments.map((s) => [s.id, s]));
  const PLAT = new Map(D.platforms.map((p) => [p.id, p]));
  const CO = new Map(D.companyNodes.map((c) => [c.id, c]));
  const REG = new Map(D.regions.map((r) => [r.id, r]));

  const roots = D.segments.map((s) => ({
    key: `seg:${s.id}`, label: s.label, level: 'segment', top: s.id, company: null,
    children: D.companyNodes.filter((c) => c.segment === s.id).map((c) => ({
      key: c.id, label: c.label, level: 'company', top: s.id, company: c.company,
      children: c.children.map((pid) => {
        const p = PLAT.get(pid);
        return { key: pid, label: p.label, level: 'platform', top: s.id, company: c.company, node: p, children: null };
      }),
    })),
  }));
  for (const r of roots) for (const c of r.children) c.collapsible = c.children.length > 1;
  const { byKey, parent } = buildTreeIndex(roots);

  const platIndex = new Map();
  for (const r of roots) for (const c of r.children) {
    c.children.forEach((p, i) => platIndex.set(p.key, { i, n: c.children.length }));
  }

  const Y0 = D.yearRange[0], Y1 = D.yearRange[1];
  const fullIdx = [];
  for (let y = Y0; y <= Y1; y++) fullIdx.push(y - Y0);
  const topOrder = (() => {
    const vals = D.segments.map((s) => fullIdx.map((i) => D.annual[`seg:${s.id}`][i] || 0));
    return S.orderInsideOut(vals).map((i) => D.segments[i].id);
  })();

  return {
    id: 'gaming',
    yearRange: [Y0, Y1],
    roots, byKey, parent, topOrder,
    topLabel: 'Segments',
    hideHint: 'The eye icon removes a segment from the chart completely, so it stops counting '
      + 'towards the total.',
    entityLabel: 'Region',
    entities: [{ id: 'world', label: 'Worldwide', short: 'Worldwide', note: null }]
      .concat(D.regions.map((r) => ({ id: r.id, label: r.label, short: r.short, note: r.note }))),
    modes: [
      { id: 'real', label: 'Real (2025 $)' },
      { id: 'nominal', label: 'Nominal' },
    ],
    defaultMode: 'real',
    basisText: (mode) => (mode === 'real'
      ? 'inflation-adjusted to ' + D.meta.cpiBaseYear + ' US dollars'
      : 'nominal US dollars'),
    axisTitle: () => 'Revenue',
    events: D.events.map((e) => ({ ...e, anchorTop: e.segment })),
    eras: D.eras,
    series(key, cols, ctx) {
      const table = ctx.entity === 'world' ? D.annual : (D.regionAnnual[ctx.entity] || D.annual);
      const src = table[key];
      if (!src) return cols.map(() => 0);
      const real = ctx.mode === 'real';
      return cols.map((c) => {
        const v = src[c.idx] || 0;
        return real ? v * (D.deflator[c.year] || 1) : v;
      });
    },
    color(n) {
      const segColor = SEG.get(n.top).color;
      if (n.level === 'segment') return segColor;
      const co = (D.companies[n.company] && D.companies[n.company].color) || '#8b8b8b';
      const base = S.mix(segColor, co, 0.5);
      if (n.level === 'company') return base;
      const pos = platIndex.get(n.key) || { i: 0, n: 1 };
      const t = pos.n > 1 ? pos.i / (pos.n - 1) : 0.5;
      return S.shade(base, 0.22 - 0.44 * t);
    },
    format: (v) => siFmt(v, 'M', 'B', 1000).replace(/^/, '$'),
    formatLong: (v) => (v >= 1000 ? '$' + (v / 1000).toFixed(2) + ' billion' : '$' + Math.round(v) + ' million'),
    scaleUnit: (v) => '$' + (v / 1000).toFixed(v < 1000 ? 1 : 0) + 'B',
    detail(n) {
      const p = n.level === 'platform' ? n.node : null;
      const facts = [];
      if (n.level === 'segment') facts.push(['Level', 'Segment']);
      if (n.level === 'company') facts.push(['Level', `Company · ${SEG.get(n.top).label}`]);
      if (n.level === 'platform') facts.push(['Level', `Platform · ${SEG.get(n.top).label}`]);
      if (p && p.launch) facts.push(['Launched', `${p.launch.year}${p.launch.quarter ? ' Q' + p.launch.quarter : ''}`]);
      if (p && p.launchPrice) facts.push(['Launch price', '$' + p.launchPrice]);
      if (p && p.lifetimeUnits) facts.push(['Hardware', p.lifetimeUnits.toFixed(1) + 'M units']);
      if (p && p.lifetimeSoftwareUnits) facts.push(['Software', Math.round(p.lifetimeSoftwareUnits) + 'M copies']);
      const note = (p && p.note)
        || (n.level === 'segment' ? (SEG.get(n.top) || {}).note : null)
        || (n.level === 'company' ? (CO.get(n.key) || {}).note : null);
      return { facts, note, tags: p && p.titles };
    },
    entityNote: (id) => (REG.get(id) || {}).note || null,
  };
}

// ---------------------------------------------------------------- energy
function makeEnergy() {
  const D = window.ENERGY_DATA;
  const N = new Map(D.nodes.map((n) => [n.id, n]));
  const ENT = new Map(D.entities.map((e) => [e.id, e]));

  const roots = D.groups.map((g) => ({
    key: `grp:${g.id}`, label: g.label, level: 'group', top: g.id,
    children: D.fuels.filter((f) => f.group === g.id).map((f) => {
      const subs = D.nodes.filter((n) => n.level === 'subfuel' && n.fuel === f.id);
      return {
        key: `fuel:${f.id}`, label: f.label, level: 'fuel', top: g.id, fuel: f.id,
        children: subs.map((s) => ({
          key: s.id, label: s.label, level: 'subfuel', top: g.id, fuel: f.id, sub: s.subfuel, children: null,
        })),
      };
    }),
  }));
  // A fuel only subdivides where a statistics agency reports the split, and that
  // varies by country — set per entity in `refresh` below.
  const { byKey, parent } = buildTreeIndex(roots);

  const Y0 = D.meta.yearRange[0], Y1 = D.meta.yearRange[1];
  const fullIdx = [];
  for (let y = Y0; y <= Y1; y++) fullIdx.push(y - Y0);
  const topOrder = (() => {
    const vals = D.groups.map((g) => fullIdx.map((i) => (D.series.world[`grp:${g.id}`] || [])[i] || 0));
    return S.orderInsideOut(vals).map((i) => D.groups[i].id);
  })();

  const subIndex = new Map();
  for (const r of roots) for (const f of r.children) {
    f.children.forEach((s, i) => subIndex.set(s.key, { i, n: f.children.length }));
  }

  const ds = {
    id: 'energy',
    yearRange: [Y0, Y1],
    roots, byKey, parent, topOrder,
    topLabel: 'Sources',
    hideHint: 'The eye icon removes a source group from the chart completely, so it stops '
      + 'counting towards the total and towards Share percentages.',
    entityLabel: 'Country',
    entities: D.entities.map((e) => ({ id: e.id, label: e.label, short: e.label, note: e.note })),
    modes: [
      { id: 'twh', label: 'Electricity (TWh)' },
      { id: 'co2life', label: 'CO₂e — lifecycle' },
      { id: 'co2direct', label: 'CO₂ — burned' },
    ],
    defaultMode: 'twh',
    basisText: (mode) => (mode === 'twh'
      ? 'electricity generated, terawatt-hours'
      : mode === 'co2life'
        ? 'greenhouse gases, million tonnes CO₂-equivalent, full lifecycle (IPCC AR5)'
        : 'carbon dioxide from combustion only, million tonnes, fleet-average factors'),
    axisTitle: (mode) => (mode === 'twh' ? 'Generation' : 'Emissions'),
    events: D.events.map((e) => ({ ...e, anchorTop: (D.fuels.find((f) => f.id === e.fuel) || {}).group })),
    eras: D.eras,
    series(key, cols, ctx) {
      const table = ctx.mode === 'twh' ? D.series
        : ctx.mode === 'co2direct' ? D.carbonDirect : D.carbon;
      const src = (table[ctx.entity] || {})[key];
      if (!src) return cols.map(() => 0);
      return cols.map((c) => src[c.idx] || 0);
    },
    color(n) {
      if (n.level === 'group') return (D.groups.find((g) => g.id === n.top) || {}).color || '#888';
      const f = D.fuels.find((x) => x.id === n.fuel);
      const base = (f && f.color) || '#888';
      if (n.level === 'fuel') return base;
      const pos = subIndex.get(n.key) || { i: 0, n: 1 };
      const t = pos.n > 1 ? pos.i / (pos.n - 1) : 0.5;
      return S.shade(base, 0.3 - 0.55 * t);
    },
    format(v, _j, ctx) {
      return ctx && ctx.mode !== 'twh'
        ? siFmt(v, ' Mt', ' Gt', 1000)
        : siFmt(v, ' TWh', ' PWh', 1000);
    },
    formatLong(v, ctx) {
      const unit = ctx && ctx.mode !== 'twh' ? 'million tonnes CO₂' : 'TWh';
      return (v >= 1000 ? (v / 1000).toFixed(2) + (unit === 'TWh' ? ' PWh' : ' billion tonnes CO₂')
        : Math.round(v) + ' ' + unit);
    },
    scaleUnit(v, ctx) {
      return ctx && ctx.mode !== 'twh'
        ? (v / 1000).toFixed(v < 1000 ? 1 : 0) + ' Gt'
        : (v / 1000).toFixed(v < 1000 ? 1 : 0) + ' PWh';
    },
    detail(n, ctx) {
      const facts = [];
      const meta = N.get(n.key) || {};
      facts.push(['Level', n.level === 'group' ? 'Source group'
        : n.level === 'fuel' ? 'Energy source' : 'Specific fuel']);
      const cf = meta.carbon;
      if (cf) {
        facts.push(['Lifecycle', cf.life + ' gCO₂e/kWh']);
        facts.push(['Range', cf.min + '–' + cf.max]);
        if (cf.direct != null) facts.push(['When burned', cf.direct + ' gCO₂/kWh']);
      }
      if (n.level === 'subfuel' && meta.siec) facts.push(['Eurostat code', meta.siec]);
      let note = meta.note || null;
      if (cf && cf.derived) {
        note = (note ? note + ' ' : '')
          + '— Emission factor note: this fuel has no row in IPCC AR5 Annex III, so its factor is '
          + 'derived. ' + cf.src;
      }
      return { facts, note, tags: null };
    },
    entityNote: (id) => (ENT.get(id) || {}).note || null,
    /** Which fuels can be opened for this entity, and what years it covers. */
    refresh(entity) {
      const e = ENT.get(entity) || {};
      const allowed = new Set(e.subfuels || []);
      for (const r of roots) {
        for (const f of r.children) f.collapsible = allowed.has(f.fuel) && f.children.length > 1;
      }
      return e.coverage || [Y0, Y1];
    },
    coverage: (id) => (ENT.get(id) || {}).coverage || [Y0, Y1],
    subfuelsFor: (id) => (ENT.get(id) || {}).subfuels || [],
  };
  return ds;
}

const DATASETS = { gaming: makeGaming(), energy: makeEnergy() };

// ===========================================================================
// State
// ===========================================================================
const views = {
  gaming: {
    expanded: new Set(), hidden: new Set(), selected: null,
    entity: 'world', mode: DATASETS.gaming.defaultMode,
    from: DATASETS.gaming.yearRange[0], to: DATASETS.gaming.yearRange[1],
  },
  energy: {
    // start with the three groups open, so the default view is the nine sources
    expanded: new Set(DATASETS.energy.roots.map((r) => r.key)),
    hidden: new Set(), selected: null,
    entity: 'world', mode: DATASETS.energy.defaultMode,
    from: DATASETS.energy.yearRange[0], to: DATASETS.energy.yearRange[1],
  },
};

const state = {
  tab: 'gaming',
  offset: 'wiggle',
  theme: 'dark',
  showNotes: true,
  showLabels: true,
  hoverKey: null,
  hoverCol: null,
};

const DS = () => DATASETS[state.tab];
const V = () => views[state.tab];

function isWithin(key, ancestorKey) {
  const ds = DS();
  let n = ds.byKey.get(key);
  while (n) {
    if (n.key === ancestorKey) return true;
    n = ds.parent.get(n.key);
  }
  return false;
}

// ===========================================================================
// Columns, bands, ordering
// ===========================================================================
function columns() {
  const v = V(), ds = DS();
  const out = [];
  for (let y = v.from; y <= v.to; y++) {
    out.push({ idx: y - ds.yearRange[0], year: y, label: String(y), t: y });
  }
  return out;
}

function seriesFor(key, cols) {
  const v = V();
  return DS().series(key, cols, { entity: v.entity, mode: v.mode });
}

function visibleBands() {
  const v = V();
  const out = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.level === 'segment' || n.level === 'group') {
        if (v.hidden.has(n.top)) continue;
      }
      const canExpand = n.children && n.children.length > 0 && n.collapsible !== false;
      if (canExpand && v.expanded.has(n.key)) walk(n.children);
      else out.push(n);
    }
  };
  walk(DS().roots);
  return out;
}

/**
 * Bottom-to-top order. Top-level groups keep a stable inside-out order; within a
 * group, children are ordered inside-out but kept contiguous, so sibling bands
 * (PlayStation 1-5, or the coal ranks) are never split by an unrelated band.
 */
function orderBands(bands, cols) {
  const ds = DS();
  const byTop = new Map();
  for (const b of bands) {
    if (!byTop.has(b.top)) byTop.set(b.top, []);
    byTop.get(b.top).push(b);
  }
  const result = [];
  for (const topId of ds.topOrder) {
    const group = byTop.get(topId);
    if (!group || !group.length) continue;
    if (group.length === 1) { result.push(group[0]); continue; }

    const buckets = new Map();
    for (const b of group) {
      const k = b.level === 'segment' || b.level === 'group' ? '__top'
        : (b.company || b.fuel || b.key);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(b);
    }
    const keys = [...buckets.keys()];
    const memberSeries = new Map();
    const bucketTotals = keys.map((k) => {
      const t = new Array(cols.length).fill(0);
      for (const m of buckets.get(k)) {
        const s = seriesFor(m.key, cols);
        memberSeries.set(m.key, s);
        for (let j = 0; j < cols.length; j++) t[j] += s[j];
      }
      return t;
    });
    for (const ci of S.orderInsideOut(bucketTotals)) {
      const members = buckets.get(keys[ci]);
      if (members.length === 1) { result.push(members[0]); continue; }
      for (const i of S.orderInsideOut(members.map((m) => memberSeries.get(m.key)))) {
        result.push(members[i]);
      }
    }
  }
  return result;
}

// ===========================================================================
// Formatting
// ===========================================================================
function fmtValue(v, colIndex) {
  if (state.offset === 'expand') {
    const total = lastData && lastData.totals ? lastData.totals[colIndex] : 0;
    return total > 0 ? fmtPct(v / total) : '—';
  }
  return DS().format(v, colIndex, { mode: V().mode });
}

// ===========================================================================
// Geometry
// ===========================================================================
let W = 1200, H = 640;
const M = { top: 26, right: 26, bottom: 40, left: 68 };

function layout() {
  const rect = stage.getBoundingClientRect();
  W = Math.max(560, Math.round(rect.width));
  H = Math.round(Math.min(980, Math.max(620, W * 0.60)));
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
}

// ===========================================================================
// Render
// ===========================================================================
let lastRender = null;
let lastData = null;

function render() {
  layout();
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const ds = DS(), v = V();
  const cols = columns();
  const bands = orderBands(visibleBands(), cols);
  const values = bands.map((b) => seriesFor(b.key, cols));
  const totals = cols.map((_, j) => values.reduce((a, s) => a + s[j], 0));
  lastData = { cols, bands, values, totals };

  // In Share mode, columns where nothing existed yet carry no composition.
  const stackValues = state.offset === 'expand' ? backfillEmptyColumns(values, totals) : values;
  const bounds = S.stack(stackValues, bands.map((_, i) => i), state.offset);

  const noteRoom = state.showNotes && cols.length > 6
    ? Math.round(Math.max(118, Math.min(215, H * 0.235))) : 8;
  const plotTop = M.top + noteRoom;
  const plotBottom = H - M.bottom - noteRoom;
  const plotLeft = M.left;
  const plotRight = W - M.right;

  let lo = Infinity, hi = -Infinity;
  for (const band of bounds) for (const [a, b] of band) { if (a < lo) lo = a; if (b > hi) hi = b; }
  if (!isFinite(lo)) { lo = 0; hi = 1; }
  if (hi === lo) hi = lo + 1;
  const pad = (hi - lo) * 0.02;
  lo -= pad; hi += pad;

  const x = (j) => plotLeft + (cols.length === 1 ? 0 : (j / (cols.length - 1)) * (plotRight - plotLeft));
  const y = (val) => plotBottom - ((val - lo) / (hi - lo)) * (plotBottom - plotTop);

  const gGrid = make('g', { class: 'grid' }, svg);
  const gBands = make('g', { class: 'bands' }, svg);
  const gLabels = make('g', { class: 'labels' }, svg);
  const gNotes = make('g', { class: 'notes' }, svg);
  const gAxis = make('g', { class: 'axis' }, svg);

  drawXAxis(gAxis, gGrid, cols, x, plotTop, plotBottom, H);
  drawYAxis(gAxis, gGrid, y, lo, hi, plotLeft, plotRight);

  const tension = state.offset === 'expand' ? 0.75 : 0.35;
  const paths = [];
  bands.forEach((b, i) => {
    const d = S.areaPath(bounds[i], x, y, true, tension);
    const p = make('path', {
      d, fill: ds.color(b), class: 'band', 'data-key': b.key,
      'shape-rendering': 'geometricPrecision',
    }, gBands);
    p.__band = b;
    paths.push(p);
    make('path', { d, class: 'band-outline' }, gBands);
  });

  if (state.showLabels) drawBandLabels(gLabels, bands, bounds, values, cols, x, y);
  if (state.showNotes && noteRoom > 20) {
    drawNotes(gNotes, bands, bounds, cols, x, y, plotTop, plotBottom, M.top, H - M.bottom);
  }

  lastRender = { cols, bands, values, bounds, x, y, plotLeft, plotRight, plotTop, plotBottom, paths };
  applyHighlight();
  renderLegend();
  renderRanks();
  renderCrumbs();
}

function backfillEmptyColumns(values, totals) {
  const m = totals.length;
  if (totals.findIndex((t) => t > 0) <= 0) return values;
  return values.map((s) => {
    const copy = s.slice();
    for (let j = 0; j < m; j++) {
      if (totals[j] > 0) continue;
      let src = j;
      while (src < m && totals[src] <= 0) src++;
      if (src >= m) { src = j; while (src >= 0 && totals[src] <= 0) src--; }
      if (src >= 0 && src < m) copy[j] = s[src];
    }
    return copy;
  });
}

// ---------------------------------------------------------------- axes
function drawXAxis(g, gGrid, cols, x, plotTop, plotBottom, height) {
  const v = V();
  const span = v.to - v.from;
  const step = span > 90 ? 20 : span > 44 ? 10 : span > 22 ? 5 : span > 10 ? 2 : 1;
  const baseY = height - M.bottom + 16;
  make('line', { x1: x(0), y1: height - M.bottom, x2: x(cols.length - 1), y2: height - M.bottom }, g);

  cols.forEach((c, j) => {
    if (c.year % step !== 0) return;
    const px = x(j);
    make('line', { x1: px, y1: plotTop, x2: px, y2: plotBottom, class: 'gridline' }, gGrid);
    const t = make('text', { x: px, y: baseY, 'text-anchor': 'middle' }, g);
    t.textContent = c.year;
  });

  for (const era of DS().eras) {
    if (era.from <= v.from || era.from >= v.to) continue;
    const j = cols.findIndex((c) => c.year === era.from);
    if (j < 0) continue;
    make('line', { x1: x(j), y1: M.top, x2: x(j), y2: height - M.bottom, class: 'era-rule' }, gGrid);
    const t = make('text', { x: x(j) + 5, y: M.top + 10, class: 'era-label' }, g);
    t.textContent = era.label;
  }
}

function drawYAxis(g, gGrid, y, lo, hi, left, right) {
  const ds = DS(), v = V();
  const title = make('text', { x: 6, y: 14, class: 'axis-title' }, g);
  title.textContent = state.offset === 'expand' ? 'Share of total' : ds.axisTitle(v.mode);

  if (state.offset === 'expand') {
    for (const val of [0, 0.25, 0.5, 0.75, 1]) {
      make('line', { x1: left, y1: y(val), x2: right, y2: y(val), class: 'gridline' }, gGrid);
      const t = make('text', { x: left - 8, y: y(val) + 4, 'text-anchor': 'end' }, g);
      t.textContent = (val * 100) + '%';
    }
    return;
  }
  if (state.offset === 'zero') {
    for (const val of niceTicks(0, hi, 6)) {
      make('line', { x1: left, y1: y(val), x2: right, y2: y(val), class: 'gridline' }, gGrid);
      const t = make('text', { x: left - 8, y: y(val) + 4, 'text-anchor': 'end' }, g);
      t.textContent = val === 0 ? '0' : ds.scaleUnit(val, { mode: v.mode });
    }
    return;
  }
  // Stream / Centred: vertical position is meaningless, so show a thickness bar.
  const unit = niceTicks(0, (hi - lo) / 3, 2).filter((val) => val > 0)[0] || (hi - lo) / 4;
  const mid = lo + (hi - lo) * 0.5;
  const yTop = y(mid + unit / 2), yBot = y(mid - unit / 2);
  const bx = left - 30;
  const bar = { stroke: 'currentColor', 'stroke-width': 1.4, opacity: 0.45 };
  make('line', Object.assign({ x1: bx, y1: yTop, x2: bx, y2: yBot }, bar), g);
  make('line', Object.assign({ x1: bx - 4, y1: yTop, x2: bx + 4, y2: yTop }, bar), g);
  make('line', Object.assign({ x1: bx - 4, y1: yBot, x2: bx + 4, y2: yBot }, bar), g);
  const cy = (yTop + yBot) / 2;
  const lab = make('text', {
    x: bx - 8, y: cy, 'text-anchor': 'middle', transform: `rotate(-90 ${bx - 8} ${cy})`,
  }, g);
  lab.textContent = ds.scaleUnit(unit, { mode: v.mode }) + ' thick';
}

function niceTicks(min, max, count) {
  const span = max - min || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const stepN = norm >= 7.5 ? 10 : norm >= 3.5 ? 5 : norm >= 1.5 ? 2 : 1;
  const step = stepN * mag;
  const out = [];
  for (let v2 = Math.ceil(min / step) * step; v2 <= max + 1e-9; v2 += step) out.push(+v2.toFixed(6));
  return out;
}

// ---------------------------------------------------------------- band labels
function drawBandLabels(g, bands, bounds, values, cols, x, y) {
  const ds = DS();
  const placed = [];
  const plotW = x(cols.length - 1) - x(0);

  bands.forEach((b, i) => {
    const band = bounds[i];
    const cands = [];
    for (let j = 1; j < band.length - 1; j++) {
      const h = Math.abs(y(band[j][0]) - y(band[j][1]));
      const hPrev = Math.abs(y(band[j - 1][0]) - y(band[j - 1][1]));
      const hNext = Math.abs(y(band[j + 1][0]) - y(band[j + 1][1]));
      cands.push({ j, score: Math.min(h, (hPrev + hNext) / 2) });
    }
    cands.sort((a, z) => z.score - a.score);

    for (const cand of cands.slice(0, 14)) {
      const best = cand.score;
      if (best < 11) return;
      const bi = cand.j;
      const cy = (y(band[bi][0]) + y(band[bi][1])) / 2;
      const cx = x(bi);
      const size = Math.max(9.5, Math.min(18, best * 0.44));
      const font = `700 ${size}px "Inter", system-ui, sans-serif`;
      const w = textWidth(b.label, font);
      if (w > plotW * 0.5) return;
      if (cx - w / 2 < x(0) - 4 || cx + w / 2 > x(cols.length - 1) + 4) continue;

      const showSub = best > 32;
      const box = { x0: cx - w / 2 - 6, x1: cx + w / 2 + 6, y0: cy - size, y1: cy + size + (showSub ? 12 : 0) };
      if (placed.some((p) => !(box.x1 < p.x0 || box.x0 > p.x1 || box.y1 < p.y0 || box.y0 > p.y1))) continue;
      placed.push(box);

      const fill = ds.color(b);
      const light = S.luminance(fill) > 0.45;
      const ink = light ? 'rgba(10,12,16,.94)' : 'rgba(255,255,255,.97)';
      const halo = light ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.3)';
      const t = make('text', {
        x: cx, y: cy + size * 0.34, 'text-anchor': 'middle', class: 'band-label',
        fill: ink, stroke: halo, 'stroke-width': 2.4, 'font-size': size,
      }, g);
      t.textContent = b.label;
      if (showSub) {
        const s2 = make('text', {
          x: cx, y: cy + size * 0.34 + size * 0.95, 'text-anchor': 'middle', class: 'band-sub',
          fill: ink, stroke: halo, 'stroke-width': 2,
        }, g);
        s2.textContent = fmtValue(values[i][bi], bi) + '  ·  ' + cols[bi].label;
      }
      return;
    }
  });
}

// ---------------------------------------------------------------- notes
function wrapText(str, font, maxW, maxLines) {
  const words = str.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (textWidth(test, font) > maxW && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else line = test;
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    const rest = str.slice(lines.join(' ').length).trim();
    if (rest) {
      while (textWidth(last + '…', font) > maxW && last.length > 4) last = last.slice(0, -1);
      lines[maxLines - 1] = last.replace(/[ ,.;:]+$/, '') + '…';
    }
  }
  return lines;
}

function drawNotes(g, bands, bounds, cols, x, y, plotTop, plotBottom, topEdge, bottomEdge) {
  const ds = DS(), v = V();
  const span = v.to - v.from;
  const maxTier = span <= 20 ? 3 : W > 1500 ? 3 : W > 1080 ? 2 : 1;
  const boxW = Math.max(110, Math.min(178, (x(cols.length - 1) - x(0)) / 9));
  const titleFont = '700 10.5px "Inter", system-ui, sans-serif';
  const bodyFont = '400 9.8px "Inter", system-ui, sans-serif';
  const lineH = 11.5;

  const topRows = new Map();
  bands.forEach((b, i) => {
    if (!topRows.has(b.top)) topRows.set(b.top, []);
    topRows.get(b.top).push(i);
  });

  const items = [];
  for (const ev of ds.events) {
    if (ev.tier > maxTier) continue;
    if (ev.year < v.from || ev.year > v.to) continue;
    if (v.hidden.has(ev.anchorTop)) continue;
    const j = cols.findIndex((c) => c.year === ev.year);
    if (j < 0) continue;

    const idxs = topRows.get(ev.anchorTop) || [];
    let anchorY;
    if (idxs.length) {
      const a = Math.min.apply(null, idxs.map((i) => bounds[i][j][0]));
      const b = Math.max.apply(null, idxs.map((i) => bounds[i][j][1]));
      anchorY = y((a + b) / 2);
    } else anchorY = (plotTop + plotBottom) / 2;

    items.push({
      ev, j, px: x(j), anchorY, side: ev.side,
      titleLines: wrapText(ev.title, titleFont, boxW, 2),
      bodyLines: wrapText(ev.text, bodyFont, boxW, span <= 24 ? 5 : 3),
    });
  }

  const laneSlot = 2 * 12 + (span <= 24 ? 5 : 3) * lineH + 12;
  const maxLane = {
    top: Math.max(0, Math.floor((plotTop - topEdge - 8) / laneSlot) - 1),
    bottom: Math.max(0, Math.floor((bottomEdge - plotBottom - 8) / laneSlot) - 1),
  };

  items.sort((a, b) => (a.ev.tier - b.ev.tier) || (a.px - b.px));
  const lanes = { top: [], bottom: [] };
  for (const it of items) {
    it.h = it.titleLines.length * 12 + it.bodyLines.length * lineH + 12;
    const arr = lanes[it.side];
    it.lane = null;
    for (let lane = 0; lane <= maxLane[it.side]; lane++) {
      const occ = arr[lane] || (arr[lane] = []);
      if (!occ.some((o) => it.px - boxW / 2 < o.x1 + 10 && it.px + boxW / 2 > o.x0 - 10)) {
        occ.push({ x0: it.px - boxW / 2, x1: it.px + boxW / 2, h: it.h });
        it.lane = lane;
        break;
      }
    }
  }

  const laneHeight = (side) => lanes[side].map((occ) =>
    Math.max.apply(null, occ.map((o) => o.h).concat([24])));
  const topH = laneHeight('top'), botH = laneHeight('bottom');
  const laneY = (side, lane) => {
    const hs = side === 'top' ? topH : botH;
    let acc = 0;
    for (let i = 0; i < lane; i++) acc += hs[i] + 8;
    if (side === 'top') {
      const total = hs.reduce((a, b) => a + b + 8, 0);
      return Math.max(topEdge + 2, plotTop - 10 - total) + acc;
    }
    return plotBottom + 14 + acc;
  };

  items.sort((a, b) => a.px - b.px);
  for (const it of items) {
    if (it.lane == null) continue;
    const boxY = laneY(it.side, it.lane);
    const boxH = it.titleLines.length * 12 + it.bodyLines.length * lineH;
    if (it.side === 'top' && boxY < topEdge - 4) continue;
    if (it.side === 'bottom' && boxY + boxH > bottomEdge - 2) continue;

    const grp = make('g', { class: 'note-g note-hit' }, g);
    grp.__event = it.ev;
    const connectY = it.side === 'top' ? boxY + boxH + 4 : boxY - 6;
    make('path', { d: `M${it.px},${connectY}L${it.px},${it.anchorY}`, class: 'note-line' }, grp);
    make('circle', { cx: it.px, cy: it.anchorY, r: 2.6, class: 'note-dot' }, grp);

    const anchor = it.px < boxW / 2 + 10 ? 'start' : it.px > W - boxW / 2 - 10 ? 'end' : 'middle';
    const tx = anchor === 'start' ? Math.max(6, it.px - boxW / 2)
      : anchor === 'end' ? Math.min(W - 6, it.px + boxW / 2)
        : Math.max(boxW / 2 + 6, Math.min(W - boxW / 2 - 6, it.px));

    let cy = boxY + 9;
    const anchorNode = ds.roots.find((r) => r.top === it.ev.anchorTop);
    const yr = make('text', {
      x: tx, y: cy, 'text-anchor': anchor, class: 'note-year',
      fill: anchorNode ? ds.color(anchorNode) : 'currentColor',
    }, grp);
    yr.textContent = it.ev.year;
    cy += 12;
    for (const line of it.titleLines) {
      const t = make('text', { x: tx, y: cy, 'text-anchor': anchor, class: 'note-title' }, grp);
      t.textContent = line;
      cy += 12;
    }
    for (const line of it.bodyLines) {
      const t = make('text', { x: tx, y: cy, 'text-anchor': anchor, class: 'note-body' }, grp);
      t.textContent = line;
      cy += lineH;
    }
    const hitX = anchor === 'start' ? tx - 3 : anchor === 'end' ? tx - boxW - 3 : tx - boxW / 2 - 3;
    make('rect', { x: hitX, y: boxY - 4, width: boxW + 6, height: (cy - boxY) + 6, fill: 'transparent' }, grp);
  }
}

// ---------------------------------------------------------------- highlight
function applyHighlight() {
  if (!lastRender) return;
  const key = state.hoverKey || V().selected;
  for (const p of lastRender.paths) {
    const related = !key || isWithin(p.__band.key, key);
    p.classList.toggle('dim', !!key && !related);
    p.classList.toggle('hot', !!key && p.__band.key === key);
  }
}

// ===========================================================================
// Interaction
// ===========================================================================
svg.addEventListener('mousemove', (e) => {
  if (!lastRender) return;
  const pt = svgPoint(e);
  const { cols, plotLeft, plotRight } = lastRender;
  const frac = (pt.x - plotLeft) / Math.max(1, plotRight - plotLeft);
  const j = Math.max(0, Math.min(cols.length - 1, Math.round(frac * (cols.length - 1))));
  const colChanged = j !== state.hoverCol;
  state.hoverCol = j;

  const band = e.target.closest && e.target.closest('.band');
  const key = band ? band.getAttribute('data-key') : null;
  if (key !== state.hoverKey) { state.hoverKey = key; applyHighlight(); }
  if (colChanged) renderRanks();
  if (key) showTooltip(key, j, e); else hideTooltip();
});

svg.addEventListener('mouseleave', () => {
  state.hoverKey = null; state.hoverCol = null;
  applyHighlight(); hideTooltip(); renderRanks();
});

svg.addEventListener('click', (e) => {
  const noteEl = e.target.closest && e.target.closest('.note-g');
  if (noteEl && noteEl.__event) { e.stopPropagation(); openNote(noteEl.__event, e); return; }
  const bandEl = e.target.closest && e.target.closest('.band');
  if (!bandEl) return;
  e.stopPropagation();
  activate(bandEl.getAttribute('data-key'));
});

svg.addEventListener('wheel', (e) => {
  if (!lastRender) return;
  e.preventDefault();
  const v = V(), ds = DS();
  const cov = ds.coverage ? ds.coverage(v.entity) : ds.yearRange;
  const LO = Math.max(ds.yearRange[0], cov[0]), HI = Math.min(ds.yearRange[1], cov[1]);
  const { plotLeft, plotRight } = lastRender;
  const pt = svgPoint(e);
  const frac = Math.max(0, Math.min(1, (pt.x - plotLeft) / Math.max(1, plotRight - plotLeft)));
  const anchor = v.from + frac * (v.to - v.from);
  const span = v.to - v.from;
  const factor = e.deltaY > 0 ? 1.18 : 1 / 1.18;
  const next = Math.round(Math.max(4, Math.min(HI - LO, span * factor)));
  let from = Math.round(anchor - frac * next);
  let to = from + next;
  if (from < LO) { from = LO; to = from + next; }
  if (to > HI) { to = HI; from = to - next; }
  if (from < LO) from = LO;
  if (from === v.from && to === v.to) return;
  v.from = from; v.to = to;
  syncRangeInputs();
  hideTooltip();
  render();
}, { passive: false });

function svgPoint(e) {
  const r = svg.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

function activate(key) {
  const ds = DS(), v = V();
  const n = ds.byKey.get(key);
  if (!n) return;
  v.selected = key;
  if (n.children && n.children.length && n.collapsible !== false) {
    if (v.expanded.has(key)) v.expanded.delete(key);
    else v.expanded.add(key);
  }
  render();
  showDetail(n);
}

/**
 * Two-stage dismissal. The first click clears the selection, so the highlight
 * lifts and every band — including sub-bands you just opened — returns to full
 * colour. Only a second click collapses the drill-down.
 */
function dismissStep() {
  const v = V();
  if (v.selected) {
    v.selected = null;
    el('detail-card').hidden = true;
    applyHighlight();
    renderLegend();
    return true;
  }
  if (v.expanded.size) {
    const ds = DS();
    // energy starts with its three groups open; collapsing returns to that
    v.expanded = ds.id === 'energy' ? new Set(ds.roots.map((r) => r.key)) : new Set();
    render();
    return true;
  }
  return false;
}

function collapseAll() {
  const ds = DS(), v = V();
  v.expanded = ds.id === 'energy' ? new Set(ds.roots.map((r) => r.key)) : new Set();
  v.selected = null;
  el('detail-card').hidden = true;
  render();
}

// ---------------------------------------------------------------- tooltip
function showTooltip(key, j, e) {
  const ds = DS();
  const { cols, bands, values } = lastRender;
  const i = bands.findIndex((b) => b.key === key);
  if (i < 0) return hideTooltip();
  const b = bands[i];
  const val = values[i][j];
  const total = lastData.totals[j];
  const rank = values.map((s, k) => ({ k, v: s[j] }))
    .sort((a, z) => z.v - a.v).findIndex((r) => r.k === i) + 1;
  const canExpand = b.children && b.children.length && b.collapsible !== false;
  const share = total > 0 ? fmtPct(val / total) : '—';
  const raw = ds.format(val, j, { mode: V().mode });
  const headline = state.offset === 'expand' ? share : raw;
  const secondary = state.offset === 'expand' ? raw + ' of the total' : share + ' of the total';

  const parentNode = ds.parent.get(b.key);
  const trail = parentNode ? parentNode.label : null;

  tooltip.innerHTML =
    `<div class="tt-head">
      <span class="tt-sw" style="background:${safeColor(ds.color(b))}"></span>
      <span class="tt-name">${escapeHtml(b.label)}</span>
      <span class="tt-when">${escapeHtml(cols[j].label)}</span>
    </div>
    <div class="tt-val">${headline}</div>
    <div class="tt-meta">${secondary} · #${rank} of ${bands.length}${trail ? ' · ' + escapeHtml(trail) : ''}</div>
    ${canExpand ? `<div class="tt-hint">Click to ${V().expanded.has(b.key) ? 'collapse' : 'break out ' + b.children.length + ' ' + (ds.id === 'energy' ? 'fuels' : b.level === 'segment' ? 'companies' : 'platforms')}</div>` : ''}`;

  tooltip.hidden = false;
  const r = stage.getBoundingClientRect();
  let left = e.clientX - r.left;
  let top = e.clientY - r.top;
  const tw = tooltip.offsetWidth;
  left = Math.max(tw / 2 + 6, Math.min(r.width - tw / 2 - 6, left));
  if (top < tooltip.offsetHeight + 20) top = top + tooltip.offsetHeight + 34;
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}
function hideTooltip() { tooltip.hidden = true; }

// ---------------------------------------------------------------- detail card
function showDetail(n) {
  const ds = DS(), v = V();
  el('detail-card').hidden = false;
  el('detail-title').textContent = n.label;

  const cols = columns();
  const series = seriesFor(n.key, cols);
  const total = series.reduce((a, b) => a + b, 0);
  let peakV = -1, peakJ = 0;
  series.forEach((val, j) => { if (val > peakV) { peakV = val; peakJ = j; } });

  const d = ds.detail(n, { mode: v.mode }) || { facts: [], note: null };
  const facts = d.facts.slice();
  facts.push([`Total ${v.from}–${v.to}`, ds.formatLong(total, { mode: v.mode })]);
  facts.push(['Peak', `${cols[peakJ].label} · ${ds.format(peakV, peakJ, { mode: v.mode })}`]);

  el('detail-body').innerHTML =
    `<dl class="facts">${facts.map(([k, val]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(val)}</dd>`).join('')}</dl>
     ${d.note ? `<p class="note">${escapeHtml(d.note)}</p>` : ''}
     ${d.tags ? `<ul class="titles">${d.tags.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : ''}`;
}

el('detail-close').addEventListener('click', () => {
  el('detail-card').hidden = true;
  V().selected = null;
  applyHighlight();
});

// ---------------------------------------------------------------- legend
const EYE_ON = '<svg class="eye" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.2c-3 0-5.4 2-6.4 4.8 1 2.8 3.4 4.8 6.4 4.8s5.4-2 6.4-4.8C13.4 5.2 11 3.2 8 3.2zm0 8a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm0-1.6a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z" fill="currentColor"/></svg>';
const EYE_OFF = '<svg class="eye" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.3 2.3 1.2 3.4l2.1 2.1A8.6 8.6 0 0 0 1.6 8c1 2.8 3.4 4.8 6.4 4.8 1.2 0 2.3-.3 3.3-.9l2 2 1.1-1.1L2.3 2.3zm5.7 8.9a3.2 3.2 0 0 1-2.9-4.6l1.3 1.3a1.6 1.6 0 0 0 1.9 1.9l1.3 1.3c-.5.1-1 .1-1.6.1zM8 3.2c3 0 5.4 2 6.4 4.8-.4 1-1 1.9-1.7 2.6l-2.3-2.3A3.2 3.2 0 0 0 6.5 4.6L5.2 3.3c.9-.1 1.8-.1 2.8-.1z" fill="currentColor"/></svg>';

function renderLegend() {
  const ds = DS(), v = V();
  const root = el('legend');
  const cols = columns();
  const lastJ = cols.length - 1;
  root.innerHTML = '';

  const build = (nodes, parentEl) => {
    for (const n of nodes) {
      const isTop = n.level === 'segment' || n.level === 'group';
      const isHidden = isTop && v.hidden.has(n.top);
      const li = document.createElement('li');
      if (isHidden) li.className = 'is-hidden';

      const canExpand = n.children && n.children.length && n.collapsible !== false;
      const isOpen = v.expanded.has(n.key);
      const val = isHidden ? null : seriesFor(n.key, cols)[lastJ] || 0;

      const row = document.createElement('div');
      row.className = 'row-wrap';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'row' + (v.selected === n.key ? ' active' : '');
      if (canExpand) btn.setAttribute('aria-expanded', String(isOpen));
      btn.innerHTML =
        `${canExpand
          ? '<svg class="caret" viewBox="0 0 8 8" aria-hidden="true"><path d="M2 1l4 3-4 3z" fill="currentColor"/></svg>'
          : '<span class="caret"></span>'}
         <span class="swatch" style="background:${safeColor(ds.color(n))}"></span>
         <span class="name">${escapeHtml(n.label)}</span>
         <span class="val">${isHidden ? 'hidden' : fmtValue(val, lastJ)}</span>`;
      if (!isHidden) {
        btn.addEventListener('click', (e) => { e.stopPropagation(); activate(n.key); });
        btn.addEventListener('mouseenter', () => { state.hoverKey = n.key; applyHighlight(); });
        btn.addEventListener('mouseleave', () => { state.hoverKey = null; applyHighlight(); });
      } else btn.disabled = true;
      row.appendChild(btn);

      if (isTop) {
        const eye = document.createElement('button');
        eye.type = 'button';
        eye.className = 'eyebtn';
        eye.innerHTML = isHidden ? EYE_OFF : EYE_ON;
        eye.title = isHidden ? `Show ${n.label} again` : `Hide ${n.label} from the chart entirely`;
        eye.setAttribute('aria-label', eye.title);
        eye.setAttribute('aria-pressed', String(isHidden));
        eye.addEventListener('click', (e) => {
          e.stopPropagation();
          if (v.hidden.has(n.top)) v.hidden.delete(n.top);
          else {
            v.hidden.add(n.top);
            v.expanded.delete(n.key);
            for (const c of n.children) v.expanded.delete(c.key);
            if (v.selected && isWithin(v.selected, n.key)) {
              v.selected = null;
              el('detail-card').hidden = true;
            }
          }
          render();
        });
        row.appendChild(eye);
      }
      li.appendChild(row);

      if (canExpand && isOpen && !isHidden) {
        const ul = document.createElement('ul');
        ul.className = 'children';
        build(n.children, ul);
        li.appendChild(ul);
      }
      parentEl.appendChild(li);
    }
  };
  build(ds.roots, root);

  el('legend-title').textContent = ds.topLabel;
  el('legend-hint').textContent = ds.hideHint;
  const showAll = el('show-all');
  showAll.hidden = v.hidden.size === 0;
  showAll.textContent = `Show all (${v.hidden.size} hidden)`;
}

// ---------------------------------------------------------------- ranks
function renderRanks() {
  if (!lastData) return;
  const ds = DS();
  const { cols, bands, values, totals } = lastData;
  const j = state.hoverCol != null && state.hoverCol < cols.length ? state.hoverCol : cols.length - 1;
  const rows = bands.map((b, i) => ({ b, v: values[i][j] }))
    .sort((a, z) => z.v - a.v).slice(0, 9);
  el('rank-period').textContent = cols[j] ? cols[j].label : '';
  el('ranklist').innerHTML = rows.map((r) =>
    `<li><span class="rk-sw" style="background:${safeColor(ds.color(r.b))}"></span><b>${escapeHtml(r.b.label)}</b> <span class="v">${
      state.offset === 'expand'
        ? (totals[j] > 0 ? fmtPct(r.v / totals[j]) : '—')
        : ds.format(r.v, j, { mode: V().mode })
    }</span></li>`).join('');
}

// ---------------------------------------------------------------- crumbs
function renderCrumbs() {
  const ds = DS(), v = V();
  const box = el('crumbs');
  const baseline = ds.id === 'energy' ? new Set(ds.roots.map((r) => r.key)) : new Set();
  const open = [...v.expanded].filter((k) => !baseline.has(k)).map((k) => ds.byKey.get(k)).filter(Boolean);
  box.innerHTML = '';
  if (!open.length) {
    const s2 = document.createElement('span');
    s2.textContent = ds.id === 'energy'
      ? 'Click a source to break it into specific fuels, where the statistics report them. Scroll to zoom the years.'
      : 'Click a band to break it into companies, or scroll to zoom the years.';
    box.appendChild(s2);
    return;
  }
  const lead = document.createElement('span');
  lead.textContent = 'Opened:';
  box.appendChild(lead);
  for (const n of open) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = `<span class="dot" style="background:${safeColor(ds.color(n))}"></span>${escapeHtml(n.label)}<span class="x">×</span>`;
    btn.title = 'Collapse ' + n.label;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      v.expanded.delete(n.key);
      if (n.children) for (const c of n.children) v.expanded.delete(c.key);
      render();
    });
    box.appendChild(btn);
  }
}

// ---------------------------------------------------------------- note popup
const notePop = el('note-pop');
function openNote(ev, e) {
  el('note-title').textContent = `${ev.year} — ${ev.title}`;
  el('note-text').textContent = ev.text;
  notePop.hidden = false;
  const w = notePop.offsetWidth, h = notePop.offsetHeight;
  const left = Math.min(window.innerWidth - w - 12, Math.max(12, e.clientX - w / 2));
  let top = e.clientY + 16;
  if (top + h > window.innerHeight - 12) top = Math.max(12, e.clientY - h - 16);
  notePop.style.left = left + 'px';
  notePop.style.top = top + 'px';
}
notePop.querySelector('.note-close').addEventListener('click', (e) => {
  e.stopPropagation(); notePop.hidden = true;
});

// ===========================================================================
// Controls
// ===========================================================================
document.querySelectorAll('.seg[data-control="offset"]').forEach((group) => {
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    e.stopPropagation();
    group.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === btn));
    state.offset = btn.dataset.value;
    render();
  });
});

function buildModePicker() {
  const ds = DS(), v = V();
  const box = el('mode-picker');
  box.innerHTML = '';
  for (const m of ds.modes) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.value = m.id;
    b.textContent = m.label;
    b.classList.toggle('on', v.mode === m.id);
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      v.mode = m.id;
      buildModePicker();
      updateBasisLabel();
      render();
    });
    box.appendChild(b);
  }
  el('mode-label').textContent = ds.id === 'energy' ? 'Measure' : 'Dollars';
}

function buildEntityPicker() {
  const ds = DS(), v = V();
  const box = el('entity-picker');
  box.innerHTML = '';
  for (const en of ds.entities) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.value = en.id;
    b.textContent = en.short;
    b.title = en.label + (ds.coverage ? ` — data from ${ds.coverage(en.id)[0]}` : '');
    b.classList.toggle('on', v.entity === en.id);
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const prevCov = ds.coverage ? ds.coverage(v.entity) : ds.yearRange;
      const wasFullSpan = v.from <= prevCov[0] && v.to >= prevCov[1];
      v.entity = en.id;
      if (ds.refresh) {
        const cov = ds.refresh(en.id);
        if (wasFullSpan) {
          // not zoomed in, so show everything the new country has
          v.from = cov[0]; v.to = cov[1];
        } else {
          v.from = Math.max(v.from, cov[0]);
          v.to = Math.min(v.to, cov[1]);
          if (v.to - v.from < 4) { v.from = cov[0]; v.to = cov[1]; }
        }
        // a fuel that no longer subdivides here must not stay open
        for (const k of [...v.expanded]) {
          const n = ds.byKey.get(k);
          if (n && n.level === 'fuel' && n.collapsible === false) v.expanded.delete(k);
        }
      }
      buildEntityPicker();
      updateEntityLabel();
      syncRangeInputs();
      render();
    });
    box.appendChild(b);
  }
  el('entity-title').textContent = ds.entityLabel;
}

function updateEntityLabel() {
  const ds = DS(), v = V();
  const en = ds.entities.find((x) => x.id === v.entity);
  el('entity-label').textContent = en ? en.label : '';
  const note = ds.entityNote(v.entity);
  el('entity-note').hidden = !note;
  if (note) el('entity-note').textContent = note;
}

function updateBasisLabel() {
  el('basis-label').textContent = DS().basisText(V().mode);
}

el('show-notes').addEventListener('change', (e) => { state.showNotes = e.target.checked; render(); });
el('show-labels').addEventListener('change', (e) => { state.showLabels = e.target.checked; render(); });
el('collapse-all').addEventListener('click', (e) => { e.stopPropagation(); collapseAll(); });
el('show-all').addEventListener('click', (e) => { e.stopPropagation(); V().hidden.clear(); render(); });

const rFrom = el('range-from'), rTo = el('range-to');
function syncRangeInputs() {
  const ds = DS(), v = V();
  const cov = ds.coverage ? ds.coverage(v.entity) : ds.yearRange;
  const LO = Math.max(ds.yearRange[0], cov[0]), HI = Math.min(ds.yearRange[1], cov[1]);
  rFrom.min = rTo.min = LO;
  rFrom.max = rTo.max = HI;
  v.from = Math.max(LO, Math.min(v.from, HI - 4));
  v.to = Math.min(HI, Math.max(v.to, v.from + 4));
  rFrom.value = v.from; rTo.value = v.to;
  el('range-from-out').textContent = v.from;
  el('range-to-out').textContent = v.to;
}
function onRangeInput() {
  const v = V();
  let a = +rFrom.value, b = +rTo.value;
  if (a > b - 3) { if (document.activeElement === rFrom) a = b - 3; else b = a + 3; }
  v.from = a; v.to = b;
  syncRangeInputs();
  render();
}
rFrom.addEventListener('input', onRangeInput);
rTo.addEventListener('input', onRangeInput);
el('range-reset').addEventListener('click', (e) => {
  e.stopPropagation();
  const ds = DS(), v = V();
  const cov = ds.coverage ? ds.coverage(v.entity) : ds.yearRange;
  v.from = Math.max(ds.yearRange[0], cov[0]);
  v.to = Math.min(ds.yearRange[1], cov[1]);
  syncRangeInputs();
  render();
});

// theme
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  el('theme-toggle').textContent = state.theme === 'dark' ? 'Light' : 'Dark';
  el('theme-toggle').title = `Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`;
}
el('theme-toggle').addEventListener('click', (e) => {
  e.stopPropagation();
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  render();
});

// ---------------------------------------------------------------- tabs
function setTab(id) {
  if (!DATASETS[id]) return;
  state.tab = id;
  state.hoverKey = null; state.hoverCol = null;
  document.documentElement.setAttribute('data-tab', id);
  document.querySelectorAll('.tabbtn').forEach((b) => {
    const on = b.dataset.tab === id;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', String(on));
  });
  const ds = DS(), v = V();
  if (ds.refresh) ds.refresh(v.entity);

  el('doc-title').innerHTML = ds.id === 'energy'
    ? 'Where our<br><span class="hl">electricity comes from</span>'
    : 'Where gaming\'s<br><span class="hl">money went</span>';
  el('doc-deck-lead').textContent = ds.id === 'energy'
    ? 'A century and a quarter of electricity · 1900–2025 · by source'
    : 'Fifty-six years of player spending · 1970–2026 · worldwide';
  el('intro-lead').textContent = ds.id === 'energy'
    ? 'Every kilowatt-hour the world has generated, and what it was burned, split or blown out of.'
    : 'From the arcade boom to home consoles, PC gaming and the phone in your pocket — who actually took the money, and when.';
  el('intro-cta').innerHTML = ds.id === 'energy'
    ? 'Click a source to break it open into specific fuels — <b>coal into lignite, bituminous and anthracite</b> — wherever the statistics report the split. Scroll to zoom the years.'
    : 'Click a band to break it open: <b>segment → company → individual platform</b>. Scroll over the chart to zoom the years.';
  el('detail-card').hidden = true;

  buildModePicker();
  buildEntityPicker();
  updateEntityLabel();
  updateBasisLabel();
  syncRangeInputs();
  render();
}
document.querySelectorAll('.tabbtn').forEach((b) => {
  b.addEventListener('click', (e) => { e.stopPropagation(); setTab(b.dataset.tab); });
});

// ---------------------------------------------------------------- dialogs
const dlg = el('method');
const aiDlg = el('ai-dialog');
el('open-method').addEventListener('click', (e) => { e.stopPropagation(); dlg.showModal(); });
el('method-close').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
const openAi = (e) => { e.stopPropagation(); if (dlg.open) dlg.close(); aiDlg.showModal(); };
el('open-ai').addEventListener('click', openAi);
el('open-ai-2').addEventListener('click', openAi);
el('ai-close').addEventListener('click', () => aiDlg.close());
aiDlg.addEventListener('click', (e) => { if (e.target === aiDlg) aiDlg.close(); });

document.addEventListener('click', (e) => {
  if (!notePop.hidden && !notePop.contains(e.target)) notePop.hidden = true;
  if (e.target.closest('.toolbar, .rail, .crumbs, .rangebar, dialog, .note-pop, .masthead, .entitybar')) return;
  dismissStep();
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (aiDlg.open) { aiDlg.close(); return; }
  if (!notePop.hidden) { notePop.hidden = true; return; }
  dismissStep();
});

// ---------------------------------------------------------------- boot
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(render, 120);
});

applyTheme();
setTab('gaming');

})();
