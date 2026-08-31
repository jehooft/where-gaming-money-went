// Annotated events shown on the chart, in the style of the Visual Capitalist original.
//
// year/quarter  : when it happened (quarter is used for horizontal placement)
// segment       : which band the leader line points at
// side          : 'top' or 'bottom' — which side of the stream the label sits on
// tier          : 1 = always shown, 2 = shown at wider viewports, 3 = detail view only
//
// Every claim here is either a matter of record (dates, prices, shipped units) or is
// attributed in the text. Figures that are estimates are worded as estimates.

export const EVENTS = [
  {
    year: 1971, quarter: 4, segment: 'arcade', side: 'bottom', tier: 1,
    title: 'The first arcade video game goes on sale',
    text: 'Nutting Associates ships 1,500 Computer Space cabinets. It flops — players find the controls incomprehensible — but its designers, Nolan Bushnell and Ted Dabney, found Atari the following year.',
  },
  {
    year: 1972, quarter: 3, segment: 'console', side: 'bottom', tier: 1,
    title: 'Pong, and the first home console',
    text: 'Atari\'s Pong turns coin-op video games into a business. The same year Magnavox ships the Odyssey, the first home console: no CPU, no software, just circuits and plastic overlays you taped to your TV.',
  },
  {
    year: 1975, quarter: 4, segment: 'console', side: 'bottom', tier: 2,
    title: 'Home Pong at Sears',
    text: 'Sears sells Atari\'s Home Pong exclusively for one Christmas and orders 150,000 units. Within two years roughly 80 companies are selling near-identical one-chip Pong boxes, and the market crashes.',
  },
  {
    year: 1977, quarter: 4, segment: 'console', side: 'bottom', tier: 1,
    title: 'The Atari 2600 makes games a catalogue',
    text: 'Interchangeable cartridges mean the console is no longer the product — the library is. About 30 million 2600s were eventually sold, and it stayed on shelves until 1992.',
  },
  {
    year: 1978, quarter: 3, segment: 'arcade', side: 'top', tier: 1,
    title: 'Space Invaders',
    text: 'Taito\'s game takes an estimated $2 billion in coin drop and single-handedly triples the size of the Japanese arcade market. Japanese operators open venues that stock nothing else.',
  },
  {
    year: 1980, quarter: 2, segment: 'arcade', side: 'top', tier: 1,
    title: 'Pac-Man earns over $1 billion in quarters',
    text: 'Namco\'s maze game sells around 100,000 cabinets in the US alone in its first year. A good machine took $200–240 a week; the best took $800.',
  },
  {
    year: 1980, quarter: 2, segment: 'handheld', side: 'bottom', tier: 2,
    title: 'Game & Watch',
    text: 'Nintendo starts selling single-game LCD handhelds designed by Gunpei Yokoi. 43.4 million sold, and the D-pad invented for Donkey Kong (1982) is still the standard control today.',
  },
  {
    year: 1981, quarter: 3, segment: 'arcade', side: 'top', tier: 2,
    title: 'Donkey Kong saves Nintendo of America',
    text: 'Nintendo\'s US arm is sitting on 2,000 unsold Radar Scope cabinets. A first-time game director, Shigeru Miyamoto, converts them into Donkey Kong. It sells 60,000 units.',
  },
  {
    year: 1982, quarter: 4, segment: 'arcade', side: 'top', tier: 1,
    title: 'Peak arcade',
    text: 'US arcades take somewhere between $5 and $8 billion in quarters, depending on whose survey you believe — comparable to the entire US box office and the recorded-music business put together.',
  },
  {
    year: 1983, quarter: 2, segment: 'console', side: 'bottom', tier: 1,
    title: 'The crash of 1983',
    text: 'North American console revenue falls by roughly 97% over two years. The causes: too many machines, unlicensed shovelware, and retailers who would no longer take the inventory risk. Atari buries unsold E.T. cartridges in a New Mexico landfill.',
  },
  {
    year: 1983, quarter: 3, segment: 'console', side: 'bottom', tier: 1,
    title: 'Famicom launches in Japan',
    text: 'Nintendo sells the Family Computer for ¥14,800 — cheaper than any competitor — and takes a manufacturing margin on every licensed cartridge instead. That model funds the next twenty years.',
  },
  {
    year: 1985, quarter: 4, segment: 'console', side: 'bottom', tier: 1,
    title: 'The NES reopens American retail',
    text: 'Nintendo test-markets the NES in New York with a robot, a light gun and a money-back guarantee, because "video game" was a word toy buyers refused to hear. National rollout follows in 1986.',
  },
  {
    year: 1989, quarter: 2, segment: 'handheld', side: 'top', tier: 1,
    title: 'Game Boy, bundled with Tetris',
    text: 'A monochrome screen and a weaker chip than its rivals, but 10–30 hours on four AA batteries. Bundling Tetris aimed it at adults as much as children. 118.7 million sold across Game Boy and Game Boy Color.',
  },
  {
    year: 1989, quarter: 3, segment: 'console', side: 'bottom', tier: 2,
    title: '"Genesis does what Nintendon\'t"',
    text: 'Sega of America attacks Nintendo by name — unheard of in games advertising — and takes roughly half the US 16-bit market by 1993. It is the only time anyone seriously threatened Nintendo at home.',
  },
  {
    year: 1991, quarter: 1, segment: 'arcade', side: 'top', tier: 1,
    title: 'Street Fighter II',
    text: 'Capcom\'s fighter has taken over $10.6 billion in coin drop across its revisions — the highest-grossing arcade game ever made. It also created competitive fighting games as a scene.',
  },
  {
    year: 1993, quarter: 2, segment: 'pc', side: 'bottom', tier: 1,
    title: 'Doom, and shareware distribution',
    text: 'id Software gives away the first episode and sells the rest by mail order, bypassing retail entirely. Within two years Doom is estimated to be installed on more PCs than Windows 95.',
  },
  {
    year: 1994, quarter: 4, segment: 'console', side: 'bottom', tier: 1,
    title: 'PlayStation and the switch to CDs',
    text: 'Sony enters the market after Nintendo walks away from a joint CD-ROM project. A CD costs cents to press; a cartridge costs $20+. Third-party publishers move en masse.',
  },
  {
    year: 1996, quarter: 1, segment: 'handheld', side: 'top', tier: 2,
    title: 'Pokémon Red and Green',
    text: 'Released on a Game Boy everyone assumed was finished, seven years into its life. Handheld revenue roughly doubles between 1995 and 1999 on the back of it.',
  },
  {
    year: 1997, quarter: 3, segment: 'mobile', side: 'top', tier: 1,
    title: 'Snake ships on 400 million phones',
    text: 'Nokia preloads Snake on the 6110. It is not sold and earns nothing directly, but it is the first time hundreds of millions of people carry a game in their pocket.',
  },
  {
    year: 1998, quarter: 4, segment: 'pc', side: 'bottom', tier: 2,
    title: 'Lineage and the item shop',
    text: 'NCSoft launches Lineage in Korea. Korean studios spend the next decade proving that free-to-play with paid items out-earns box sales — years before Western publishers accept it.',
  },
  {
    year: 1999, quarter: 3, segment: 'console', side: 'bottom', tier: 2,
    title: 'Dreamcast ships with a modem',
    text: 'Sega puts a 56k modem in every unit and runs online play as standard. It sells 9.1 million and Sega leaves the hardware business in January 2001, 16 months after the US launch.',
  },
  {
    year: 2000, quarter: 4, segment: 'console', side: 'bottom', tier: 1,
    title: 'PlayStation 2 — 155 million units',
    text: 'The best-selling console ever made, on sale for 13 years. In Japan it was also, briefly, the cheapest DVD player you could buy, which is why it sold out in three days.',
  },
  {
    year: 2000, quarter: 1, segment: 'pc', side: 'bottom', tier: 2,
    title: 'The Sims',
    text: 'Will Wright\'s game about domestic life sells to an audience that is roughly half women, at a time when the industry assumed it did not have one. It becomes the best-selling PC franchise of its era.',
  },
  {
    year: 2001, quarter: 4, segment: 'console', side: 'bottom', tier: 1,
    title: 'Xbox, with an ethernet port',
    text: 'Microsoft ships the first console with integrated broadband networking. Xbox Live follows in November 2002 and makes paid online multiplayer a normal thing to charge for.',
  },
  {
    year: 2003, quarter: 3, segment: 'pc', side: 'bottom', tier: 1,
    title: 'Steam',
    text: 'Valve launches Steam as a mandatory patcher for Counter-Strike and is widely loathed for it. Twenty years later it is the default PC storefront, taking a 30% cut of most of the segment.',
  },
  {
    year: 2004, quarter: 4, segment: 'pc', side: 'bottom', tier: 1,
    title: 'World of Warcraft',
    text: 'Peaks at 12 million subscribers in 2010. For most of a decade a single game is the largest revenue line in PC gaming, and the $15/month subscription becomes the reference price for everything.',
  },
  {
    year: 2004, quarter: 4, segment: 'handheld', side: 'top', tier: 1,
    title: 'Nintendo DS and PSP arrive together',
    text: 'Two screens and a stylus against a machine that plays UMD movies. The DS ends up at 154 million units — the best-selling handheld ever — and the PSP at 80 million. Handheld revenue peaks in 2007.',
  },
  {
    year: 2006, quarter: 4, segment: 'console', side: 'bottom', tier: 1,
    title: 'Wii, PS3 and the price of ambition',
    text: 'Sony launches the PS3 at $499/$599, losing an estimated $250 a unit. Nintendo launches the Wii at $249 with motion control and sells 101.6 million — largely to people who had never bought a console.',
  },
  {
    year: 2007, quarter: 3, segment: 'mobile', side: 'top', tier: 1,
    title: 'iPhone',
    text: 'No games at launch and no third-party apps at all. The App Store arrives in July 2008 with a 70/30 split and no gatekeeper beyond review — the lowest barrier to publishing a game that had ever existed.',
  },
  {
    year: 2008, quarter: 3, segment: 'mobile', side: 'top', tier: 1,
    title: 'The App Store, and the collapse of the $50 game',
    text: 'Within two years the going rate for a mobile game falls from $9.99 to $0.99 to free. The dominant business model shifts from selling a copy to selling to the small fraction of players who spend.',
  },
  {
    year: 2009, quarter: 3, segment: 'pc', side: 'bottom', tier: 2,
    title: 'FarmVille and League of Legends',
    text: 'Two free-to-play launches within months of each other: one on Facebook, peaking at 83 million monthly players, one on PC. Only one of them still exists.',
  },
  {
    year: 2011, quarter: 4, segment: 'pc', side: 'bottom', tier: 2,
    title: 'Minecraft leaves beta',
    text: 'Sold direct from a website, by a studio of a handful of people, before any storefront would carry it. Microsoft buys Mojang for $2.5 billion in 2014; it is now the best-selling game of all time.',
  },
  {
    year: 2012, quarter: 4, segment: 'mobile', side: 'top', tier: 1,
    title: 'Candy Crush and Clash of Clans',
    text: 'Two 2012 launches that make free-to-play the default. Both were still top-grossing titles more than ten years later; Activision Blizzard paid $5.9 billion for King in 2015.',
  },
  {
    year: 2013, quarter: 3, segment: 'console', side: 'bottom', tier: 2,
    title: 'GTA V takes $800 million in a day',
    text: 'And $1 billion in three. Its online mode then keeps earning for over a decade, which is the clearest early demonstration that a console game could be a service rather than a product.',
  },
  {
    year: 2015, quarter: 3, segment: 'pc', side: 'bottom', tier: 2,
    title: 'China lifts its console ban',
    text: 'China\'s ban on console sales, in force since 2000, is lifted nationwide. It changes less than expected: the market had already been built around PC and mobile, and it stays there.',
  },
  {
    year: 2016, quarter: 3, segment: 'mobile', side: 'top', tier: 1,
    title: 'Pokémon GO',
    text: '500 million downloads within two months of its July launch, and over $8 billion in player spending since. It also proved a mobile game could be a physical, public event.',
  },
  {
    year: 2016, quarter: 1, segment: 'vr', side: 'top', tier: 1,
    title: 'Consumer VR finally ships',
    text: 'Oculus Rift, HTC Vive and, that October, PlayStation VR. Sales are an order of magnitude below the forecasts, and VR settles in at 2–3% of industry revenue rather than replacing the screen.',
  },
  {
    year: 2017, quarter: 1, segment: 'console', side: 'bottom', tier: 1,
    title: 'Nintendo Switch',
    text: 'A hybrid that ends the home/handheld distinction Nintendo itself created. 156 million units, and Nintendo never cut the $299 launch price in eight years.',
  },
  {
    year: 2017, quarter: 3, segment: 'pc', side: 'bottom', tier: 1,
    title: 'Fortnite Battle Royale',
    text: 'Added as a free mode two months after the paid game launched, and it took over. An estimated $5.4 billion in 2018 across platforms, and the battle pass replaces the loot box as the industry\'s default.',
  },
  {
    year: 2018, quarter: 4, segment: 'pc', side: 'bottom', tier: 2,
    title: 'The Epic Games Store opens at 12%',
    text: 'Epic undercuts Steam\'s 30% cut by more than half and buys timed exclusives with the difference. Steam\'s share barely moves, but the 30% standard is now permanently contested.',
  },
  {
    year: 2019, quarter: 4, segment: 'cloud', side: 'top', tier: 2,
    title: 'Stadia launches',
    text: 'Google promises games with no console at all. It stops funding its own studios 15 months later and shuts the service on 18 January 2023, refunding every purchase.',
  },
  {
    year: 2020, quarter: 2, segment: 'console', side: 'bottom', tier: 1,
    title: 'Lockdowns',
    text: 'Console spending jumps by a fifth in a single year while arcades close almost completely — arcade revenue roughly halves. It is the sharpest one-year divergence anywhere in this chart.',
  },
  {
    year: 2020, quarter: 4, segment: 'console', side: 'bottom', tier: 2,
    title: 'PS5 and Xbox Series launch into a chip shortage',
    text: 'Both are supply-constrained for two years. In August 2022 Sony raises the PS5 price across Europe, Japan and Canada — and again in Europe in 2025 — rather than cutting it. Mid-generation price rises had essentially never happened before.',
  },
  {
    year: 2020, quarter: 3, segment: 'mobile', side: 'top', tier: 2,
    title: 'Genshin Impact',
    text: 'A free, console-quality game self-published globally from Shanghai, taking roughly $1 billion on mobile in six months. It ends the assumption that Chinese studios need a Western partner.',
  },
  {
    year: 2021, quarter: 4, segment: 'mobile', side: 'top', tier: 2,
    title: 'Mobile passes half the industry',
    text: 'Mobile spending reaches $93 billion — more than PC and console combined. More than half of it comes from Asia-Pacific, and most of the top-grossing titles never chart in the West.',
  },
  {
    year: 2022, quarter: 1, segment: 'console', side: 'bottom', tier: 1,
    title: 'Microsoft bids $69 billion for Activision Blizzard',
    text: 'The largest acquisition in the history of the industry, roughly the size of the entire global games market in 2010. It closes in October 2023 after regulators in three jurisdictions try to block it.',
  },
  {
    year: 2023, quarter: 2, segment: 'arcade', side: 'top', tier: 2,
    title: 'Japanese arcades come back — smaller',
    text: 'Operating revenue recovers for a third straight year after the pandemic, but the floor is now mostly prize machines and rhythm games. Video-game coin drop never returns to its 2007 level.',
  },
  {
    year: 2024, quarter: 1, segment: 'console', side: 'bottom', tier: 2,
    title: 'The layoff year',
    text: 'More than 14,000 games jobs are cut in 2024 after two years of near-flat revenue. The industry stops growing faster than its costs.',
  },
  {
    year: 2025, quarter: 2, segment: 'console', side: 'bottom', tier: 1,
    title: 'Nintendo Switch 2',
    text: 'Launches 5 June 2025 at $449 and sells roughly 10.4 million units in under four months — the fastest start any console has had. Console is the fastest-growing segment of 2025 as a result.',
  },
  {
    year: 2026, quarter: 2, segment: 'pc', side: 'bottom', tier: 2,
    title: 'Steam\'s biggest half-year',
    text: 'Games on Steam take an estimated $11.1 billion gross in the first half of 2026. Thirty years after PC gaming was written off as a dying platform, it is the segment growing most reliably.',
  },
];

// Milestones drawn as vertical rules rather than callouts.
export const ERAS = [
  { from: 1971, to: 1983, label: 'Arcade era' },
  { from: 1983, to: 1995, label: 'Cartridge era' },
  { from: 1995, to: 2007, label: 'Disc & retail era' },
  { from: 2007, to: 2016, label: 'Digital & mobile shift' },
  { from: 2016, to: 2027, label: 'Live service era' },
];
