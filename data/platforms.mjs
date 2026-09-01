// Platform-level model.
//
// Two kinds of entry:
//
//  A) HARDWARE PLATFORMS (console + handheld). Revenue is *derived* from hardware
//     shipments, so each band's shape follows a real, sourced shipment curve:
//
//       revenue(y) = units(y) x hardwarePrice(y)
//                  + softwareUnits(y) x softwarePrice x liveServiceFactor(y)
//
//     softwareUnits(y) is the platform's lifetime software total distributed across
//     years in proportion to the active installed base, so software revenue keeps
//     running for years after hardware shipments peak — which is what actually happens.
//
//  B) REVENUE ENTITIES (arcade / PC / mobile / VR / cloud). No meaningful unit metric
//     exists, so the yearly revenue estimate is given directly in US$ millions.
//
// In both cases the numbers are only used for their *shape and relative size*: the build
// step rescales every band so each segment-year sums exactly to the researched segment
// total in segments.mjs. Sources are in research/RESEARCH-NOTES.md.

export const COMPANIES = {
  // console / handheld makers
  nintendo:   { label: 'Nintendo',        color: '#ff4d4d' },
  sony:       { label: 'Sony',            color: '#5b9dff' },
  microsoft:  { label: 'Microsoft',       color: '#4ac94a' },
  sega:       { label: 'Sega',            color: '#0089cf' },
  atari:      { label: 'Atari',           color: '#c8102e' },
  nec:        { label: 'NEC',             color: '#8a6fbf' },
  snk:        { label: 'SNK',             color: '#d97706' },
  magnavox:   { label: 'Magnavox/Philips',color: '#9aa2b1' },
  coleco:     { label: 'Coleco',          color: '#b45309' },
  mattel:     { label: 'Mattel',          color: '#db2777' },
  panasonic:  { label: '3DO / Panasonic', color: '#0891b2' },
  valve:      { label: 'Valve',           color: '#66c0f4' },
  // arcade
  namco:      { label: 'Namco',           color: '#f59e0b' },
  taito:      { label: 'Taito',           color: '#2563eb' },
  konami:     { label: 'Konami',          color: '#dc2626' },
  capcom:     { label: 'Capcom',          color: '#eab308' },
  midway:     { label: 'Midway/Williams', color: '#7c3aed' },
  // PC / mobile / services
  blizzard:   { label: 'Blizzard',        color: '#00aeff' },
  tencent:    { label: 'Tencent',         color: '#1e88e5' },
  netease:    { label: 'NetEase',         color: '#e53935' },
  epic:       { label: 'Epic Games',      color: '#c9ccd4' },
  ea:         { label: 'Electronic Arts', color: '#ff4747' },
  riot:       { label: 'Riot Games',      color: '#d13639' },
  korean:     { label: 'Nexon / NCSoft',  color: '#00a0e9' },
  king:       { label: 'King / Activision', color: '#f97316' },
  supercell:  { label: 'Supercell',       color: '#facc15' },
  niantic:    { label: 'Niantic',         color: '#3b82f6' },
  mihoyo:     { label: 'HoYoverse',       color: '#6ee7b7' },
  roblox:     { label: 'Roblox',          color: '#e2231a' },
  zynga:      { label: 'Zynga / Take-Two',color: '#c026d3' },
  playrix:    { label: 'Playrix',         color: '#14b8a6' },
  scopely:    { label: 'Scopely',         color: '#a855f7' },
  meta:       { label: 'Meta (Oculus)',   color: '#0064e0' },
  htc:        { label: 'HTC',             color: '#5cb85c' },
  apple:      { label: 'Apple',           color: '#94a3b8' },
  bytedance:  { label: 'ByteDance (Pico)',color: '#25f4ee' },
  google:     { label: 'Google',          color: '#ea4335' },
  nvidia:     { label: 'NVIDIA',          color: '#76b900' },
  amazon:     { label: 'Amazon',          color: '#ff9900' },
  nokia:      { label: 'Nokia & carriers',color: '#7c8ba1' },
  sea:        { label: 'Sea / Garena',     color: '#f26522' },
  moonactive: { label: 'Moon Active',      color: '#ffb703' },
  dreamgames: { label: 'Dream Games',      color: '#ef476f' },
  netmarble:  { label: 'Netmarble',        color: '#5a4fcf' },
  aniplex:    { label: 'Aniplex (Sony)',   color: '#7ea6f0' },
  krafton:    { label: 'Krafton',          color: '#d64550' },
  bandai:     { label: 'Bandai Namco',     color: '#f4a300' },
  retail:     { label: 'Boxed retail',    color: '#78716c' },
  browser:    { label: 'Browser & social',color: '#84cc16' },
  other:      { label: 'Others',          color: '#aab2c0' },
};

// helper: build a {year: value} map from a start year and an array
const yrs = (start, arr) => Object.fromEntries(arr.map((v, i) => [start + i, v]));

// ---------------------------------------------------------------------------
// A) HARDWARE PLATFORMS
// ---------------------------------------------------------------------------
// units      : hardware shipments, millions per calendar year
// hwPrice    : average price actually paid at retail in the launch year, US$ nominal
// hwDecay    : yearly multiplier applied to hwPrice (price cuts + cheaper SKUs)
// swUnits    : lifetime software units, millions (packaged + digital)
// swPrice    : average software price paid, US$ nominal
// launchQ    : quarter of the launch year the platform actually shipped in (1-4)

