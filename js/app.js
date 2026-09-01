/* Where Gaming's Money Went — 1970–2026
 * Interactive streamgraph with segment → company → platform drill-down.
 * Data: data/gaming-revenue.js (built by data/build.mjs). Maths: js/stream.js.
 */
(function () {
'use strict';

const D = window.GAMING_DATA;
const S = window.Stream;
const SVGNS = 'http://www.w3.org/2000/svg';

// ---------------------------------------------------------------- lookups
const SEG = new Map(D.segments.map((s) => [s.id, s]));
const PLAT = new Map(D.platforms.map((p) => [p.id, p]));
const CO = new Map(D.companyNodes.map((c) => [c.id, c]));
const REG = new Map(D.regions.map((r) => [r.id, r]));
const Y0 = D.yearRange[0];
const Y1 = D.yearRange[1];

// ---------------------------------------------------------------- tree
// root → segments → companies → platforms
const TREE = D.segments.map((s) => {
  const companies = D.companyNodes
    .filter((c) => c.segment === s.id)
    .map((c) => ({
      key: c.id, label: c.label, level: 'company', segment: s.id, company: c.company,
      children: c.children.map((pid) => {
        const p = PLAT.get(pid);
        return {
          key: pid, label: p.label, level: 'platform', segment: s.id,
          company: c.company, node: p, children: null,
        };
      }),
    }));
  return {
    key: `seg:${s.id}`, label: s.label, level: 'segment',
    segment: s.id, company: null, children: companies,
  };
});

const BYKEY = new Map();
const PARENT = new Map();
(function index(list, parent) {
  for (const n of list) {
    BYKEY.set(n.key, n);
    PARENT.set(n.key, parent);
    if (n.children) index(n.children, n);
  }
})(TREE, null);

// A company band holding a single platform adds a level of nesting for nothing.
for (const seg of TREE) for (const c of seg.children) c.collapsible = c.children.length > 1;

/** Is `key` the node `ancestorKey`, or anywhere beneath it? */
function isWithin(key, ancestorKey) {
  let n = BYKEY.get(key);
  while (n) {
    if (n.key === ancestorKey) return true;
    n = PARENT.get(n.key);
  }
  return false;
}

// ---------------------------------------------------------------- state
const state = {
  offset: 'wiggle',
  region: 'world',
  // Real dollars by default: in nominal terms the 1982 arcade peak is ~4% of the 2026
  // total and disappears, so the whole 56-year span is unreadable on one linear scale.
  dollars: 'real',
  theme: 'dark',
  showNotes: true,
  showLabels: true,
  expanded: new Set(),
  hidden: new Set(),      // segment ids excluded from the chart entirely
  selected: null,
  hoverKey: null,
  hoverCol: null,
  from: Y0,
  to: Y1,
};

// ---------------------------------------------------------------- helpers
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

/**
 * Colours come from the local data files, but they are interpolated into style
 * attributes inside innerHTML. Validating the shape means a malformed value can
 * never break out of the attribute, whatever the data file says.
 */
function safeColor(c) {
  return /^#[0-9a-fA-F]{3,8}$/.test(String(c)) ? String(c) : '#8b8b8b';
}

function fmtMoney(m) {
  if (m == null || !isFinite(m)) return '—';
  if (m >= 1000) return '$' + (m / 1000).toFixed(m >= 10000 ? 0 : 1) + 'B';
  if (m >= 1) return '$' + m.toFixed(m >= 100 ? 0 : 1) + 'M';
  if (m > 0) return '<$1M';
  return '—';
}
function fmtMoneyLong(m) {
  if (m >= 1000) return '$' + (m / 1000).toFixed(2) + ' billion';
  return '$' + Math.round(m) + ' million';
}
function fmtPct(frac) {
  if (!isFinite(frac)) return '—';
  return (frac * 100).toFixed(frac < 0.001 && frac > 0 ? 2 : 1) + '%';
}

/**
 * Format a raw dollar value for display, honouring the current shape.
 * In Share mode the chart is normalised, so readouts must be too — the previous
 * version formatted raw $ millions as a percentage, which is why Mobile read as
 * "10,346,660%".
 */
function fmtValue(v, colIndex) {
  if (state.offset !== 'expand') return fmtMoney(v);
  const total = lastData && lastData.totals ? lastData.totals[colIndex] : 0;
  return total > 0 ? fmtPct(v / total) : '—';
}

// ---------------------------------------------------------------- columns
// Annual only. A quarterly view existed in an earlier version; it was removed because
// no public quarterly series exists for this industry before roughly 2010, so every
// quarterly value was a fixed seasonality assumption repeated 57 times — it produced a
// regular sawtooth that looked like measurement and was not.
function columns() {
  const out = [];
  for (let y = state.from; y <= state.to; y++) {
    out.push({ idx: y - Y0, year: y, label: String(y), t: y });
  }
  return out;
}

function seriesFor(key, cols) {
  const table = state.region === 'world' ? D.annual : (D.regionAnnual[state.region] || D.annual);
  const src = table[key];
  if (!src) return cols.map(() => 0);
  const real = state.dollars === 'real';
  return cols.map((c) => {
    const v = src[c.idx] || 0;
    return real ? v * (D.deflator[c.year] || 1) : v;
  });
}

// ---------------------------------------------------------------- visible bands
function visibleBands() {
  const out = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.level === 'segment' && state.hidden.has(n.segment)) continue;
      const canExpand = n.children && n.children.length > 0 && n.collapsible !== false;
      if (canExpand && state.expanded.has(n.key)) walk(n.children);
      else out.push(n);
    }
  };
  walk(TREE);
  return out;
}

