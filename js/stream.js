(function (global) {
'use strict';
// Streamgraph maths — stacking, ordering and smooth area paths.
// Dependency-free; ports the two d3-shape algorithms this chart needs.

/** Sum of an array. */
const sum = (a) => a.reduce((x, y) => x + y, 0);

/**
 * d3.stackOrderInsideOut — puts the series that peak earliest at the outside and
 * the biggest, latest-peaking ones through the middle. This is what gives a
 * streamgraph its organic, river-like silhouette.
 * @param {number[][]} values  values[i][j] = series i at column j
 * @returns {number[]} indices, bottom-to-top
 */
function orderInsideOut(values) {
  const n = values.length;
  const sums = values.map(sum);
  const peaks = values.map((v) => {
    let best = 0, bi = 0;
    for (let j = 0; j < v.length; j++) if (v[j] > best) { best = v[j]; bi = j; }
    return bi;
  });
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => peaks[a] - peaks[b]);
  let top = 0, bottom = 0;
  const tops = [], bottoms = [];
  for (const i of idx) {
    if (top < bottom) { top += sums[i]; tops.push(i); }
    else { bottom += sums[i]; bottoms.push(i); }
  }
  return bottoms.reverse().concat(tops);
}

/**
 * Stack `values` in the given bottom-to-top `order` using one of three offsets.
 * @returns {Array<Array<[number,number]>>} bounds[i][j] = [y0, y1] for series i, column j
 */
function stack(values, order, offset = 'wiggle') {
  const n = values.length;
  const m = n ? values[0].length : 0;
  const bounds = values.map(() => new Array(m));
  if (!n || !m) return bounds;

  // column baselines
  const base = new Array(m).fill(0);

  if (offset === 'wiggle') {
    // Byron & Wattenberg's minimum-wiggle baseline.
    let y = 0;
    base[0] = 0;
    for (let j = 1; j < m; j++) {
      let s1 = 0, s2 = 0;
      for (let i = 0; i < n; i++) {
        const si = values[order[i]];
        const dv = si[j] - si[j - 1];
        let s3 = dv / 2;
        for (let k = 0; k < i; k++) {
          const sk = values[order[k]];
          s3 += sk[j] - sk[j - 1];
        }
        s1 += si[j];
        s2 += s3 * si[j];
      }
      if (s1) y -= s2 / s1;
      base[j] = y;
    }
    // recentre so the ribbon sits around 0 rather than drifting off-screen
    let lo = Infinity, hi = -Infinity;
    for (let j = 0; j < m; j++) {
      const total = values.reduce((a, v) => a + v[j], 0);
      lo = Math.min(lo, base[j]);
      hi = Math.max(hi, base[j] + total);
    }
    const shift = (lo + hi) / 2;
    for (let j = 0; j < m; j++) base[j] -= shift;
  } else if (offset === 'silhouette') {
    for (let j = 0; j < m; j++) {
      const total = values.reduce((a, v) => a + v[j], 0);
      base[j] = -total / 2;
    }
  } else if (offset === 'expand') {
    for (let j = 0; j < m; j++) base[j] = 0;
  } // 'zero' leaves base at 0

  for (let j = 0; j < m; j++) {
    let total = 0;
    if (offset === 'expand') {
      total = values.reduce((a, v) => a + v[j], 0) || 1;
    }
    let y = base[j];
    for (let i = 0; i < n; i++) {
      const si = order[i];
      const v = offset === 'expand' ? values[si][j] / total : values[si][j];
      bounds[si][j] = [y, y + v];
      y += v;
    }
  }
  return bounds;
}

/**
 * Catmull-Rom through the points, emitted as cubic beziers. `tension` 0 = very
 * smooth, 1 = polyline. Used so the ribbon reads as a flowing shape rather than
 * a bar chart, which matters a lot in quarterly mode.
 */
function splineTo(pts, tension = 0.35) {
  if (pts.length < 2) return '';
  const k = (1 - tension) / 6;
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) * k;
    const c1y = p1[1] + (p2[1] - p0[1]) * k;
    const c2x = p2[0] - (p3[0] - p1[0]) * k;
    const c2y = p2[1] - (p3[1] - p1[1]) * k;
    d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

/**
 * Build the closed area path for one stacked band.
 * @param {Array<[number,number]>} band  [y0,y1] per column
 * @param {(j:number)=>number} x
 * @param {(v:number)=>number} y
 */
function areaPath(band, x, y, smooth = true, tension = 0.35) {
  const m = band.length;
  const top = [], bot = [];
  for (let j = 0; j < m; j++) {
    top.push([x(j), y(band[j][1])]);
    bot.push([x(j), y(band[j][0])]);
  }
  bot.reverse();
  if (!smooth) {
    return `M${top.map((p) => p.join(',')).join('L')}L${bot.map((p) => p.join(',')).join('L')}Z`;
  }
  return `M${top[0][0].toFixed(2)},${top[0][1].toFixed(2)}`
    + splineTo(top, tension)
    + `L${bot[0][0].toFixed(2)},${bot[0][1].toFixed(2)}`
    + splineTo(bot, tension)
    + 'Z';
}

/** Widest column of a band, used to place its inline label. */
function widestColumn(band, from = 0, to = band.length - 1) {
  let best = -1, bi = -1;
  for (let j = from; j <= to; j++) {
    const w = band[j][1] - band[j][0];
    if (w > best) { best = w; bi = j; }
  }
  return { index: bi, height: best };
}

// --- colour helpers ---------------------------------------------------------

function hexToRgb(h) {
  const s = h.replace('#', '');
  const v = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
const toHex = (rgb) => '#' + rgb.map((c) => clamp(c).toString(16).padStart(2, '0')).join('');

/** Mix two hex colours; t=0 gives a, t=1 gives b. */
function mix(a, b, t) {
  const ra = hexToRgb(a), rb = hexToRgb(b);
  return toHex([0, 1, 2].map((i) => ra[i] + (rb[i] - ra[i]) * t));
}

/** Lighten (t>0) or darken (t<0) a hex colour. */
function shade(hex, t) {
  return t >= 0 ? mix(hex, '#ffffff', t) : mix(hex, '#0b0d12', -t);
}

/** Perceived luminance, for picking readable label colours. */
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

  global.Stream = { orderInsideOut, stack, areaPath, widestColumn, mix, shade, luminance };
})(window);