export const HARDWARE = [
  // ---------- first & second generation ----------
  {
    id: 'odyssey', label: 'Magnavox Odyssey', company: 'magnavox', segment: 'console',
    launchQ: 3, hwPrice: 99, hwDecay: 0.88, swUnits: 0.5, swPrice: 25,
    units: yrs(1972, [0.13, 0.09, 0.07, 0.06]),
    note: 'The first home console. Sold ~350,000 units; games were plastic overlays taped to the TV.',
  },
  {
    id: 'dedicated-pong', label: 'Dedicated Pong consoles', company: 'other', segment: 'console',
    launchQ: 4, hwPrice: 89, hwDecay: 0.72, swUnits: 0, swPrice: 0,
    units: yrs(1975, [0.4, 3.4, 4.0, 1.8, 0.5]),
    note: 'Atari Home Pong, Coleco Telstar, Sears Tele-Games and ~80 imitators. One-chip machines with games built in; the market collapsed in 1977–78 when cartridges arrived.',
  },
  {
    id: 'atari-2600', label: 'Atari 2600 (VCS)', company: 'atari', segment: 'console',
    launchQ: 4, hwPrice: 199, hwDecay: 0.83, swUnits: 120, swPrice: 26,
    units: yrs(1977, [0.4, 0.55, 1.0, 2.0, 3.1, 5.5, 3.4, 1.0, 1.0, 2.0, 2.5, 2.0, 1.5, 1.0, 0.6, 0.4]),
    note: 'The console that made cartridges normal. ~30M sold; still shipping in 1992 as the cut-price "2600 Jr".',
  },
  {
    id: 'odyssey2', label: 'Magnavox Odyssey²', company: 'magnavox', segment: 'console',
    launchQ: 3, hwPrice: 179, hwDecay: 0.82, swUnits: 8, swPrice: 25,
    units: yrs(1978, [0.15, 0.35, 0.5, 0.5, 0.35, 0.15]),
    note: 'Released in 1978 as Magnavox\'s cartridge-based successor to the Odyssey, and sold in Europe as the Philips Videopac G7000. Its built-in membrane keyboard was intended to position it as an educational device as well as a games console. It sold roughly two million units, and performed considerably better in Europe and Brazil than in the United States.',
  },
  {
    id: 'intellivision', label: 'Mattel Intellivision', company: 'mattel', segment: 'console',
    launchQ: 4, hwPrice: 299, hwDecay: 0.8, swUnits: 20, swPrice: 30,
    units: yrs(1979, [0.18, 0.55, 1.05, 1.1, 0.55, 0.2, 0.15, 0.12, 0.1]),
    note: 'Marketed with George Plimpton ads that lined its graphics up against the Atari 2600 — the first console "console war".',
  },
  {
    id: 'atari-5200', label: 'Atari 5200', company: 'atari', segment: 'console',
    launchQ: 4, hwPrice: 269, hwDecay: 0.7, swUnits: 4, swPrice: 30,
    units: yrs(1982, [0.25, 0.6, 0.15]),
    note: 'Released in 1982 as Atari\'s intended successor to the 2600. Its non-centring analogue controllers proved unreliable, it was not backward compatible at launch, and it arrived directly into the downturn that became the crash of 1983. Production ended in 1984 after roughly one million units.',
  },
  {
    id: 'colecovision', label: 'ColecoVision', company: 'coleco', segment: 'console',
    launchQ: 3, hwPrice: 175, hwDecay: 0.72, swUnits: 10, swPrice: 30,
    units: yrs(1982, [0.55, 1.0, 0.4, 0.05]),
    note: 'Shipped with a near-arcade-perfect Donkey Kong. Coleco abandoned it in 1985 to make Cabbage Patch Kids dolls.',
  },
  {
    id: 'vectrex-etc', label: 'Vectrex & other 2nd-gen', company: 'other', segment: 'console',
    launchQ: 4, hwPrice: 199, hwDecay: 0.7, swUnits: 3, swPrice: 28,
    units: yrs(1982, [0.2, 0.35, 0.1]),
    note: 'A group of short-lived second-generation systems, chief among them the Vectrex (1982), which was unique in shipping with its own built-in vector monitor rather than connecting to a television. Vector displays gave sharp, bright lines that raster consoles could not reproduce, but the format was expensive and the machine was discontinued in 1984.',
  },

  // ---------- third generation ----------
  {
    id: 'nes', label: 'NES / Famicom', company: 'nintendo', segment: 'console',
    launchQ: 3, hwPrice: 149, hwDecay: 0.94, swUnits: 500, swPrice: 34,
    units: yrs(1983, [0.5, 1.65, 2.4, 4.5, 6.5, 9.0, 9.5, 8.5, 6.0, 5.0, 3.5, 2.5, 1.5, 0.8]),
    note: '61.9M sold with 500M games. Nintendo\'s lockout chip and licence terms — five games a year, Nintendo manufactures the carts — rebuilt an industry that retailers had written off.',
  },
  {
    id: 'sms', label: 'Sega Master System', company: 'sega', segment: 'console',
    launchQ: 4, hwPrice: 149, hwDecay: 0.9, swUnits: 45, swPrice: 30,
    units: yrs(1986, [0.6, 1.4, 1.8, 1.6, 1.5, 1.6, 1.5, 1.3, 1.0, 0.8, 0.6, 0.3]),
    note: 'A distant second in the US and Japan, but a genuine phenomenon in Brazil, where Tectoy still sold new units into the 2010s.',
  },
  {
    id: 'sg1000', label: 'Sega SG-1000 / Mark III', company: 'sega', segment: 'console',
    launchQ: 3, hwPrice: 135, hwDecay: 0.85, swUnits: 6, swPrice: 28,
    units: yrs(1983, [0.4, 0.7, 0.6, 0.3]),
    note: 'Sega\'s first home console, released in Japan on 15 July 1983 — the same day as the Nintendo Famicom, which comprehensively outsold it. Its revised form, the Mark III, became the basis for the Master System sold internationally from 1986.',
  },

  // ---------- fourth generation ----------
  {
    id: 'genesis', label: 'Mega Drive / Genesis', company: 'sega', segment: 'console',
    launchQ: 4, hwPrice: 189, hwDecay: 0.9, swUnits: 210, swPrice: 42,
    units: yrs(1988, [0.4, 1.1, 2.6, 4.3, 6.0, 6.0, 4.6, 3.0, 1.6, 0.8, 0.35]),
    note: 'Sega of America\'s "Genesis does what Nintendon\'t" campaign took Sega to roughly half the US 16-bit market by 1993 — the closest anyone came to beating Nintendo in that era.',
  },
  {
    id: 'snes', label: 'Super Nintendo (SNES)', company: 'nintendo', segment: 'console',
    launchQ: 4, hwPrice: 199, hwDecay: 0.92, swUnits: 379, swPrice: 46,
    units: yrs(1990, [1.7, 4.5, 7.5, 8.0, 8.5, 7.0, 5.0, 3.5, 2.0, 1.0, 0.4]),
    note: 'Released in 1990 in Japan and 1991 elsewhere, the Super Nintendo sold 49.1 million units and 379 million games. Its Mode 7 hardware scaling and rotation defined the visual style of the era, and its cartridges could carry co-processors — the Super FX chip in Star Fox effectively added 3D hardware to a 16-bit machine.',
  },
  {
    id: 'pce', label: 'PC Engine / TurboGrafx-16', company: 'nec', segment: 'console',
    launchQ: 4, hwPrice: 199, hwDecay: 0.88, swUnits: 40, swPrice: 40,
    units: yrs(1987, [0.4, 1.3, 1.8, 1.9, 1.6, 1.3, 0.9, 0.5, 0.3]),
    note: 'Briefly outsold the Famicom in Japan. Its CD-ROM² add-on (1988) was the first CD games console anywhere.',
  },
  {
    id: 'neogeo', label: 'Neo Geo AES', company: 'snk', segment: 'console',
    launchQ: 2, hwPrice: 649, hwDecay: 0.93, swUnits: 2.5, swPrice: 180,
    units: yrs(1990, [0.06, 0.12, 0.16, 0.18, 0.16, 0.13, 0.1, 0.07, 0.04]),
    note: 'A literal arcade board for the living room, at $649 with $200 cartridges. Tiny install base, enormous revenue per owner.',
  },
  {
    id: 'segacd', label: 'Sega CD & 32X', company: 'sega', segment: 'console',
    launchQ: 4, hwPrice: 249, hwDecay: 0.72, swUnits: 12, swPrice: 45,
    units: yrs(1992, [0.35, 0.85, 1.1, 0.6, 0.15]),
    note: 'Two add-ons for the Mega Drive: the Sega CD (1992), which brought CD-ROM storage and full-motion video, and the 32X (1994), a stopgap 32-bit upgrade released a year before the Saturn. Neither sold well, and together they are generally regarded as having fragmented Sega\'s platform and its developer base at a critical moment.',
  },
  {
    id: 'cdi-3do', label: 'CD-i, 3DO & CD32', company: 'panasonic', segment: 'console',
    launchQ: 4, hwPrice: 599, hwDecay: 0.72, swUnits: 9, swPrice: 50,
    units: yrs(1991, [0.15, 0.3, 0.55, 0.8, 0.6, 0.25, 0.05]),
    note: 'The $699 3DO and the $700 CD-i tried to sell "multimedia" instead of games. Both are cautionary tales about pricing a console like a VCR.',
  },

  // ---------- fifth generation ----------
  {
    id: 'saturn', label: 'Sega Saturn', company: 'sega', segment: 'console',
    launchQ: 2, hwPrice: 399, hwDecay: 0.82, swUnits: 60, swPrice: 45,
    units: yrs(1994, [0.6, 2.4, 2.8, 2.0, 1.0, 0.4, 0.06]),
    note: 'Sega surprise-launched it in the US four months early, at $399 against the PlayStation\'s $299. Retailers who had been cut out of the launch never forgave them.',
  },
  {
    id: 'ps1', label: 'PlayStation', company: 'sony', segment: 'console',
    launchQ: 4, hwPrice: 299, hwDecay: 0.86, swUnits: 962, swPrice: 42,
    units: yrs(1994, [0.3, 3.5, 8.5, 14.0, 19.0, 18.0, 14.0, 11.0, 7.0, 4.0, 2.0, 1.0, 0.2]),
    note: 'Sony\'s first console shipped 102.5M units and 962M games. CDs cost cents to press against $20+ for a cartridge, which is most of why third-party publishers switched sides.',
  },
  {
    id: 'n64', label: 'Nintendo 64', company: 'nintendo', segment: 'console',
    launchQ: 2, hwPrice: 199, hwDecay: 0.88, swUnits: 225, swPrice: 48,
    units: yrs(1996, [3.5, 6.5, 7.5, 6.0, 5.0, 3.0, 1.2, 0.3]),
    note: 'Nintendo stayed on cartridges for speed and piracy control. It cost them Final Fantasy VII — and with it, Japan.',
  },

  // ---------- sixth generation ----------
  {
    id: 'dreamcast', label: 'Sega Dreamcast', company: 'sega', segment: 'console',
    launchQ: 4, hwPrice: 199, hwDecay: 0.8, swUnits: 55, swPrice: 40,
    units: yrs(1998, [0.9, 3.4, 3.2, 1.5, 0.15]),
    note: 'First console with a built-in modem and online play as standard. Sega quit the hardware business in January 2001, 16 months after launch.',
  },
  {
    id: 'ps2', label: 'PlayStation 2', company: 'sony', segment: 'console',
    launchQ: 4, hwPrice: 299, hwDecay: 0.9, swUnits: 1537, swPrice: 39,
    units: yrs(2000, [6.4, 15.5, 22.5, 20.0, 20.0, 16.0, 14.5, 13.5, 9.5, 7.5, 5.0, 3.0, 1.5, 0.6]),
    note: 'The best-selling console ever: ~155M units, 1.54B games, and 13 years on the market. It was also the cheapest DVD player in Japan at launch.',
  },
  {
    id: 'gamecube', label: 'Nintendo GameCube', company: 'nintendo', segment: 'console',
    launchQ: 3, hwPrice: 199, hwDecay: 0.85, swUnits: 208, swPrice: 43,
    units: yrs(2001, [3.5, 6.5, 4.5, 3.5, 2.5, 1.0, 0.25]),
    note: 'Released in 2001, the GameCube sold 21.7 million units — Nintendo\'s weakest home console until the Wii U. It used proprietary 8 cm optical discs, which limited piracy but also capacity, and it shipped without DVD playback at a time when the PlayStation 2 was doubling as a household DVD player.',
  },
  {
    id: 'xbox', label: 'Xbox', company: 'microsoft', segment: 'console',
    launchQ: 4, hwPrice: 299, hwDecay: 0.83, swUnits: 240, swPrice: 45,
    units: yrs(2001, [1.5, 6.5, 6.0, 5.5, 3.5, 1.5, 0.2]),
    note: 'The first console built around an integrated ethernet port. Xbox Live (2002) turned paid online multiplayer into an industry default.',
  },

  // ---------- seventh generation ----------
  {
    id: 'x360', label: 'Xbox 360', company: 'microsoft', segment: 'console',
    launchQ: 4, hwPrice: 349, hwDecay: 0.91, swUnits: 720, swPrice: 45,
    units: yrs(2005, [1.5, 6.5, 8.5, 11.5, 10.5, 13.5, 13.5, 9.5, 6.0, 3.5, 1.0, 0.2]),
    note: 'Launched a year ahead of Sony and led the US for most of the generation, despite a hardware failure rate that cost Microsoft $1.15B in warranty extensions.',
  },
  {
    id: 'wii', label: 'Nintendo Wii', company: 'nintendo', segment: 'console',
    launchQ: 4, hwPrice: 249, hwDecay: 0.94, swUnits: 917, swPrice: 38,
    units: yrs(2006, [3.2, 19.0, 25.5, 20.5, 15.0, 10.5, 5.5, 2.3]),
    note: 'Motion control sold 101.6M consoles to people who had never bought one before. Wii Sports alone shipped 82.9M copies.',
  },
  {
    id: 'ps3', label: 'PlayStation 3', company: 'sony', segment: 'console',
    launchQ: 4, hwPrice: 549, hwDecay: 0.9, swUnits: 595, swPrice: 44,
    units: yrs(2006, [3.5, 9.0, 11.0, 13.5, 14.5, 14.0, 9.5, 6.0, 3.5, 2.0, 0.7, 0.2]),
    note: 'Launched at $499/$599 — Sony lost roughly $250 on every unit — and shipped with a Blu-ray drive that won the format war for them.',
  },

  // ---------- eighth generation ----------
  {
    id: 'wiiu', label: 'Wii U', company: 'nintendo', segment: 'console',
    launchQ: 4, hwPrice: 299, hwDecay: 0.9, swUnits: 103, swPrice: 42,
    units: yrs(2012, [3.1, 2.7, 3.2, 2.6, 1.5, 0.5]),
    note: 'Nintendo\'s worst-selling home console at 13.6M. Almost its entire library was later re-sold, profitably, on Switch.',
  },
  {
    id: 'ps4', label: 'PlayStation 4', company: 'sony', segment: 'console',
    launchQ: 4, hwPrice: 399, hwDecay: 0.93, swUnits: 1600, swPrice: 36,
    units: yrs(2013, [4.2, 14.5, 17.7, 20.0, 19.0, 17.8, 13.6, 5.7, 3.3, 1.0, 0.4]),
    note: '117.2M units. This is the generation where digital passed physical and where in-game spending — season passes, battle passes, cosmetics — became the majority of console software revenue.',
  },
  {
    id: 'xone', label: 'Xbox One', company: 'microsoft', segment: 'console',
    launchQ: 4, hwPrice: 499, hwDecay: 0.9, swUnits: 620, swPrice: 38,
    units: yrs(2013, [3.9, 8.5, 9.5, 10.5, 8.0, 7.0, 5.5, 3.5, 1.6]),
    note: 'A Kinect-bundled $499 launch and a mishandled always-online message put Microsoft behind by roughly 2:1. Game Pass (2017) was the strategic answer.',
  },
  {
    id: 'switch', label: 'Nintendo Switch', company: 'nintendo', segment: 'console',
    launchQ: 1, hwPrice: 299, hwDecay: 0.985, swUnits: 1500, swPrice: 37,
    units: yrs(2017, [14.9, 17.8, 21.0, 28.8, 23.1, 17.4, 15.7, 10.5, 5.0, 2.0]),
    note: 'A hybrid that made the home/handheld split obsolete. 156M units — Nintendo\'s best-selling system — and Nintendo never once cut the $299 launch price.',
  },

  // ---------- ninth generation ----------
  {
    id: 'ps5', label: 'PlayStation 5', company: 'sony', segment: 'console',
    launchQ: 4, hwPrice: 499, hwDecay: 1.0, swUnits: 1150, swPrice: 41,
    units: yrs(2020, [4.5, 11.5, 14.8, 22.5, 20.5, 17.0, 13.5]),
    note: 'Supply-constrained for two full years by the semiconductor shortage. Sony then raised the price rather than cutting it — across Europe, Japan and Canada in August 2022, and in Europe again in April 2025. Mid-generation price rises had essentially never happened before.',
  },
  {
    id: 'xseries', label: 'Xbox Series X|S', company: 'microsoft', segment: 'console',
    launchQ: 4, hwPrice: 399, hwDecay: 1.0, swUnits: 480, swPrice: 40,
    units: yrs(2020, [2.8, 7.5, 8.0, 7.6, 4.5, 3.0, 2.0]),
    note: 'Microsoft stopped reporting console sales in 2022 and now publishes its games on PlayStation and Switch. The $69B Activision Blizzard deal closed in October 2023.',
  },
  {
    id: 'switch2', label: 'Nintendo Switch 2', company: 'nintendo', segment: 'console',
    launchQ: 2, hwPrice: 449, hwDecay: 1.0, swUnits: 90, swPrice: 52,
    units: yrs(2025, [15.0, 20.0]),
    note: 'Launched 5 June 2025 and sold ~10.4M units in under four months — the fastest console start ever recorded.',
  },

  // ---------- handhelds ----------
  {
    id: 'game-watch', label: 'Game & Watch', company: 'nintendo', segment: 'handheld',
    launchQ: 2, hwPrice: 35, hwDecay: 0.95, swUnits: 0, swPrice: 0,
    units: yrs(1980, [3.4, 5.5, 6.5, 5.5, 4.0, 3.5, 3.0, 3.0, 3.0, 2.5, 2.0, 1.5]),
    note: 'Single-game LCD units, 43.4M sold. They funded the R&D that became the Game Boy, and gave it the D-pad.',
  },
  {
    id: 'gameboy', label: 'Game Boy & Game Boy Color', company: 'nintendo', segment: 'handheld',
    launchQ: 2, hwPrice: 89, hwDecay: 0.95, swUnits: 501, swPrice: 28,
    units: yrs(1989, [2.0, 6.0, 9.0, 12.0, 9.0, 7.0, 5.0, 6.0, 8.0, 14.0, 15.0, 12.0, 8.0, 4.0, 1.7]),
    note: 'A monochrome screen and a worse CPU than its rivals, but 10–30 hours on four AA batteries. Tetris made it a commuter device; Pokémon (1996 JP, 1998 worldwide) doubled its sales seven years into its life.',
  },
  {
    id: 'lynx', label: 'Atari Lynx', company: 'atari', segment: 'handheld',
    launchQ: 3, hwPrice: 179, hwDecay: 0.8, swUnits: 4, swPrice: 35,
    units: yrs(1989, [0.15, 0.4, 0.5, 0.4, 0.3, 0.2, 0.05]),
    note: 'Released by Atari in 1989, the Lynx was the first handheld games console with a colour backlit LCD, and could be held in either orientation for left-handed players. Its battery life of roughly four to five hours and comparatively high price left it far behind the Game Boy, and it sold on the order of two million units.',
  },
  {
    id: 'gamegear', label: 'Sega Game Gear', company: 'sega', segment: 'handheld',
    launchQ: 4, hwPrice: 149, hwDecay: 0.85, swUnits: 26, swPrice: 32,
    units: yrs(1990, [0.4, 1.9, 2.7, 2.2, 1.6, 1.0, 0.6, 0.2]),
    note: 'Colour screen, six AA batteries, three to five hours. The Game Boy won on battery life.',
  },
  {
    id: 'ngpc-ws', label: 'Neo Geo Pocket & WonderSwan', company: 'other', segment: 'handheld',
    launchQ: 4, hwPrice: 69, hwDecay: 0.85, swUnits: 11, swPrice: 25,
    units: yrs(1998, [0.4, 1.6, 1.7, 1.0, 0.5, 0.2]),
    note: 'Two late attempts to compete with Nintendo in handhelds. SNK\'s Neo Geo Pocket Color (1999) had a well-regarded microswitched thumbstick and strong fighting games; Bandai\'s WonderSwan (1999), designed by Game Boy creator Gunpei Yokoi, ran for around 30 hours on a single AA battery. Both were confined largely to Japan and were discontinued by 2003.',
  },
  {
    id: 'gba', label: 'Game Boy Advance', company: 'nintendo', segment: 'handheld',
    launchQ: 1, hwPrice: 99, hwDecay: 0.92, swUnits: 377, swPrice: 30,
    units: yrs(2001, [11.0, 16.5, 14.5, 15.5, 12.0, 7.5, 3.5, 1.0]),
    note: 'Released in 2001, the Game Boy Advance sold 81.5 million units and 377 million games. It was backward compatible with the entire Game Boy library, and its original model shipped without a backlit screen — a limitation corrected by the Game Boy Advance SP in 2003.',
  },
  {
    id: 'ngage', label: 'Nokia N-Gage', company: 'nokia', segment: 'handheld',
    launchQ: 4, hwPrice: 299, hwDecay: 0.7, swUnits: 3, swPrice: 35,
    units: yrs(2003, [0.6, 1.6, 0.8]),
    note: 'A phone you held sideways against your ear to talk. Sold ~3M against a 6M first-year target.',
  },
  {
    id: 'nds', label: 'Nintendo DS', company: 'nintendo', segment: 'handheld',
    launchQ: 4, hwPrice: 149, hwDecay: 0.94, swUnits: 948, swPrice: 30,
    units: yrs(2004, [3.0, 14.0, 23.5, 30.0, 31.0, 27.0, 16.5, 6.5, 2.0, 0.4, 0.1]),
    note: '154M units — the best-selling handheld ever. Two screens, a stylus and Brain Age pulled in an audience that did not think of itself as gamers.',
  },
  {
    id: 'psp', label: 'PlayStation Portable', company: 'sony', segment: 'handheld',
    launchQ: 4, hwPrice: 249, hwDecay: 0.93, swUnits: 330, swPrice: 34,
    units: yrs(2004, [2.5, 14.0, 12.0, 12.5, 14.0, 10.5, 8.0, 4.0, 1.8, 0.6, 0.1]),
    note: '80M units and a genuine hit in Japan, where Monster Hunter Portable 3rd sold 4.9M copies domestically.',
  },
  {
    id: '3ds', label: 'Nintendo 3DS', company: 'nintendo', segment: 'handheld',
    launchQ: 1, hwPrice: 249, hwDecay: 0.9, swUnits: 384, swPrice: 32,
    units: yrs(2011, [13.5, 13.5, 12.5, 10.0, 8.5, 7.5, 6.5, 2.7, 0.9, 0.3]),
    note: 'Launched at $249 to poor reviews and was cut to $169 within five months — Nintendo\'s fastest price cut ever, and the moment it became clear phones had taken the casual handheld market.',
  },
  {
    id: 'vita', label: 'PlayStation Vita', company: 'sony', segment: 'handheld',
    launchQ: 4, hwPrice: 249, hwDecay: 0.92, swUnits: 62, swPrice: 30,
    units: yrs(2011, [1.2, 4.5, 3.5, 2.8, 2.0, 1.2, 0.6, 0.2]),
    note: 'Sony\'s last handheld. Proprietary memory cards cost more than the games; it sold ~16M and was discontinued in 2019.',
  },
];