// ---------------------------------------------------------------- colours
const platIndexInCompany = new Map();
for (const seg of TREE) {
  for (const c of seg.children) {
    c.children.forEach((p, i) => platIndexInCompany.set(p.key, { i, n: c.children.length }));
  }
}

function bandColor(n) {
  const segColor = SEG.get(n.segment).color;
  if (n.level === 'segment') return segColor;
  const coColor = (D.companies[n.company] && D.companies[n.company].color) || '#8b8b8b';
  const base = S.mix(segColor, coColor, 0.5);
  if (n.level === 'company') return base;
  const pos = platIndexInCompany.get(n.key) || { i: 0, n: 1 };
  const t = pos.n > 1 ? pos.i / (pos.n - 1) : 0.5;
  return S.shade(base, 0.22 - 0.44 * t);
}

// ---------------------------------------------------------------- ordering
const fullCols = (() => {
  const a = [];
  for (let y = Y0; y <= Y1; y++) a.push({ idx: y - Y0, year: y });
  return a;
})();

// Segment order is computed once against the whole record, so the silhouette stays
// stable as you drill in and out.
const SEG_ORDER = (() => {
  const vals = D.segments.map((s) => fullCols.map((c) => D.annual[`seg:${s.id}`][c.idx] || 0));
  return S.orderInsideOut(vals).map((i) => D.segments[i].id);
})();

/**
 * Order the drawn bands bottom-to-top, hierarchically: segments keep their stable
 * order, companies are ordered inside-out within their segment, and a company's
 * platforms are always drawn contiguously. Without the company grouping step,
 * PlayStation 4 and PlayStation 5 end up separated by a Microsoft band.
 */
function orderBands(bands, cols) {
  const bySeg = new Map();
  for (const b of bands) {
    if (!bySeg.has(b.segment)) bySeg.set(b.segment, []);
    bySeg.get(b.segment).push(b);
  }

  const result = [];
  for (const segId of SEG_ORDER) {
    const group = bySeg.get(segId);
    if (!group || !group.length) continue;
    if (group.length === 1) { result.push(group[0]); continue; }

    // bucket by company so siblings stay adjacent
    const buckets = new Map();
    for (const b of group) {
      const k = b.level === 'segment' ? '__segment__' : b.company;
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(b);
    }

    const keys = [...buckets.keys()];
    const memberSeries = new Map();
    const bucketTotals = keys.map((k) => {
      const totals = new Array(cols.length).fill(0);
      for (const m of buckets.get(k)) {
        const s = seriesFor(m.key, cols);
        memberSeries.set(m.key, s);
        for (let j = 0; j < cols.length; j++) totals[j] += s[j];
      }
      return totals;
    });

    for (const ci of S.orderInsideOut(bucketTotals)) {
      const members = buckets.get(keys[ci]);
      if (members.length === 1) { result.push(members[0]); continue; }
      const ord = S.orderInsideOut(members.map((m) => memberSeries.get(m.key)));
      for (const i of ord) result.push(members[i]);
    }
  }
  return result;
}

// ---------------------------------------------------------------- geometry
let W = 1200, H = 640;
const M = { top: 26, right: 26, bottom: 40, left: 62 };

function layout() {
  const rect = stage.getBoundingClientRect();
  W = Math.max(560, Math.round(rect.width));
  H = Math.round(Math.min(980, Math.max(620, W * 0.60)));
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
}

// ---------------------------------------------------------------- render
let lastRender = null;
let lastData = null;

