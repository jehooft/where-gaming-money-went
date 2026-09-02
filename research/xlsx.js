// Minimal XLSX reader: enough to pull a worksheet out as a grid of strings/numbers.
// No dependencies — an .xlsx is a ZIP of XML, and we only need stored/deflated entries.
//
//   const { sheetNames, readSheet } = require('./xlsx.js');
//   node research/xlsx.js file.xlsx            → list sheets
//   node research/xlsx.js file.xlsx 3          → dump sheet 3 as TSV
const fs = require('fs');
const zlib = require('zlib');

function unzip(buf) {
  const files = {};
  let i = 0;
  const SIG = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  while ((i = buf.indexOf(SIG, i)) >= 0) {
    const method = buf.readUInt16LE(i + 8);
    let csize = buf.readUInt32LE(i + 18);
    let usize = buf.readUInt32LE(i + 22);
    const nlen = buf.readUInt16LE(i + 26);
    const elen = buf.readUInt16LE(i + 28);
    const name = buf.slice(i + 30, i + 30 + nlen).toString('utf8');
    const dataStart = i + 30 + nlen + elen;

    if (csize === 0 && usize === 0) {
      // sizes live in a trailing data descriptor; find the next local header instead
      const next = buf.indexOf(SIG, dataStart);
      const cdir = buf.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), dataStart);
      let end = next >= 0 ? next : (cdir >= 0 ? cdir : buf.length);
      // strip the 12/16-byte data descriptor
      csize = Math.max(0, end - dataStart - 16);
    }

    const raw = buf.slice(dataStart, dataStart + csize);
    try {
      files[name] = method === 0 ? raw : zlib.inflateRawSync(raw);
    } catch { /* skip entries we cannot inflate */ }
    i = dataStart + csize;
  }
  return files;
}

function decodeXmlEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(+d));
}

function sharedStrings(files) {
  const xml = files['xl/sharedStrings.xml'];
  if (!xml) return [];
  const s = xml.toString('utf8');
  const out = [];
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = siRe.exec(s))) {
    // concatenate every <t> inside the <si> (rich text runs)
    const parts = [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]);
    out.push(decodeXmlEntities(parts.join('')));
  }
  return out;
}

function colToIndex(ref) {
  const letters = ref.match(/^[A-Z]+/)[0];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** @returns {Array<Array<string|number|null>>} rows of cells */
function readSheet(files, sheetPath, strings) {
  const xml = files[sheetPath];
  if (!xml) throw new Error('no such sheet: ' + sheetPath);
  const s = xml.toString('utf8');
  const rows = [];
  const rowRe = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while ((rm = rowRe.exec(s))) {
    const rowIdx = +rm[1] - 1;
    const cells = [];
    const cellRe = /<c\s+([^>]*)>([\s\S]*?)<\/c>|<c\s+([^>]*)\/>/g;
    let cm;
    while ((cm = cellRe.exec(rm[2]))) {
      const attrs = cm[1] || cm[3] || '';
      const body = cm[2] || '';
      const refM = attrs.match(/r="([A-Z]+\d+)"/);
      if (!refM) continue;
      const ci = colToIndex(refM[1]);
      const type = (attrs.match(/t="([^"]+)"/) || [])[1];
      const vM = body.match(/<v>([\s\S]*?)<\/v>/);
      const isM = body.match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/);
      let val = null;
      if (type === 's' && vM) val = strings[+vM[1]] ?? null;
      else if (type === 'inlineStr' && isM) val = decodeXmlEntities(isM[1]);
      else if (vM) { const n = Number(vM[1]); val = Number.isFinite(n) ? n : decodeXmlEntities(vM[1]); }
      cells[ci] = val;
    }
    rows[rowIdx] = cells;
  }
  return rows;
}

function open(path) {
  const files = unzip(fs.readFileSync(path));
  const strings = sharedStrings(files);
  const wb = (files['xl/workbook.xml'] || Buffer.from('')).toString('utf8');
  const rels = (files['xl/_rels/workbook.xml.rels'] || Buffer.from('')).toString('utf8');
  const relMap = {};
  for (const m of rels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
    relMap[m[1]] = m[2].replace(/^\/?xl\//, '');
  }
  const sheets = [...wb.matchAll(/<sheet[^>]*name="([^"]*)"[^>]*r:id="([^"]+)"/g)].map((m, i) => ({
    name: decodeXmlEntities(m[1]),
    path: 'xl/' + (relMap[m[2]] || `worksheets/sheet${i + 1}.xml`),
  }));
  return { files, strings, sheets, read: (i) => readSheet(files, sheets[i].path, strings) };
}

module.exports = { open };

if (require.main === module) {
  const wb = open(process.argv[2]);
  if (process.argv[3] === undefined) {
    wb.sheets.forEach((s, i) => console.log(i + '\t' + s.name + '\t' + s.path));
  } else {
    const rows = wb.read(+process.argv[3]);
    const from = +(process.argv[4] || 0), to = +(process.argv[5] || rows.length);
    for (let r = from; r < Math.min(to, rows.length); r++) {
      console.log(r + '\t' + (rows[r] || []).map((c) => (c == null ? '' : c)).join('\t'));
    }
  }
}
