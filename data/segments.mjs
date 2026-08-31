// Segment-level annual worldwide consumer spending on video games, NOMINAL US$ millions.
// This is the spine of the whole visualisation: every platform/company band is scaled so
// that it sums exactly to these numbers. See research/RESEARCH-NOTES.md for sourcing.
//
// BASIS: player spending only (no B2B). Dedicated games hardware IS included — consoles,
// handhelds, VR headsets — but general-purpose hardware (gaming PCs, GPUs, phones) is not.
// Newzoo's published figures are content-only, so the console column from 2010 onward is
// Newzoo's content number PLUS a hardware estimate built from shipment x price in
// platforms.mjs. That is why the totals here run ~$15-20bn above Newzoo's headline.
//
// confidence: 'high'   = published industry figure, multiple sources agree
//             'medium' = published figure from one source, or a clean interpolation
//             'low'    = reconstructed estimate (mostly pre-1985 and arcade after 1990)

export const SEGMENTS = [
  { id: 'arcade',   label: 'Arcade',      color: '#f4a259', order: 0 },
  { id: 'console',  label: 'Console',     color: '#e15554', order: 1 },
  { id: 'pc',       label: 'PC',          color: '#3bb273', order: 2 },
  { id: 'handheld', label: 'Handheld',    color: '#7768ae', order: 3 },
  { id: 'mobile',   label: 'Mobile',      color: '#4d9de0', order: 4 },
  { id: 'vr',       label: 'VR',          color: '#e1bc29', order: 5 },
  { id: 'cloud',    label: 'Cloud',       color: '#9aa6b8', order: 6 },
];

// year: [arcade, console, pc, handheld, mobile, vr, cloud] in US$ millions, nominal.
export const SEGMENT_TOTALS = {
//        arcade  console     pc  handh   mobile   vr  cloud
  1970: [      0,      0,     0,     0,      0,    0,    0],
  1971: [      1,      0,     0,     0,      0,    0,    0],
  1972: [     12,      2,     0,     0,      0,    0,    0],
  1973: [     60,      6,     0,     0,      0,    0,    0],
  1974: [     95,     12,     0,     0,      0,    0,    0],
  1975: [    120,     45,     0,     0,      0,    0,    0],
  1976: [    210,    200,     0,     0,      0,    0,    0],
  1977: [    340,    330,     0,     0,      0,    0,    0],
  1978: [   1950,    400,     0,     0,      0,    0,    0],
  1979: [   3700,    570,     5,     0,      0,    0,    0],
  1980: [   5500,    900,    45,   380,      0,    0,    0],
  1981: [   8000,   2000,   140,   620,      0,    0,    0],
  1982: [   8500,   3500,   340,   700,      0,    0,    0],   // arcade peak
  1983: [   6000,   2300,   480,   520,      0,    0,    0],   // crash begins
  1984: [   5200,   1100,   450,   320,      0,    0,    0],   // trough
  1985: [   5000,    900,   400,   250,      0,    0,    0],
  1986: [   5000,   1900,   440,   210,      0,    0,    0],
  1987: [   5150,   3600,   500,   200,      0,    0,    0],
  1988: [   5400,   5200,   590,   200,      0,    0,    0],
  1989: [   5700,   6500,   700,   700,      0,    0,    0],   // Game Boy
  1990: [   6050,   7400,   810,  1500,      0,    0,    0],
  1991: [   6600,   7600,   950,  2000,      0,    0,    0],
  1992: [   7150,   8300,  1120,  2400,      0,    0,    0],
  1993: [   7400,   9000,  1300,  2300,      0,    0,    0],
  1994: [   7800,   9500,  1620,  2000,      0,    0,    0],   // arcade renaissance
  1995: [   7900,   9800,  2000,  1700,      0,    0,    0],
  1996: [   7600,  11000,  2400,  2000,      0,    0,    0],   // Pokémon (JP)
  1997: [   7000,  13000,  2800,  2400,      5,    0,    0],   // Snake on Nokia
  1998: [   6300,  15500,  3200,  3600,     12,    0,    0],
  1999: [   5600,  17000,  3600,  4200,     35,    0,    0],
  2000: [   5200,  17500,  3500,  4000,    110,    0,    0],
  2001: [   4800,  19500,  3400,  4300,    260,    0,    0],
  2002: [   4600,  22500,  3600,  4800,    470,    0,    0],
  2003: [   4700,  22000,  4200,  4500,    820,    0,    0],
  2004: [   4800,  22500,  5200,  5000,   1400,    0,    0],
  2005: [   4900,  22000,  6300,  7500,   2200,    0,    0],
  2006: [   5000,  25000,  7500, 10000,   3000,    0,    0],
  2007: [   5100,  31000,  9000, 12500,   3800,    0,    0],   // handheld peak
  2008: [   5000,  34000, 10700, 12000,   4500,    0,    0],
  2009: [   4400,  31000, 12500, 10500,   5500,    0,    0],
  2010: [   3900,  31000, 15000,  8500,   7500,    0,    0],
  2011: [   3700,  30300, 18600,  6500,  11000,    0,    0],
  2012: [   3500,  28800, 20000,  5200,  16000,    0,    0],
  2013: [   3300,  31300, 22000,  4600,  22000,    0,    0],
  2014: [   3100,  36700, 24000,  4000,  28000,    0,    0],
  2015: [   3000,  37600, 26000,  3200,  34000,   60,   50],
  2016: [   3000,  38800, 29000,  2600,  41000,  900,  100],
  2017: [   3000,  43800, 32000,  1800,  50000, 1200,  180],
  2018: [   2900,  46000, 33000,  1200,  60000, 1500,  300],
  2019: [   2900,  44200, 34000,   700,  68000, 2000,  560],
  2020: [   1500,  53400, 37000,   350,  82000, 3300, 1100],   // COVID lockdowns
  2021: [   1900,  57500, 36700,   200,  93200, 5000, 2000],
  2022: [   2400,  56600, 38000,   120,  97000, 4300, 2600],
  2023: [   2700,  61200, 37500,    80,  96000, 3600, 3100],
  2024: [   2800,  58500, 39000,    60, 100300, 3200, 3500],
  2025: [   2800,  63700, 39900,    50, 103000, 3400, 4200],
  2026: [   2800,  64000, 41000,    40, 106000, 3600, 4900],
};