function render() {
  layout();
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const cols = columns();
  const bands = orderBands(visibleBands(), cols);
  const values = bands.map((b) => seriesFor(b.key, cols));
  const totals = cols.map((_, j) => values.reduce((a, s) => a + s[j], 0));
  lastData = { cols, bands, values, totals };

  // In Share mode, columns where nothing existed yet (1970) have no meaningful
  // composition. Carrying the nearest real distribution keeps the ribbon a solid
  // 100% band instead of spiking from zero through the spline.
  const stackValues = state.offset === 'expand' ? backfillEmptyColumns(values, totals) : values;

  const order = bands.map((_, i) => i); // already bottom-to-top
  const bounds = S.stack(stackValues, order, state.offset);

  const noteRoom = state.showNotes && cols.length > 6
    ? Math.round(Math.max(118, Math.min(215, H * 0.235)))
    : 8;
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
  const y = (v) => plotBottom - ((v - lo) / (hi - lo)) * (plotBottom - plotTop);

  const gGrid = make('g', { class: 'grid' }, svg);
  const gBands = make('g', { class: 'bands' }, svg);
  const gLabels = make('g', { class: 'labels' }, svg);
  const gNotes = make('g', { class: 'notes' }, svg);
  const gAxis = make('g', { class: 'axis' }, svg);

  drawXAxis(gAxis, gGrid, cols, x, plotTop, plotBottom, H);
  drawYAxis(gAxis, gGrid, y, lo, hi, plotLeft, plotRight);

  // A stiffer spline in Share mode: the smoothing that flatters the stream is
  // exactly what overshoots a 0-to-100% step.
  // stream is exactly what makes a 0→100% step overshoot.
  const tension = state.offset === 'expand' ? 0.75 : 0.35;

  const paths = [];
  bands.forEach((b, i) => {
    const d = S.areaPath(bounds[i], x, y, true, tension);
    const p = make('path', {
      d, fill: bandColor(b), class: 'band', 'data-key': b.key,
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
  let firstReal = totals.findIndex((t) => t > 0);
  if (firstReal <= 0) return values;
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
  const span = state.to - state.from;
  const step = span > 44 ? 10 : span > 22 ? 5 : span > 10 ? 2 : 1;
  const baseY = height - M.bottom + 16;
  make('line', { x1: x(0), y1: height - M.bottom, x2: x(cols.length - 1), y2: height - M.bottom }, g);

  const seen = new Set();
  cols.forEach((c, j) => {
    if (c.year % step !== 0 || seen.has(c.year)) return;
    seen.add(c.year);
    const px = x(j);
    make('line', { x1: px, y1: plotTop, x2: px, y2: plotBottom, class: 'gridline' }, gGrid);
    const t = make('text', { x: px, y: baseY, 'text-anchor': 'middle' }, g);
    t.textContent = c.year;
  });

  for (const era of D.eras) {
    if (era.from <= state.from || era.from >= state.to) continue;
    const j = cols.findIndex((c) => c.year === era.from);
    if (j < 0) continue;
    make('line', { x1: x(j), y1: M.top, x2: x(j), y2: height - M.bottom, class: 'era-rule' }, gGrid);
    const t = make('text', { x: x(j) + 5, y: M.top + 10, class: 'era-label' }, g);
    t.textContent = era.label;
  }
}

function drawYAxis(g, gGrid, y, lo, hi, left, right) {
  const title = make('text', { x: 6, y: 14, class: 'axis-title' }, g);
  title.textContent = state.offset === 'expand' ? 'Share of total' : 'Revenue';

  if (state.offset === 'expand') {
    for (const v of [0, 0.25, 0.5, 0.75, 1]) {
      make('line', { x1: left, y1: y(v), x2: right, y2: y(v), class: 'gridline' }, gGrid);
      const t = make('text', { x: left - 8, y: y(v) + 4, 'text-anchor': 'end' }, g);
      t.textContent = (v * 100) + '%';
    }
    return;
  }

  if (state.offset === 'zero') {
    for (const v of niceTicks(0, hi, 6)) {
      make('line', { x1: left, y1: y(v), x2: right, y2: y(v), class: 'gridline' }, gGrid);
      const t = make('text', { x: left - 8, y: y(v) + 4, 'text-anchor': 'end' }, g);
      t.textContent = v === 0 ? '0' : '$' + (v / 1000).toFixed(v < 1000 ? 1 : 0) + 'B';
    }
    return;
  }

  // Stream / Centred: absolute vertical position is meaningless, so show a scale
  // bar for thickness rather than a misleading axis.
  const unit = niceTicks(0, (hi - lo) / 3, 2).filter((v) => v > 0)[0] || (hi - lo) / 4;
  const mid = lo + (hi - lo) * 0.5;
  const yTop = y(mid + unit / 2);
  const yBot = y(mid - unit / 2);
  const bx = left - 26;
  const bar = { stroke: 'currentColor', 'stroke-width': 1.4, opacity: 0.45 };
  make('line', Object.assign({ x1: bx, y1: yTop, x2: bx, y2: yBot }, bar), g);
  make('line', Object.assign({ x1: bx - 4, y1: yTop, x2: bx + 4, y2: yTop }, bar), g);
  make('line', Object.assign({ x1: bx - 4, y1: yBot, x2: bx + 4, y2: yBot }, bar), g);
  const cy = (yTop + yBot) / 2;
  const lab = make('text', {
    x: bx - 8, y: cy, 'text-anchor': 'middle', transform: `rotate(-90 ${bx - 8} ${cy})`,
  }, g);
  lab.textContent = '$' + (unit / 1000).toFixed(unit < 1000 ? 1 : 0) + 'B thickness';
}

function niceTicks(min, max, count) {
  const span = max - min || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const stepN = norm >= 7.5 ? 10 : norm >= 3.5 ? 5 : norm >= 1.5 ? 2 : 1;
  const step = stepN * mag;
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}

// ---------------------------------------------------------------- band labels
function drawBandLabels(g, bands, bounds, values, cols, x, y) {
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
      const box = {
        x0: cx - w / 2 - 6, x1: cx + w / 2 + 6,
        y0: cy - size, y1: cy + size + (showSub ? 12 : 0),
      };
      if (placed.some((p) => !(box.x1 < p.x0 || box.x0 > p.x1 || box.y1 < p.y0 || box.y0 > p.y1))) continue;
      placed.push(box);
      paint(b, i, bi, cx, cy, size, showSub);
      return;
    }
  });

  function paint(b, i, bi, cx, cy, size, showSub) {
    const fill = bandColor(b);
    const light = S.luminance(fill) > 0.45;
    const ink = light ? 'rgba(10,12,16,.94)' : 'rgba(255,255,255,.97)';
    const halo = light ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.3)';

    const t = make('text', {
      x: cx, y: cy + size * 0.34, 'text-anchor': 'middle', class: 'band-label',
      fill: ink, stroke: halo, 'stroke-width': 2.4, 'font-size': size,
    }, g);
    t.textContent = b.label;

    if (showSub) {
      const s = make('text', {
        x: cx, y: cy + size * 0.34 + size * 0.95, 'text-anchor': 'middle', class: 'band-sub',
        fill: ink, stroke: halo, 'stroke-width': 2,
      }, g);
      s.textContent = fmtValue(values[i][bi], bi) + '  ·  ' + cols[bi].label;
    }
  }
}

