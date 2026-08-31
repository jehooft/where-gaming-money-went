// Minimal PDF text extractor (FlateDecode + Tj/TJ operators). Usage: node pdftext.js file.pdf
const fs = require('fs'), zlib = require('zlib');
const buf = fs.readFileSync(process.argv[2]);
const streams = [];
let i = 0;
while (true) {
  const s = buf.indexOf('stream', i);
  if (s < 0) break;
  const hdrStart = buf.lastIndexOf('obj', s);
  if (hdrStart < 0) { i = s + 6; continue; }
  const hdr = buf.slice(hdrStart, s).toString('latin1');
  let ds = s + 6;
  if (buf[ds] === 13) ds++;
  if (buf[ds] === 10) ds++;
  const e = buf.indexOf('endstream', ds);
  if (e < 0) break;
  let data = buf.slice(ds, e);
  if (/FlateDecode/.test(hdr)) {
    try { data = zlib.inflateSync(data); }
    catch (err) { try { data = zlib.inflateRawSync(data); } catch (e2) { i = e + 9; continue; } }
  } else { i = e + 9; continue; }
  const txt = data.toString('latin1');
  if (txt.indexOf('Tj') >= 0 || txt.indexOf('TJ') >= 0) streams.push(txt);
  i = e + 9;
}

const STR = /\((?:\\[\s\S]|[^\\()])*\)/g;
const TOK = /\[(?:[^\[\]\\]|\\[\s\S])*\]\s*TJ|\((?:\\[\s\S]|[^\\()])*\)\s*Tj|T\*|Td|TD|Tm|ET/g;

const pages = [];
for (const st of streams) {
  const lines = [];
  let cur = '';
  const tokens = st.match(TOK) || [];
  for (const t of tokens) {
    if (t === 'T*' || t === 'Td' || t === 'TD' || t === 'Tm' || t === 'ET') {
      if (cur.trim()) lines.push(cur.trim());
      cur = '';
      continue;
    }
    const strs = t.match(STR) || [];
    for (let s2 of strs) {
      s2 = s2.slice(1, -1)
        .replace(/\\n/g, ' ').replace(/\\r/g, ' ').replace(/\\t/g, ' ')
        .replace(/\\([()\\])/g, '$1')
        .replace(/\\([0-7]{1,3})/g, (m, o) => String.fromCharCode(parseInt(o, 8)));
      cur += s2;
    }
  }
  if (cur.trim()) lines.push(cur.trim());
  pages.push(lines.join('\n'));
}
console.log(pages.join('\n=== PAGE BREAK ===\n'));