// Per-year confidence flag for the total, shown in the app's methodology panel.
export const CONFIDENCE = {
  ranges: [
    { from: 1970, to: 1976, level: 'low',    note: 'Reconstructed from trade-press unit estimates; no market research existed yet.' },
    { from: 1977, to: 1984, level: 'medium', note: 'Play Meter / Vending Times arcade surveys and contemporaneous retail estimates.' },
    { from: 1985, to: 1994, level: 'medium', note: 'US retail well covered; Japan from Capcom/Sega IR; Europe estimated.' },
    { from: 1995, to: 2011, level: 'medium', note: 'NPD/DFC/Enterbrain coverage is good for retail, weaker for online and China.' },
    { from: 2012, to: 2026, level: 'high',   note: 'Newzoo, Sensor Tower and company filings; 2026 is a forecast.' },
  ],
};

// Seasonality: fraction of the calendar year's revenue landing in Q1..Q4.
// Console/handheld shift from a heavily holiday-weighted retail pattern to a flatter
// live-service pattern as digital and in-game spending take over.
export const SEASONALITY = {
  arcade:   () => [0.24, 0.25, 0.27, 0.24],
  cloud:    () => [0.25, 0.25, 0.25, 0.25],
  mobile:   () => [0.26, 0.24, 0.24, 0.26],
  pc:       (y) => (y < 2005 ? [0.22, 0.20, 0.22, 0.36] : [0.24, 0.24, 0.22, 0.30]),
  vr:       () => [0.20, 0.18, 0.20, 0.42],
  console:  (y) => (y < 2010 ? [0.19, 0.17, 0.20, 0.44]
                  : y < 2016 ? [0.20, 0.19, 0.21, 0.40]
                             : [0.22, 0.21, 0.22, 0.35]),
  handheld: (y) => (y < 2010 ? [0.18, 0.17, 0.20, 0.45] : [0.20, 0.19, 0.21, 0.40]),
};

// US CPI (annual average, 1982-84 = 100), used for the inflation-adjusted view.
// Source: US Bureau of Labor Statistics, CPI-U, All Urban Consumers.
export const CPI = {
  1970: 38.8, 1971: 40.5, 1972: 41.8, 1973: 44.4, 1974: 49.3, 1975: 53.8, 1976: 56.9,
  1977: 60.6, 1978: 65.2, 1979: 72.6, 1980: 82.4, 1981: 90.9, 1982: 96.5, 1983: 99.6,
  1984: 103.9, 1985: 107.6, 1986: 109.6, 1987: 113.6, 1988: 118.3, 1989: 124.0,
  1990: 130.7, 1991: 136.2, 1992: 140.3, 1993: 144.5, 1994: 148.2, 1995: 152.4,
  1996: 156.9, 1997: 160.5, 1998: 163.0, 1999: 166.6, 2000: 172.2, 2001: 177.1,
  2002: 179.9, 2003: 184.0, 2004: 188.9, 2005: 195.3, 2006: 201.6, 2007: 207.3,
  2008: 215.3, 2009: 214.5, 2010: 218.1, 2011: 224.9, 2012: 229.6, 2013: 233.0,
  2014: 236.7, 2015: 237.0, 2016: 240.0, 2017: 245.1, 2018: 251.1, 2019: 255.7,
  2020: 258.8, 2021: 271.0, 2022: 292.7, 2023: 304.7, 2024: 313.7, 2025: 322.1,
  2026: 330.0,
};
export const CPI_BASE_YEAR = 2025;