// ---------------------------------------------------------------- story notes
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
  const span = state.to - state.from;
  const maxTier = span <= 20 ? 3 : W > 1500 ? 3 : W > 1080 ? 2 : 1;
  const boxW = Math.max(110, Math.min(178, (x(cols.length - 1) - x(0)) / 9));
  const titleFont = '700 10.5px "Inter", system-ui, sans-serif';
  const bodyFont = '400 9.8px "Inter", system-ui, sans-serif';
  const lineH = 11.5;

  const segRows = new Map();
  bands.forEach((b, i) => {
    if (!segRows.has(b.segment)) segRows.set(b.segment, []);
    segRows.get(b.segment).push(i);
  });

  const items = [];
  for (const ev of D.events) {
    if (ev.tier > maxTier) continue;
    if (ev.year < state.from || ev.year > state.to) continue;
    if (state.hidden.has(ev.segment)) continue;

    const j = cols.findIndex((c) => c.year === ev.year);
    if (j < 0) continue;

    const idxs = segRows.get(ev.segment) || [];
    let anchorY;
    if (idxs.length) {
      const a = Math.min.apply(null, idxs.map((i) => bounds[i][j][0]));
      const b = Math.max.apply(null, idxs.map((i) => bounds[i][j][1]));
      anchorY = y((a + b) / 2);
    } else anchorY = (plotTop + plotBottom) / 2;

    const bodyMax = span <= 24 ? 5 : 3;
    items.push({
      ev, j, px: x(j), anchorY, side: ev.side,
      titleLines: wrapText(ev.title, titleFont, boxW, 2),
      bodyLines: wrapText(ev.text, bodyFont, boxW, bodyMax),
    });
  }

  const laneSlot = 2 * 12 + (span <= 24 ? 5 : 3) * lineH + 12;
  const maxLane = {
    top: Math.max(0, Math.floor((plotTop - topEdge - 8) / laneSlot) - 1),
    bottom: Math.max(0, Math.floor((bottomEdge - plotBottom - 8) / laneSlot) - 1),
  };

  // Place the most important notes first, so anything dropped for lack of room is
  // a footnote rather than the crash of 1983.
  items.sort((a, b) => (a.ev.tier - b.ev.tier) || (a.px - b.px));

  const lanes = { top: [], bottom: [] };
  for (const it of items) {
    it.h = it.titleLines.length * 12 + it.bodyLines.length * lineH + 12;
    const arr = lanes[it.side];
    it.lane = null;
    for (let lane = 0; lane <= maxLane[it.side]; lane++) {
      const occupied = arr[lane] || (arr[lane] = []);
      const clash = occupied.some((o) => it.px - boxW / 2 < o.x1 + 10 && it.px + boxW / 2 > o.x0 - 10);
      if (!clash) {
        occupied.push({ x0: it.px - boxW / 2, x1: it.px + boxW / 2, h: it.h });
        it.lane = lane;
        break;
      }
    }
  }

  const laneHeight = (side) => lanes[side].map((occ) =>
    Math.max.apply(null, occ.map((o) => o.h).concat([24])));
  const topH = laneHeight('top');
  const botH = laneHeight('bottom');

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
    const yr = make('text', {
      x: tx, y: cy, 'text-anchor': anchor, class: 'note-year',
      fill: SEG.get(it.ev.segment).color,
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
/**
 * Dim everything that isn't the focused node *or one of its descendants*. When you
 * open Console, the Console band itself no longer exists — Sony, Nintendo and the
 * rest have replaced it — so matching on the exact key greyed out the entire chart.
 */
function applyHighlight() {
  if (!lastRender) return;
  const key = state.hoverKey || state.selected;
  for (const p of lastRender.paths) {
    const related = !key || isWithin(p.__band.key, key);
    p.classList.toggle('dim', !!key && !related);
    p.classList.toggle('hot', !!key && p.__band.key === key);
  }
}

// ---------------------------------------------------------------- interaction
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
  state.hoverKey = null;
  state.hoverCol = null;
  applyHighlight();
  hideTooltip();
  renderRanks();
});