// ---------------------------------------------------------------------------
// B) REVENUE ENTITIES — {year: US$ millions}
// ---------------------------------------------------------------------------
// These are best-estimate revenue shapes. "Others" bands in each segment are computed
// as the residual against the segment total, so they are never negative by construction
// (the build step warns if a named set ever exceeds its segment total).

export const ENTITIES = [
  // ======================= ARCADE (coin drop, attributed to the machine's maker) ======
  {
    id: 'arc-atari', label: 'Atari (arcade)', company: 'atari', segment: 'arcade',
    rev: yrs(1971, [1, 8, 30, 40, 45, 70, 105, 220, 520, 1050, 1350, 1250, 700, 480, 380, 330, 300, 280, 260, 240, 210, 190, 170, 150, 110, 70, 30]),
    note: 'Pong (1972), Breakout (1976), Asteroids (1979), Missile Command, Centipede, Tempest. Atari built the arcade business and then, in 1983, nearly ended it.',
    titles: ['Pong (1972)', 'Breakout (1976)', 'Asteroids (1979)', 'Centipede (1981)'],
  },
  {
    id: 'arc-taito', label: 'Taito', company: 'taito', segment: 'arcade',
    rev: yrs(1973, [12, 18, 25, 40, 60, 420, 900, 1000, 850, 700, 500, 380, 330, 320, 330, 350, 370, 400, 430, 460, 470, 490, 480, 450, 400, 350, 300, 260, 230, 210, 200, 195, 190, 190, 190, 185, 180, 170, 150, 130, 120, 110, 100, 95, 90, 88, 85, 80, 45, 55, 65, 70, 72, 72]),
    note: 'Space Invaders (1978) grossed roughly $2bn in coin drop and is often credited with a nationwide 100-yen coin shortage in Japan — a story that is probably a myth, but the machines were real enough.',
    titles: ['Space Invaders (1978)', 'Bubble Bobble (1986)', 'Arkanoid (1986)'],
  },
  {
    id: 'arc-namco', label: 'Namco / Bandai Namco', company: 'namco', segment: 'arcade',
    rev: yrs(1974, [6, 10, 20, 35, 90, 380, 1150, 1500, 1400, 900, 700, 600, 560, 560, 580, 600, 640, 700, 780, 820, 900, 920, 880, 800, 720, 650, 600, 560, 540, 550, 560, 570, 580, 590, 590, 580, 520, 460, 430, 410, 390, 370, 360, 360, 360, 350, 350, 190, 230, 280, 310, 320, 320]),
    note: 'Pac-Man (1980) sold ~100,000 cabinets in the US alone and took over $1bn in quarters in its first year. Namco still runs Japan\'s largest arcade chain.',
    titles: ['Pac-Man (1980)', 'Galaga (1981)', 'Pole Position (1982)', 'Ridge Racer (1993)', 'Tekken (1994)'],
  },
  {
    id: 'arc-sega', label: 'Sega (arcade)', company: 'sega', segment: 'arcade',
    rev: yrs(1973, [10, 15, 22, 35, 55, 180, 420, 700, 850, 900, 700, 620, 600, 610, 640, 680, 720, 780, 860, 940, 1000, 1080, 1120, 1060, 980, 900, 820, 760, 700, 670, 680, 700, 720, 740, 750, 740, 690, 610, 560, 530, 500, 470, 450, 450, 450, 440, 435, 240, 300, 370, 415, 420, 420]),
    note: 'Out Run (1986), After Burner, Virtua Fighter (1993), Daytona USA (1994). Sega\'s Model 2 and Model 3 boards kept arcades ahead of home consoles until roughly 1999 — after that, they weren\'t.',
    titles: ['Out Run (1986)', 'Virtua Fighter (1993)', 'Daytona USA (1994)', 'House of the Dead (1996)'],
  },
  {
    id: 'arc-nintendo', label: 'Nintendo (arcade)', company: 'nintendo', segment: 'arcade',
    rev: yrs(1978, [15, 60, 180, 620, 700, 420, 220, 140, 100, 80, 60, 45, 35, 25, 15, 8]),
    note: 'Donkey Kong (1981) was designed by a first-time director named Shigeru Miyamoto after a Radar Scope conversion failed. It made Nintendo\'s US arm solvent.',
    titles: ['Donkey Kong (1981)', 'Mario Bros. (1983)', 'Punch-Out!! (1984)'],
  },
  {
    id: 'arc-midway', label: 'Midway / Bally / Williams', company: 'midway', segment: 'arcade',
    rev: yrs(1978, [120, 300, 900, 1350, 1200, 620, 400, 330, 300, 300, 310, 330, 360, 400, 520, 640, 700, 620, 520, 420, 340, 270, 210, 160, 110, 60]),
    note: 'Midway licensed Space Invaders and Pac-Man for the US, then made Defender (1980), Mortal Kombat (1992) and NBA Jam (1993) — the last of which took roughly $1bn in its first year.',
    titles: ['Defender (1980)', 'Mortal Kombat (1992)', 'NBA Jam (1993)'],
  },
  {
    id: 'arc-konami', label: 'Konami (arcade)', company: 'konami', segment: 'arcade',
    rev: yrs(1981, [140, 320, 300, 260, 250, 270, 300, 340, 380, 420, 470, 530, 560, 600, 620, 600, 560, 520, 500, 520, 560, 600, 640, 660, 670, 660, 630, 560, 500, 470, 450, 430, 420, 420, 420, 415, 410, 225, 280, 345, 385, 390, 390]),
    note: 'Frogger (1981), Gradius, Teenage Mutant Ninja Turtles (1989) and then Dance Dance Revolution (1998), which kept Japanese arcades alive by making them a place you went to be watched.',
    titles: ['Frogger (1981)', 'TMNT (1989)', 'Dance Dance Revolution (1998)', 'beatmania IIDX'],
  },
  {
    id: 'arc-capcom', label: 'Capcom (arcade)', company: 'capcom', segment: 'arcade',
    rev: yrs(1984, [40, 90, 160, 240, 320, 420, 520, 900, 1250, 1150, 980, 820, 680, 540, 430, 350, 300, 260, 240, 230, 230, 230, 225, 215, 195, 170, 155, 145, 135, 130, 128, 125, 122, 70, 85, 105, 118, 120, 120]),
    note: 'Street Fighter II (1991) is the highest-grossing arcade game ever made: over $10.6bn in coin drop across its revisions. It also invented the competitive fighting-game scene.',
    titles: ['Street Fighter II (1991)', 'Final Fight (1989)', 'Marvel vs. Capcom (1998)'],
  },
  {
    id: 'arc-snk', label: 'SNK (arcade)', company: 'snk', segment: 'arcade',
    rev: yrs(1985, [30, 60, 100, 160, 240, 380, 520, 620, 700, 720, 660, 580, 480, 380, 300, 240, 190, 150, 110, 80, 55, 35, 20]),
    titles: ['Ikari Warriors (1986)', 'Fatal Fury (1991)', 'The King of Fighters (1994)', 'Metal Slug (1996)'],
    note: 'SNK built its arcade business on the Neo Geo MVS, a multi-slot cabinet system introduced in 1990 that let operators stock up to six games in one machine and swap them without buying new hardware. The same architecture was sold to consumers as the Neo Geo AES, making arcade-identical home conversions possible for the first time.',
  },
  {
    id: 'arc-other', label: 'Other arcade makers', company: 'other', segment: 'arcade',
    residual: true,
    note: 'Data East, Irem, Jaleco, Nichibutsu, Technos, Atari Games post-1985, Raw Thrills, and the modern redemption/ticket operators that now make up most of Western arcade floor space.',
  },

  // ======================= PC =======================================================
  // NOTE: PC bands are STOREFRONTS, not publishers — an EA game bought on Steam counts as
  // Steam. This is the only non-overlapping way to cut PC. Mobile is cut by publisher and
  // arcade by machine manufacturer, both of which are naturally exclusive.
  {
    id: 'pc-retail', label: 'Boxed retail', company: 'retail', segment: 'pc',
    rev: yrs(1979, [5, 45, 140, 340, 480, 450, 400, 440, 500, 590, 700, 810, 950, 1120, 1300, 1620, 1950, 2250, 2500, 2800, 3050, 2950, 2700, 2550, 2450, 2400, 2300, 2100, 1800, 1500, 1200, 950, 750, 560, 420, 310, 230, 170, 130, 100, 80, 60, 45, 38, 32, 28, 25, 22]),
    note: 'Software in a cardboard box on a shelf. It was effectively the whole PC market until Battle.net and Steam, and it is now a rounding error — under 0.1% of PC spending.',
  },
  {
    id: 'pc-valve', label: 'Valve — Steam', company: 'valve', segment: 'pc',
    rev: yrs(2004, [30, 90, 190, 340, 550, 850, 1250, 1750, 2300, 2900, 3500, 4100, 4800, 5500, 6200, 6800, 8200, 9000, 9500, 10200, 11500, 13500, 15000]),
    note: 'Steam launched in 2003 as a mandatory patcher for Counter-Strike, and players hated it. It is now the default PC storefront: >130M monthly users, a 30% cut, and an estimated $11.1bn of gross sales in the first half of 2026 alone.',
    titles: ['Half-Life 2 (2004)', 'Dota 2 (2013)', 'Counter-Strike 2', 'Steam Deck (2022)'],
  },
  {
    id: 'pc-blizzard', label: 'Blizzard — Battle.net', company: 'blizzard', segment: 'pc',
    rev: yrs(2004, [320, 900, 1200, 1400, 1550, 1650, 1700, 1550, 1450, 1300, 1400, 1600, 1550, 1450, 1350, 1250, 1400, 1450, 1350, 1250, 1350, 1400, 1450]),
    note: 'World of Warcraft peaked at 12 million subscribers in 2010 and was, for years, the largest single revenue source in PC gaming. Its $15/month price became the reference for every subscription that followed. (Blizzard\'s boxed sales before 2004 sit in the retail band.)',
    titles: ['World of Warcraft (2004)', 'StarCraft II (2010)', 'Overwatch (2016)', 'Diablo IV (2023)'],
  },
  {
    id: 'pc-korean', label: 'Nexon / NCSoft — Korean portals', company: 'korean', segment: 'pc',
    rev: yrs(1998, [20, 60, 130, 230, 340, 450, 560, 680, 800, 950, 1150, 1400, 1650, 1850, 1950, 2000, 1950, 1900, 1900, 1950, 2000, 1950, 2050, 2000, 1900, 1800, 1780, 1800, 1850]),
    note: 'Lineage (1998) and MapleStory (2003) invented free-to-play with an item shop years before the West accepted it. Korea also built the PC bang — the internet café as a paid venue — which is why Korean online games were billed by the hour long before anyone else sold cosmetics.',
    titles: ['Lineage (1998)', 'MapleStory (2003)', 'Dungeon & Fighter (2005)'],
  },
  {
    id: 'pc-tencent', label: 'Tencent — WeGame & China PC', company: 'tencent', segment: 'pc',
    rev: yrs(2007, [80, 280, 650, 1200, 1900, 2600, 3300, 3900, 4400, 4900, 5400, 5600, 5700, 6300, 6500, 6300, 6400, 6800, 7100, 7400]),
    note: 'CrossFire and Dungeon & Fighter were, for most of the 2010s, two of the three highest-grossing games on Earth — almost entirely inside China, and almost invisible to Western coverage of the industry.',
    titles: ['CrossFire (2008)', 'Dungeon & Fighter (2008 CN)', 'League of Legends China', 'WeGame'],
  },
  {
    id: 'pc-netease-pc', label: 'NetEase — China PC', company: 'netease', segment: 'pc',
    rev: yrs(2003, [40, 110, 200, 300, 420, 560, 720, 900, 1080, 1250, 1400, 1550, 1650, 1700, 1700, 1680, 1700, 1800, 1900, 1880, 1850, 1900, 1980, 2050]),
    titles: ['Fantasy Westward Journey (2003)', 'World of Warcraft CN (2009-2023)', 'Naraka: Bladepoint (2021)'],
    note: 'NetEase built its PC business on domestically developed MMORPGs, principally the Westward Journey series, and on operating foreign titles inside China under licence — most prominently World of Warcraft, which it ran from 2009 until the licensing agreement with Blizzard lapsed in January 2023 and resumed in 2024.',
  },
  {
    id: 'pc-riot', label: 'Riot — Riot client', company: 'riot', segment: 'pc',
    rev: yrs(2010, [60, 280, 600, 950, 1250, 1450, 1550, 1600, 1550, 1500, 1750, 1850, 1800, 1750, 1800, 1850, 1900]),
    note: 'League of Legends (2009) made free-to-play respectable in the West by selling only cosmetics — no paid power. Riot has been wholly owned by Tencent since 2015; it is shown separately because it publishes through its own client.',
    titles: ['League of Legends (2009)', 'Valorant (2020)', 'Teamfight Tactics (2019)'],
  },
  {
    id: 'pc-browser', label: 'Browser & social games', company: 'browser', segment: 'pc',
    rev: yrs(1999, [10, 25, 55, 90, 140, 200, 280, 400, 560, 800, 1400, 2200, 2600, 2500, 2200, 1750, 1300, 950, 680, 470, 310, 200, 130, 90, 70, 60, 55, 50]),
    note: 'Flash portals, then Facebook. FarmVille had 83 million monthly players in 2010. Adobe ended Flash support on 31 December 2020 and most of this catalogue simply stopped existing.',
    titles: ['RuneScape (2001)', 'Club Penguin (2005)', 'FarmVille (2009)'],
  },
  {
    id: 'pc-epic', label: 'Epic — EGS & Fortnite', company: 'epic', segment: 'pc',
    rev: yrs(2017, [400, 2400, 2000, 1900, 2000, 1800, 1900, 2100, 2200, 2300]),
    note: 'Fortnite made an estimated $5.4bn across all platforms in 2018. The Epic Games Store opened that December taking 12% instead of Steam\'s 30%, and bought timed exclusives with the difference.',
    titles: ['Fortnite (2017)', 'Rocket League (2015)', 'Fall Guys (2020)'],
  },
  {
    id: 'pc-microsoft', label: 'Microsoft — Store & PC Game Pass', company: 'microsoft', segment: 'pc',
    rev: yrs(2011, [180, 320, 480, 620, 760, 900, 1050, 1200, 1450, 1800, 2050, 2200, 2350, 2700, 2900, 3000]),
    note: 'Minecraft sold direct from a website before any storefront would carry it; Microsoft bought Mojang for $2.5bn in 2014. PC Game Pass followed in 2019. (Microsoft\'s boxed PC games before 2011 sit in the retail band.)',
    titles: ['Minecraft (2011)', 'PC Game Pass (2019)', 'Age of Empires IV (2021)'],
  },
  {
    id: 'pc-ea', label: 'EA — Origin & EA App', company: 'ea', segment: 'pc',
    rev: yrs(2011, [150, 260, 340, 400, 460, 520, 580, 620, 660, 800, 850, 820, 790, 820, 850, 860]),
    note: 'EA pulled its games off Steam in 2011 to launch Origin, then quietly put them back in 2019. Only what is bought inside EA\'s own client counts here.',
    titles: ['Battlefield', 'The Sims 4 (2014)', 'Apex Legends (2019)'],
  },
  {
    id: 'pc-other', label: 'Other stores & direct sales', company: 'other', segment: 'pc',
    residual: true,
    note: 'GOG, itch.io, Ubisoft Connect, Battle-net-era Chinese operators (Shanda, Giant, Perfect World, Changyou), Roblox on PC, and every developer selling straight from their own site.',
  },

  // ======================= MOBILE ===================================================
  {
    id: 'mob-feature', label: 'Feature-phone & carrier decks', company: 'nokia', segment: 'mobile',
    rev: yrs(1997, [5, 12, 35, 110, 260, 470, 800, 1300, 1900, 2500, 3100, 3500, 3600, 3400, 2900, 2200, 1500, 900, 500, 250, 120, 60]),
    note: 'Snake shipped on 400 million Nokia handsets from 1997. Japan\'s i-mode and the US carrier decks then built a $3–4bn/yr Java and BREW games business that the App Store erased in about four years.',
    titles: ['Snake (1997)', 'Java ME catalogue', 'i-mode games'],
  },
  {
    id: 'mob-king', label: 'King / Activision', company: 'king', segment: 'mobile',
    rev: yrs(2012, [180, 1450, 2200, 1950, 1800, 1900, 2000, 2000, 2100, 2400, 2400, 2350, 2300, 2350, 2400]),
    note: 'Candy Crush Saga (2012) was making around $1.5bn a year at peak and is still a top-10 grosser more than a decade later. Activision Blizzard bought King for $5.9bn in 2015.',
    titles: ['Candy Crush Saga (2012)', 'Candy Crush Soda Saga', 'Farm Heroes Saga'],
  },
  {
    id: 'mob-supercell', label: 'Supercell', company: 'supercell', segment: 'mobile',
    rev: yrs(2012, [100, 480, 1550, 2100, 2300, 2000, 1550, 1400, 1350, 1500, 1600, 1550, 1750, 1800, 1850]),
    note: 'Clash of Clans (2012) and Brawl Stars from a studio of a few hundred people. Tencent bought a controlling stake in 2016 at an $8.6bn valuation.',
    titles: ['Clash of Clans (2012)', 'Clash Royale (2016)', 'Brawl Stars (2018)'],
  },
  {
    id: 'mob-tencent', label: 'Tencent (mobile)', company: 'tencent', segment: 'mobile',
    rev: yrs(2011, [150, 600, 1700, 3200, 4900, 7000, 9500, 11000, 12500, 15500, 17500, 16500, 15500, 16000, 17000, 17800]),
    note: 'Honor of Kings has been the highest-grossing mobile game in the world for most of the last decade — roughly $2bn a year, almost all of it inside China. PUBG Mobile added a second global hit in 2018.',
    titles: ['Honor of Kings (2015)', 'PUBG Mobile (2018)', 'Peacekeeper Elite'],
  },
  {
    id: 'mob-netease', label: 'NetEase (mobile)', company: 'netease', segment: 'mobile',
    rev: yrs(2013, [180, 700, 1600, 2600, 3400, 3900, 4200, 4900, 5400, 5200, 5000, 5300, 5500, 5700]),
    titles: ['Fantasy Westward Journey Mobile', 'Identity V (2018)', 'Knives Out (2017)'],
    note: 'NetEase is the second-largest games company in China after Tencent. Its mobile portfolio spans domestic RPGs, the asymmetric horror game Identity V, and battle-royale titles, and it has invested heavily in overseas studios since the late 2010s in an effort to reduce its dependence on the Chinese regulatory environment.',
  },
  {
    id: 'mob-niantic', label: 'Niantic', company: 'niantic', segment: 'mobile',
    rev: yrs(2016, [830, 620, 800, 900, 1000, 1200, 1100, 800, 700, 600, 550]),
    note: 'Pokémon GO hit 500 million downloads within two months of its July 2016 launch and has taken over $8bn since. Scopely bought Niantic\'s games business for $3.5bn in 2025.',
    titles: ['Pokémon GO (2016)', 'Monster Hunter Now (2023)'],
  },
  {
    id: 'mob-mihoyo', label: 'HoYoverse', company: 'mihoyo', segment: 'mobile',
    rev: yrs(2020, [900, 2100, 1900, 1700, 1900, 1800, 1750]),
    note: 'Genshin Impact (2020) took roughly $1bn on mobile in its first six months and proved a console-quality free-to-play game could be self-published globally from China.',
    titles: ['Genshin Impact (2020)', 'Honkai: Star Rail (2023)', 'Zenless Zone Zero (2024)'],
  },
  {
    id: 'mob-roblox', label: 'Roblox (mobile)', company: 'roblox', segment: 'mobile',
    rev: yrs(2018, [280, 450, 950, 1350, 1500, 1800, 2200, 2600, 2900]),
    titles: ['Roblox (2006; iOS 2012, Android 2014)'],
    note: 'Roblox is a platform rather than a single game: users create the experiences and Roblox takes a share of the in-platform currency, Robux, spent inside them. Launched in 2006 and on mobile from 2012, it derives the majority of its bookings from phones and tablets, and reports a player base skewing heavily towards under-16s.',
  },
  {
    id: 'mob-zynga', label: 'Zynga / Take-Two', company: 'zynga', segment: 'mobile',
    rev: yrs(2009, [180, 450, 700, 850, 750, 620, 580, 620, 700, 850, 1050, 1450, 1900, 2100, 2200, 2400, 2500, 2550]),
    note: 'Take-Two bought Zynga in 2022 in a deal announced at $12.7bn. Monopoly Go, launched in 2023, passed $3bn in player spending in under two years.',
    titles: ['FarmVille (2009)', 'Words With Friends', 'Monopoly Go! (2023)'],
  },
  {
    id: 'mob-playrix', label: 'Playrix', company: 'playrix', segment: 'mobile',
    rev: yrs(2016, [180, 450, 1100, 1800, 2300, 2600, 2500, 2400, 2350, 2300, 2250]),
    titles: ['Gardenscapes (2016)', 'Homescapes (2017)', 'Fishdom'],
    note: 'Founded in Vologda, Russia in 2004 and later headquartered in Ireland, Playrix built one of the largest mobile publishers in the world on the "meta-game" pattern: a match-three puzzle core wrapped in a home-renovation or garden-restoration narrative. Gardenscapes (2016) and Homescapes (2017) established the template, which has been widely imitated.',
  },
  {
    id: 'mob-ea', label: 'EA (mobile)', company: 'ea', segment: 'mobile',
    rev: yrs(2008, [180, 280, 380, 480, 560, 620, 680, 720, 760, 800, 850, 900, 1000, 1100, 1150, 1150, 1200, 1250, 1300]),
    titles: ['The Sims FreePlay', 'FIFA Mobile', 'Star Wars: Galaxy of Heroes (2015)'],
    note: 'Electronic Arts entered mobile through its 2005 acquisition of Jamdat and now operates a portfolio built largely on its sports and Star Wars licences. Its mobile business is smaller than its console and PC operations but considerably more stable, with several titles earning steadily for a decade or more.',
  },
  {
    id: 'mob-scopely', label: 'Scopely', company: 'scopely', segment: 'mobile',
    rev: yrs(2019, [400, 700, 1000, 1200, 1500, 2200, 2600, 2800]),
    titles: ['Monopoly Go! (2023)', 'Stumble Guys', 'Pokémon GO (from 2025)'],
    note: 'A Los Angeles publisher specialising in licensed mobile titles, acquired by Savvy Games Group — owned by Saudi Arabia\'s Public Investment Fund — for $4.9 billion in 2023. Its Monopoly Go, launched that year, became one of the fastest titles ever to pass $3 billion in player spending. Scopely acquired Niantic\'s games business, including Pokémon GO, in 2025.',
  },
  {
    id: 'mob-nintendo', label: 'Nintendo (mobile)', company: 'nintendo', segment: 'mobile',
    rev: yrs(2016, [280, 380, 420, 400, 380, 340, 300, 260, 240, 220, 200]),
    titles: ['Super Mario Run (2016)', 'Fire Emblem Heroes (2017)', 'Pokémon-adjacent titles'],
    note: 'Nintendo resisted mobile publishing for years before releasing Miitomo and Super Mario Run in 2016. Its mobile revenue has remained modest by industry standards and appears to be treated primarily as brand promotion for its hardware, with several titles discontinued after short runs.',
  },
  {
    id: 'mob-sea', label: 'Sea / Garena', company: 'sea', segment: 'mobile',
    rev: yrs(2018, [600, 1100, 1700, 2200, 1600, 1200, 1300, 1400, 1450]),
    note: 'Free Fire was built deliberately for cheap Android handsets and slow connections, which is why it became the biggest mobile shooter in Brazil, India and South-East Asia while barely registering in the US.',
    titles: ['Free Fire (2017)', 'Arena of Valor (SEA)'],
  },
  {
    id: 'mob-moonactive', label: 'Moon Active', company: 'moonactive', segment: 'mobile',
    rev: yrs(2017, [150, 400, 900, 1200, 1300, 1250, 1200, 1250, 1300, 1300]),
    titles: ['Coin Master (2015)'],
    note: 'An Israeli publisher whose single dominant title, Coin Master, combines a slot-machine mechanic with village-building and social raiding. Its monetisation has drawn regulatory scrutiny in several jurisdictions over the resemblance between its core loop and gambling.',
  },
  {
    id: 'mob-dreamgames', label: 'Dream Games', company: 'dreamgames', segment: 'mobile',
    rev: yrs(2021, [150, 600, 1200, 1800, 2100, 2200]),
    note: 'A studio founded in Istanbul in 2019 whose single game, Royal Match, now out-earns most publicly listed games companies.',
    titles: ['Royal Match (2021)'],
  },
  {
    id: 'mob-netmarble', label: 'Netmarble', company: 'netmarble', segment: 'mobile',
    rev: yrs(2014, [500, 800, 1100, 1500, 1400, 1350, 1600, 1700, 1600, 1550, 1600, 1650, 1700]),
    titles: ['Lineage 2: Revolution (2016)', 'Marvel Future Fight (2015)'],
    note: 'One of the largest Korean mobile publishers, listed in Seoul since 2017. It has grown substantially through licensing — operating mobile adaptations of Korean MMO franchises such as Lineage, and of Western properties including Marvel — and through the acquisition of overseas studios.',
  },
  {
    id: 'mob-aniplex', label: 'Aniplex (Sony)', company: 'aniplex', segment: 'mobile',
    rev: yrs(2016, [400, 900, 1100, 1000, 900, 800, 650, 550, 500, 450, 420]),
    note: 'Fate/Grand Order is a text-heavy gacha game that has taken over $6bn, almost all of it in Japan — the clearest example of a mobile hit that is invisible outside its home market.',
    titles: ['Fate/Grand Order (2015)'],
  },
  {
    id: 'mob-krafton', label: 'Krafton', company: 'krafton', segment: 'mobile',
    rev: yrs(2021, [600, 800, 900, 1000, 1050, 1100]),
    titles: ['PUBG Mobile (ex-China)', 'BGMI (India, 2021)'],
    note: 'The Korean publisher behind PUBG: Battlegrounds. Its mobile revenue comes principally from PUBG Mobile outside China, where Tencent handles publishing, and from Battlegrounds Mobile India, a market-specific version launched in 2021 after the original was banned.',
  },
  {
    id: 'mob-bandai', label: 'Bandai Namco (mobile)', company: 'bandai', segment: 'mobile',
    rev: yrs(2014, [400, 650, 850, 1000, 1050, 1000, 950, 900, 850, 820, 850, 870, 880]),
    titles: ['Dragon Ball Z: Dokkan Battle (2015)', 'One Piece Treasure Cruise'],
    note: 'Bandai Namco\'s mobile business rests on long-running gacha adaptations of anime and manga licences, above all Dragon Ball Z: Dokkan Battle. Like several Japanese publishers, it earns a disproportionate share of its revenue domestically, where spending per paying player is among the highest in the world.',
  },
  {
    id: 'mob-other', label: 'Other mobile publishers', company: 'other', segment: 'mobile',
    residual: true,
    note: 'Several thousand publishers — hypercasual studios, the Chinese third-party Android stores, and a very long tail of gacha and puzzle games. Mobile is the least concentrated segment in gaming: even after naming the nineteen largest publishers, roughly half of all spending still sits in this band.',
  },

  // ======================= VR =======================================================
  {
    id: 'vr-rift', label: 'Oculus Rift & Rift S', company: 'meta', segment: 'vr',
    rev: yrs(2016, [230, 260, 240, 200, 120, 40]),
    note: 'The Kickstarter (2012) that restarted VR. Facebook bought Oculus for $2bn in 2014, two years before the Rift shipped.',
  },
  {
    id: 'vr-quest', label: 'Meta Quest', company: 'meta', segment: 'vr',
    rev: yrs(2019, [320, 1250, 2100, 1750, 1500, 1350, 1400, 1450]),
    note: 'Quest 2 (2020) was the first standalone headset to sell in the tens of millions. Quest store content revenue passed $1bn in Feb 2021, $2bn in Sep 2023 and ~$3bn by Mar 2025 — steady, but not the growth curve Meta wanted.',
    titles: ['Beat Saber (2018)', 'Quest 2 (2020)', 'Quest 3 (2023)', 'Quest 3S (2024)'],
  },
  {
    id: 'vr-psvr', label: 'PlayStation VR', company: 'sony', segment: 'vr',
    rev: yrs(2016, [420, 480, 520, 460, 320, 220, 150, 480, 300, 380, 400]),
    note: 'PSVR1 sold ~5M units on the back of an installed base of 100M+ PS4s. PSVR2 (2023) shipped 1.7M in its launch year and then fell to ~0.8M in 2024.',
    titles: ['PSVR (2016)', 'Astro Bot Rescue Mission (2018)', 'PSVR2 (2023)', 'Half-Life: Alyx via PC adapter'],
  },
  {
    id: 'vr-htc', label: 'HTC Vive', company: 'htc', segment: 'vr',
    rev: yrs(2016, [200, 280, 300, 260, 230, 200, 160, 130, 110, 100, 95]),
    note: 'HTC developed the Vive with Valve, launching in April 2016 with the room-scale tracking that distinguished early high-end VR from seated experiences. HTC subsequently repositioned the line towards enterprise and training customers as consumer sales concentrated around cheaper standalone headsets.',
  },
  {
    id: 'vr-valve', label: 'Valve Index & SteamVR', company: 'valve', segment: 'vr',
    rev: yrs(2019, [140, 320, 420, 300, 240, 220, 260, 320]),
    note: 'Half-Life: Alyx (2020) is still the only true system-seller VR has produced; Index headsets sold out worldwide for months around its launch.',
    titles: ['Valve Index (2019)', 'Half-Life: Alyx (2020)'],
  },
  {
    id: 'vr-pico', label: 'Pico (ByteDance)', company: 'bytedance', segment: 'vr',
    rev: yrs(2021, [180, 380, 300, 220, 200, 190]),
    note: 'Pico was acquired by ByteDance in 2021 and is the principal standalone VR platform inside China, where Meta does not operate. Its international expansion was scaled back in 2023 following restructuring, leaving it largely a domestic Chinese platform.',
  },
  {
    id: 'vr-apple', label: 'Apple Vision Pro', company: 'apple', segment: 'vr',
    rev: yrs(2024, [260, 200, 190]),
    note: 'A $3,499 "spatial computer" that Apple pointedly did not market as a games device. Its games catalogue remains small.',
  },
  {
    id: 'vr-other', label: 'Other VR', company: 'other', segment: 'vr',
    residual: true,
    note: 'Samsung Gear VR and Google Cardboard/Daydream (huge in units, negligible in revenue), Windows Mixed Reality, Pimax, Varjo, Bigscreen and the location-based VR arcades.',
  },

  // ======================= CLOUD ====================================================
  {
    id: 'cl-sony', label: 'Sony (PS Now / Plus Premium)', company: 'sony', segment: 'cloud',
    rev: yrs(2015, [40, 80, 140, 220, 330, 480, 620, 700, 780, 850, 950, 1050]),
    note: 'Sony bought Gaikai for $380M in 2012 and OnLive\'s patents in 2015. PS Now was the highest-earning cloud service in the world as late as 2021, largely because nobody else had scale.',
  },
  {
    id: 'cl-microsoft', label: 'Microsoft (Xbox Cloud Gaming)', company: 'microsoft', segment: 'cloud',
    rev: yrs(2019, [60, 300, 480, 700, 900, 1050, 1300, 1550]),
    note: 'xCloud is bundled into Game Pass Ultimate rather than sold on its own, which is why its true revenue is an allocation rather than a line item.',
  },
  {
    id: 'cl-nvidia', label: 'NVIDIA GeForce Now', company: 'nvidia', segment: 'cloud',
    rev: yrs(2015, [10, 20, 30, 50, 80, 160, 280, 380, 460, 540, 640, 740]),
    note: 'The only major service that streams games you already own, rather than a catalogue it licenses.',
  },
  {
    id: 'cl-google', label: 'Google Stadia', company: 'google', segment: 'cloud',
    rev: yrs(2019, [40, 130, 110, 60, 5]),
    note: 'Launched November 2019, stopped funding first-party development in February 2021, shut down 18 January 2023. Google refunded every hardware and software purchase.',
  },
  {
    id: 'cl-amazon', label: 'Amazon Luna', company: 'amazon', segment: 'cloud',
    rev: yrs(2020, [20, 60, 90, 120, 150, 180, 210]),
    note: 'Amazon Luna launched in the United States in 2020, structured as a set of subscription "channels" rather than a single catalogue, and integrated with Twitch and Fire TV hardware. It remains a small share of the cloud segment.',
  },
  {
    id: 'cl-other', label: 'Other cloud services', company: 'other', segment: 'cloud',
    residual: true,
    note: 'Shadow, Boosteroid, Blacknut, and the large Chinese services (Tencent Start, Huawei Cloud Game, migu) that operate almost entirely inside China.',
  },
];

// live-service factor: multiplier on platform software revenue to capture DLC,
// microtransactions, season passes and online subscriptions, which are not counted
// in "software units sold" but are paid by the same players on the same platform.
export function liveServiceFactor(year) {
  if (year < 2003) return 1.0;
  if (year < 2008) return 1.08;
  if (year < 2013) return 1.25;
  if (year < 2018) return 1.55;
  return 1.85;
}