svg.addEventListener('click', (e) => {
  const noteEl = e.target.closest && e.target.closest('.note-g');
  if (noteEl && noteEl.__event) { e.stopPropagation(); openNote(noteEl.__event, e); return; }
  const bandEl = e.target.closest && e.target.closest('.band');
  if (!bandEl) return;               // empty stage area falls through to collapse-all
  e.stopPropagation();
  activate(bandEl.getAttribute('data-key'));
});

// Scroll to zoom the time frame, anchored on the year under the cursor.
svg.addEventListener('wheel', (e) => {
  if (!lastRender) return;
  e.preventDefault();
  const { plotLeft, plotRight } = lastRender;
  const pt = svgPoint(e);
  const frac = Math.max(0, Math.min(1, (pt.x - plotLeft) / Math.max(1, plotRight - plotLeft)));
  const anchor = state.from + frac * (state.to - state.from);

  const span = state.to - state.from;
  const factor = e.deltaY > 0 ? 1.18 : 1 / 1.18;   // down = zoom out
  const MIN_SPAN = 4;
  let next = Math.round(Math.max(MIN_SPAN, Math.min(Y1 - Y0, span * factor)));

  let from = Math.round(anchor - frac * next);
  let to = from + next;
  if (from < Y0) { from = Y0; to = from + next; }
  if (to > Y1) { to = Y1; from = to - next; }
  if (from < Y0) from = Y0;

  if (from === state.from && to === state.to) return;
  rFrom.value = from; rTo.value = to;
  el('range-from-out').textContent = from;
  el('range-to-out').textContent = to;
  state.from = from; state.to = to;
  hideTooltip();
  render();
}, { passive: false });

function svgPoint(e) {
  const r = svg.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

function activate(key) {
  const n = BYKEY.get(key);
  if (!n) return;
  state.selected = key;
  if (n.children && n.children.length && n.collapsible !== false) {
    if (state.expanded.has(key)) state.expanded.delete(key);
    else state.expanded.add(key);
  }
  render();
  showDetail(n);
}

/**
 * Clicking away is deliberately two-stage. The first click only clears the
 * selection, so the highlight lifts and every band — including the sub-bands you
 * just opened — returns to full colour. Only a second click collapses the
 * drill-down. Without this you could never see all the minor sub-categories at
 * full opacity, because opening one always selected it.
 * @returns {boolean} true if anything was dismissed
 */
function dismissStep() {
  if (state.selected) {          // stage 1: deselect, keep everything open
    state.selected = null;
    el('detail-card').hidden = true;
    applyHighlight();
    renderLegend();
    return true;
  }
  if (state.expanded.size) {     // stage 2: collapse
    state.expanded.clear();
    render();
    return true;
  }
  return false;
}

function collapseAll() {
  if (!state.expanded.size && !state.selected) return;
  state.expanded.clear();
  state.selected = null;
  el('detail-card').hidden = true;
  render();
}

// ---------------------------------------------------------------- tooltip
function showTooltip(key, j, e) {
  const { cols, bands, values } = lastRender;
  const i = bands.findIndex((b) => b.key === key);
  if (i < 0) return hideTooltip();
  const b = bands[i];
  const v = values[i][j];
  const total = lastData.totals[j];
  const rank = values.map((s, k) => ({ k, v: s[j] }))
    .sort((a, z) => z.v - a.v).findIndex((r) => r.k === i) + 1;
  const c = cols[j];
  const canExpand = b.children && b.children.length && b.collapsible !== false;

  const parentLabel = b.level === 'platform'
    ? `${SEG.get(b.segment).label} › ${(D.companies[b.company] || {}).label || b.company}`
    : b.level === 'company' ? SEG.get(b.segment).label : null;

  const share = total > 0 ? fmtPct(v / total) : '—';
  const headline = state.offset === 'expand' ? share : fmtMoney(v);
  const secondary = state.offset === 'expand' ? fmtMoney(v) + ' of spending' : share + ' of all spending';

  tooltip.innerHTML =
    `<div class="tt-head">
      <span class="tt-sw" style="background:${safeColor(bandColor(b))}"></span>
      <span class="tt-name">${escapeHtml(b.label)}</span>
      <span class="tt-when">${escapeHtml(c.label)}</span>
    </div>
    <div class="tt-val">${headline}</div>
    <div class="tt-meta">${secondary} · #${rank} of ${bands.length}${parentLabel ? ' · ' + escapeHtml(parentLabel) : ''}</div>
    ${canExpand ? `<div class="tt-hint">Click to ${state.expanded.has(b.key) ? 'collapse' : 'break out ' + b.children.length + ' ' + (b.level === 'segment' ? 'companies' : 'platforms')}</div>` : ''}`;

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
  const card = el('detail-card');
  card.hidden = false;
  el('detail-title').textContent = n.label;

  const p = n.level === 'platform' ? n.node : null;
  const cols = columns();
  const series = seriesFor(n.key, cols);
  const total = series.reduce((a, b) => a + b, 0);
  let peakV = -1, peakJ = 0;
  series.forEach((v, j) => { if (v > peakV) { peakV = v; peakJ = j; } });

  const facts = [];
  if (n.level === 'segment') facts.push(['Level', 'Segment']);
  if (n.level === 'company') facts.push(['Level', `Company · ${SEG.get(n.segment).label}`]);
  if (n.level === 'platform') facts.push(['Level', `Platform · ${SEG.get(n.segment).label}`]);
  if (p && p.launch) facts.push(['Launched', `${p.launch.year}${p.launch.quarter ? ' Q' + p.launch.quarter : ''}`]);
  if (p && p.launchPrice) facts.push(['Launch price', '$' + p.launchPrice]);
  if (p && p.lifetimeUnits) facts.push(['Hardware', p.lifetimeUnits.toFixed(1) + 'M units']);
  if (p && p.lifetimeSoftwareUnits) facts.push(['Software', Math.round(p.lifetimeSoftwareUnits) + 'M copies']);
  facts.push([`Total ${state.from}–${state.to}`, fmtMoneyLong(total)]);
  facts.push(['Peak', `${cols[peakJ].label} · ${fmtMoney(peakV)}`]);

  const note = (p && p.note)
    || (n.level === 'segment' ? (SEG.get(n.segment) || {}).note : null)
    || (n.level === 'company' ? (CO.get(n.key) || {}).note || companyBlurb(n) : null);
  const titles = p && p.titles;

  el('detail-body').innerHTML =
    `<dl class="facts">${facts.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join('')}</dl>
     ${note ? `<p class="note">${escapeHtml(note)}</p>` : ''}
     ${titles ? `<ul class="titles">${titles.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : ''}`;
}


function companyBlurb(n) {
  const kids = n.children || [];
  const named = kids.map((k) => k.label).slice(0, 6).join(', ');
  return `${kids.length} platform${kids.length === 1 ? '' : 's'} in ${SEG.get(n.segment).label}: ${named}${kids.length > 6 ? ', and more' : ''}.`;
}

el('detail-close').addEventListener('click', () => {
  el('detail-card').hidden = true;
  state.selected = null;
  applyHighlight();
});

// ---------------------------------------------------------------- legend
const EYE_ON = '<svg class="eye" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.2c-3 0-5.4 2-6.4 4.8 1 2.8 3.4 4.8 6.4 4.8s5.4-2 6.4-4.8C13.4 5.2 11 3.2 8 3.2zm0 8a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm0-1.6a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z" fill="currentColor"/></svg>';
const EYE_OFF = '<svg class="eye" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.3 2.3 1.2 3.4l2.1 2.1A8.6 8.6 0 0 0 1.6 8c1 2.8 3.4 4.8 6.4 4.8 1.2 0 2.3-.3 3.3-.9l2 2 1.1-1.1L2.3 2.3zm5.7 8.9a3.2 3.2 0 0 1-2.9-4.6l1.3 1.3a1.6 1.6 0 0 0 1.9 1.9l1.3 1.3c-.5.1-1 .1-1.6.1zM8 3.2c3 0 5.4 2 6.4 4.8-.4 1-1 1.9-1.7 2.6l-2.3-2.3A3.2 3.2 0 0 0 6.5 4.6L5.2 3.3c.9-.1 1.8-.1 2.8-.1z" fill="currentColor"/></svg>';

function renderLegend() {
  const root = el('legend');
  const cols = columns();
  const lastJ = cols.length - 1;
  root.innerHTML = '';

  const build = (nodes, parentEl) => {
    for (const n of nodes) {
      const isSegment = n.level === 'segment';
      const isHidden = isSegment && state.hidden.has(n.segment);
      const li = document.createElement('li');
      if (isHidden) li.className = 'is-hidden';

      const canExpand = n.children && n.children.length && n.collapsible !== false;
      const isOpen = state.expanded.has(n.key);
      const v = isHidden ? null : seriesFor(n.key, cols)[lastJ] || 0;

      const row = document.createElement('div');
      row.className = 'row-wrap';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'row' + (state.selected === n.key ? ' active' : '');
      if (canExpand) btn.setAttribute('aria-expanded', String(isOpen));
      btn.innerHTML =
        `${canExpand
          ? '<svg class="caret" viewBox="0 0 8 8" aria-hidden="true"><path d="M2 1l4 3-4 3z" fill="currentColor"/></svg>'
          : '<span class="caret"></span>'}
         <span class="swatch" style="background:${safeColor(bandColor(n))}"></span>
         <span class="name">${escapeHtml(n.label)}</span>
         <span class="val">${isHidden ? 'hidden' : fmtValue(v, lastJ)}</span>`;
      if (!isHidden) {
        btn.addEventListener('click', (e) => { e.stopPropagation(); activate(n.key); });
        btn.addEventListener('mouseenter', () => { state.hoverKey = n.key; applyHighlight(); });
        btn.addEventListener('mouseleave', () => { state.hoverKey = null; applyHighlight(); });
      } else {
        btn.disabled = true;
      }
      row.appendChild(btn);

      if (isSegment) {
        const eye = document.createElement('button');
        eye.type = 'button';
        eye.className = 'eyebtn';
        eye.innerHTML = isHidden ? EYE_OFF : EYE_ON;
        eye.title = isHidden ? `Show ${n.label} again` : `Hide ${n.label} from the chart entirely`;
        eye.setAttribute('aria-label', eye.title);
        eye.setAttribute('aria-pressed', String(isHidden));
        eye.addEventListener('click', (e) => {
          e.stopPropagation();
          if (state.hidden.has(n.segment)) state.hidden.delete(n.segment);
          else {
            state.hidden.add(n.segment);
            state.expanded.delete(n.key);
            for (const c of n.children) state.expanded.delete(c.key);
            if (state.selected && isWithin(state.selected, n.key)) {
              state.selected = null;
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
  build(TREE, root);

  const anyHidden = state.hidden.size > 0;
  const showAll = el('show-all');
  showAll.hidden = !anyHidden;
  showAll.textContent = `Show all (${state.hidden.size} hidden)`;
}

// ---------------------------------------------------------------- ranks
function renderRanks() {
  if (!lastData) return;
  const { cols, bands, values, totals } = lastData;
  const j = state.hoverCol != null && state.hoverCol < cols.length ? state.hoverCol : cols.length - 1;
  const rows = bands.map((b, i) => ({ b, v: values[i][j] }))
    .sort((a, z) => z.v - a.v)
    .slice(0, 8);
  el('rank-period').textContent = cols[j] ? cols[j].label : '';
  el('ranklist').innerHTML = rows.map((r) =>
    `<li><span class="rk-sw" style="background:${safeColor(bandColor(r.b))}"></span><b>${escapeHtml(r.b.label)}</b> <span class="v">${
      state.offset === 'expand'
        ? (totals[j] > 0 ? fmtPct(r.v / totals[j]) : '—')
        : fmtMoney(r.v)
    }</span></li>`).join('');
}

// ---------------------------------------------------------------- crumbs
function renderCrumbs() {
  const box = el('crumbs');
  const open = [...state.expanded].map((k) => BYKEY.get(k)).filter(Boolean);
  box.innerHTML = '';
  if (!open.length) {
    const s = document.createElement('span');
    s.textContent = state.hidden.size
      ? 'Click a band to break it into companies. Scroll over the chart to zoom the years.'
      : 'Showing seven platform segments — click a band to break it into companies, or scroll to zoom the years.';
    box.appendChild(s);
    return;
  }
  open.sort((a, b) => (a.level === 'segment' ? 0 : 1) - (b.level === 'segment' ? 0 : 1));
  const lead = document.createElement('span');
  lead.textContent = 'Opened:';
  box.appendChild(lead);
  for (const n of open) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = `<span class="dot" style="background:${safeColor(bandColor(n))}"></span>${escapeHtml(n.label)}<span class="x">×</span>`;
    btn.title = 'Collapse ' + n.label;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.expanded.delete(n.key);
      if (n.level === 'segment') {
        for (const c of n.children) state.expanded.delete(c.key);
      }
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
  e.stopPropagation();
  notePop.hidden = true;
});

// ---------------------------------------------------------------- controls
document.querySelectorAll('.seg').forEach((group) => {
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    e.stopPropagation();
    group.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === btn));
    state[group.dataset.control] = btn.dataset.value;
    updateBasisLabel();
    render();
  });
});

el('show-notes').addEventListener('change', (e) => { state.showNotes = e.target.checked; render(); });
el('show-labels').addEventListener('change', (e) => { state.showLabels = e.target.checked; render(); });
el('collapse-all').addEventListener('click', (e) => { e.stopPropagation(); collapseAll(); });
el('show-all').addEventListener('click', (e) => {
  e.stopPropagation();
  state.hidden.clear();
  render();
});

const rFrom = el('range-from'), rTo = el('range-to');
function syncRange() {
  let a = +rFrom.value, b = +rTo.value;
  if (a > b - 3) { if (document.activeElement === rFrom) a = b - 3; else b = a + 3; }
  a = Math.max(Y0, a); b = Math.min(Y1, b);
  rFrom.value = a; rTo.value = b;
  el('range-from-out').textContent = a;
  el('range-to-out').textContent = b;
  state.from = a; state.to = b;
  render();
}
rFrom.addEventListener('input', syncRange);
rTo.addEventListener('input', syncRange);
el('range-reset').addEventListener('click', (e) => {
  e.stopPropagation();
  rFrom.value = Y0; rTo.value = Y1; syncRange();
});

function updateRegionLabel() {
  const r = state.region === 'world' ? null : REG.get(state.region);
  el('region-label').textContent = r ? r.label : 'Worldwide';
  el('region-note').hidden = !r;
  if (r) el('region-note').textContent = r.note || '';
  document.querySelectorAll('#region-picker button').forEach((b) => {
    b.classList.toggle('on', b.dataset.value === state.region);
  });
}

function updateBasisLabel() {
  el('basis-label').textContent = state.dollars === 'real'
    ? `inflation-adjusted to ${D.meta.cpiBaseYear} US dollars`
    : 'nominal US dollars';
}

function buildRegionPicker() {
  const box = el('region-picker');
  const mk = (id, label, title) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.value = id;
    b.textContent = label;
    b.title = title;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      state.region = id;
      updateRegionLabel();
      render();
    });
    box.appendChild(b);
  };
  mk('world', 'Worldwide', 'Every region combined');
  for (const r of D.regions) mk(r.id, r.short, r.label);
}

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

// Clicking anywhere that isn't a control, a band or a popup collapses the drill-down.
document.addEventListener('click', (e) => {
  if (!notePop.hidden && !notePop.contains(e.target)) notePop.hidden = true;
  if (e.target.closest('.toolbar, .rail, .crumbs, .rangebar, dialog, .note-pop, .masthead')) return;
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

buildRegionPicker();
applyTheme();
updateBasisLabel();
updateRegionLabel();
render();

})();
