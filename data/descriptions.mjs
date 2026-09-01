// Reference prose for the detail panel: one entry for every segment, every
// company band, and every region. Written in a neutral, encyclopedic register.
//
// Company notes are keyed `segment:company`, because several companies appear in
// more than one segment and mean different things in each — "Sega" in arcade is a
// machine manufacturer, "Sega" in console is a platform holder.

export const SEGMENT_NOTES = {
  arcade: 'Coin inserted into arcade video machines worldwide. The segment was the whole '
    + 'of the video game industry until home consoles arrived, and peaked in 1982 at roughly '
    + '$8.5 billion nominal. It then collapsed in North America but not in Japan, where arcade '
    + 'operating revenue remained a multi-billion-dollar business into the 2010s. Figures here '
    + 'count the video-game share of operator income only, excluding pinball, redemption and '
    + 'prize machines, and excluding cabinet sales to operators.',

  console: 'All consumer spending on home console ecosystems: hardware, games from every '
    + 'publisher, downloadable content and online subscriptions. Bands are cut by platform '
    + 'holder, so the PlayStation 4 band includes revenue from games published by Activision, '
    + 'Ubisoft and everyone else. The segment has been the industry\'s centre of gravity for '
    + 'most of its history and remains the largest source of premium, one-off game purchases.',

  pc: 'Games played on personal computers. Bands are cut by storefront rather than publisher, '
    + 'because that is the only division that does not count the same sale twice: a game '
    + 'published by Electronic Arts and bought on Steam is Steam revenue. The segment moved '
    + 'from boxed retail through Battle.net and Steam to the Chinese and Korean online '
    + 'ecosystems, which together now account for roughly 40% of worldwide PC spending.',

  handheld: 'Dedicated handheld consoles with their own software libraries, from the Game & '
    + 'Watch through the Nintendo 3DS and PlayStation Vita. The segment peaked in 2007 at '
    + 'around $12.5 billion and then collapsed almost entirely as smartphones absorbed the '
    + 'casual portable audience. Hybrid systems such as the Nintendo Switch are counted under '
    + 'console, and handheld PCs such as the Steam Deck under PC.',

  mobile: 'Games on phones and tablets, cut by publisher. The segment began with carrier '
    + 'portals — Japan\'s i-mode and the Western operator decks — before the App Store and '
    + 'Google Play removed the gatekeepers in 2008. It passed console and PC combined in 2019 '
    + 'and is now more than half of all industry revenue, though it is also the least '
    + 'concentrated segment: no single publisher holds as much as a fifth of it.',

  vr: 'Consumer virtual-reality headsets and the software sold for them. Modern VR dates from '
    + 'the 2016 launches of the Oculus Rift, HTC Vive and PlayStation VR. The segment is real '
    + 'and growing but has settled at roughly 2% of industry revenue — around a tenth of the '
    + 'scale forecast for it in the mid-2010s. Headset hardware is included here, as it is in '
    + 'most published VR market figures.',

  cloud: 'Subscription and pay-per-session game streaming, where the game runs on a remote '
    + 'server and only video is sent to the player. It is the smallest segment on this chart '
    + 'and the one where the most capital has been lost: Google closed Stadia in 2023 having '
    + 'refunded every purchase. Revenue is difficult to isolate because the largest services '
    + 'bundle streaming into wider subscriptions rather than selling it separately.',
};

export const COMPANY_NOTES = {
  // ---------------------------------------------------------------- console
  'console:nintendo': 'Nintendo has shipped home consoles continuously since the 1983 Famicom. '
    + 'Its commercial model has rested on selling hardware at or near cost while taking a '
    + 'manufacturing margin on licensed software, and on first-party franchises that no '
    + 'competitor can replicate. It is the only platform holder from the 1980s still in the '
    + 'hardware business.',
  'console:sony': 'Sony entered the console market in 1994 after a joint CD-ROM project with '
    + 'Nintendo collapsed. PlayStation has led four of the six generations it has contested, '
    + 'and its regional strength is unusual: it consistently outsells its rivals in Europe and '
    + 'Latin America by wider margins than in North America.',
  'console:microsoft': 'Microsoft entered hardware in 2001, motivated in part by the prospect '
    + 'of Sony establishing a rival computing platform in the living room. Its lasting '
    + 'contributions are Xbox Live, which normalised paid online console play, and Game Pass. '
    + 'Since 2024 it has published its games on rival platforms, and it has never established '
    + 'a Japanese market.',
  'console:sega': 'Sega manufactured home consoles from 1983 to 2001 and came closer than any '
    + 'other company to displacing Nintendo, holding roughly half the US 16-bit market at its '
    + 'peak. A sequence of fragmenting hardware decisions — the Sega CD, the 32X and an early '
    + 'Saturn launch — preceded its exit from hardware in January 2001. It remains a software '
    + 'publisher and arcade operator.',
  'console:atari': 'Atari created the home console market as a mass-market business with the '
    + '2600 in 1977 and, through overproduction and an unlicensed software flood, was central '
    + 'to its 1983 collapse. The company was split and sold in 1984; the brand has changed '
    + 'hands repeatedly since.',
  'console:nec': 'NEC entered the console market in 1987 with the PC Engine, developed with '
    + 'Hudson Soft. It briefly outsold the Famicom in Japan and pioneered CD-ROM storage in '
    + 'consoles, but its Western release as the TurboGrafx-16 was poorly timed against the '
    + 'Mega Drive and it never established itself outside Japan.',
  'console:snk': 'SNK sold the Neo Geo AES from 1990 as a home version of its arcade hardware, '
    + 'identical in specification to the coin-op boards. At $649 with cartridges near $200 it '
    + 'was never a mass-market product, but revenue per owner was extraordinarily high.',
  'console:mattel': 'Mattel Electronics released the Intellivision in 1979, positioning it '
    + 'against the Atari 2600 on graphical fidelity in a comparative advertising campaign '
    + 'fronted by the writer George Plimpton. Mattel closed the division in 1984 during the '
    + 'crash.',
  'console:coleco': 'Coleco moved from above-ground swimming pools to electronic games, '
    + 'releasing the Telstar consoles in 1976 and the ColecoVision in 1982. The latter shipped '
    + 'with a licensed conversion of Donkey Kong. The company abandoned games in 1985 and '
    + 'later filed for bankruptcy.',
  'console:magnavox': 'Magnavox manufactured the Odyssey, designed by Ralph Baer and released '
    + 'in 1972 as the first home video game console. Magnavox and its parent Philips continued '
    + 'in the market through the Odyssey², the Videopac line in Europe and the CD-i.',
  'console:panasonic': 'Groups the CD-based "multimedia" consoles of the early 1990s — the 3DO '
    + 'Interactive Multiplayer, Philips CD-i and Amiga CD32. Each was priced as a consumer '
    + 'electronics device rather than a games machine, and none found an audience at that price.',
  'console:valve': 'Valve\'s hardware appears in the PC segment rather than console, because '
    + 'its devices run PC software bought through Steam.',
  'console:other': 'Systems too small or too short-lived to warrant their own band, including '
    + 'the dedicated Pong consoles of 1975–78 and the Vectrex.',

  // ---------------------------------------------------------------- handheld
  'handheld:nintendo': 'Nintendo dominated dedicated handhelds from the Game & Watch in 1980 '
    + 'until the segment was absorbed by smartphones. Its consistent strategy was to accept '
    + 'weaker specifications in exchange for battery life and price — a trade that defeated '
    + 'better-specified rivals repeatedly.',
  'handheld:sony': 'Sony contested the handheld market with the PSP (2004) and PS Vita (2011). '
    + 'The PSP sold 80 million units and was particularly successful in Japan; the Vita was '
    + 'not, and Sony has not released a handheld since.',
  'handheld:sega': 'Sega\'s Game Gear (1990) offered a backlit colour screen against the Game '
    + 'Boy\'s monochrome display, at the cost of roughly three to five hours of battery life '
    + 'from six AA cells. It sold around 10.6 million units.',
  'handheld:atari': 'Atari\'s Lynx was the first colour backlit handheld, and among the first '
    + 'commercial products designed by the team that later founded 3DO.',
  'handheld:nokia': 'Nokia\'s N-Gage (2003) attempted to merge a phone and a games handheld. '
    + 'It is remembered chiefly for requiring the user to hold the device sideways against '
    + 'their ear, and for a battery compartment that had to be opened to change games.',
  'handheld:other': 'Late entrants that never scaled, principally SNK\'s Neo Geo Pocket Color '
    + 'and Bandai\'s WonderSwan.',

  // ---------------------------------------------------------------- pc
  'pc:valve': 'Valve operates Steam, which has been the default PC storefront since roughly '
    + '2010. Its standard revenue share is 30%, falling to 25% and 20% at high sales volumes. '
    + 'Valve is privately held and publishes no financial statements, so all figures for it '
    + 'are third-party estimates.',
  'pc:tencent': 'Tencent is the largest games company in the world by revenue. Its PC business '
    + 'is overwhelmingly domestic Chinese and rests on long-running free-to-play titles — '
    + 'CrossFire, Dungeon & Fighter and League of Legends — distributed through its own WeGame '
    + 'client and through internet cafés.',
  'pc:netease': 'NetEase is China\'s second-largest games company, built on domestically '
    + 'developed MMORPGs and on operating foreign titles inside China under licence.',
  'pc:blizzard': 'Blizzard Entertainment operates the Battle.net client, launched in 1996 with '
    + 'Diablo. World of Warcraft, released in 2004, was for several years the single largest '
    + 'source of revenue in PC gaming. Blizzard has been owned by Microsoft since the '
    + 'Activision Blizzard acquisition closed in October 2023.',
  'pc:korean': 'Groups Nexon, NCSoft and the wider Korean online ecosystem. Korean studios '
    + 'commercialised free-to-play with paid items several years before Western publishers '
    + 'accepted the model, and the PC bang — the internet café as a paid gaming venue — gave '
    + 'them a distribution channel with no Western equivalent.',
  'pc:riot': 'Riot Games developed League of Legends, released in 2009 and monetised entirely '
    + 'through cosmetics rather than paid advantage. Tencent acquired a majority stake in 2011 '
    + 'and full ownership in 2015; Riot continues to operate its own client and is shown '
    + 'separately here for that reason.',
  'pc:epic': 'Epic Games develops Unreal Engine and Fortnite, and opened the Epic Games Store '
    + 'in December 2018 with a 12% revenue share against Steam\'s 30%. Its litigation against '
    + 'Apple and Google over app-store commissions has reshaped platform economics beyond PC.',
  'pc:microsoft': 'Covers the Microsoft Store, PC Game Pass and direct sales of Minecraft. '
    + 'DirectX, introduced in 1995, is the principal reason Windows rather than any other '
    + 'operating system became the PC gaming platform.',
  'pc:ea': 'Electronic Arts withdrew its games from Steam in 2011 to launch Origin, later the '
    + 'EA app, and returned them to Steam in 2019. Only purchases made inside EA\'s own client '
    + 'are counted in this band.',
  'pc:retail': 'Boxed software sold through physical shops. This was effectively the entire PC '
    + 'games market until digital distribution arrived, and is now a rounding error — under '
    + '0.1% of PC spending.',
  'pc:browser': 'Games played in a web browser, first on Flash portals and then on Facebook. '
    + 'Adobe ended Flash support on 31 December 2020, and the great majority of this catalogue '
    + 'ceased to be playable.',
  'pc:other': 'Every other PC storefront and direct sale: GOG, itch.io, Ubisoft Connect, the '
    + 'large Chinese operators of the 2000s such as Shanda and Perfect World, and developers '
    + 'selling from their own websites.',

  // ---------------------------------------------------------------- mobile
  'mobile:tencent': 'Tencent\'s mobile division publishes Honor of Kings, which has been among '
    + 'the highest-grossing mobile games in the world for most of the last decade, and PUBG '
    + 'Mobile. The great majority of its revenue is earned inside China.',
  'mobile:netease': 'NetEase is the second-largest mobile publisher in China and has expanded '
    + 'aggressively into overseas development studios since the late 2010s.',
  'mobile:king': 'King, founded in Sweden, released Candy Crush Saga in 2012. Activision '
    + 'Blizzard acquired the company for $5.9 billion in 2016, and it passed to Microsoft with '
    + 'that acquisition in 2023.',
  'mobile:supercell': 'A Finnish studio that operates a small number of very long-lived titles '
    + '— Clash of Clans, Clash Royale, Brawl Stars — and is known for cancelling games in '
    + 'testing rather than launching them. Tencent led an $8.6 billion acquisition of a '
    + 'controlling stake in 2016.',
  'mobile:mihoyo': 'HoYoverse, based in Shanghai, released Genshin Impact in 2020: a '
    + 'free-to-play, console-quality title self-published simultaneously worldwide, which '
    + 'demonstrated that a Chinese studio no longer required a Western publishing partner.',
  'mobile:niantic': 'Niantic was spun out of Google in 2015 and released Pokémon GO in 2016. '
    + 'The game reached 500 million downloads within two months and has since taken over $8 '
    + 'billion. Scopely acquired Niantic\'s games business in 2025.',
  'mobile:zynga': 'Zynga defined the Facebook social-games era with FarmVille in 2009 before '
    + 'transitioning to mobile. Take-Two Interactive acquired it in 2022 in a deal announced at '
    + '$12.7 billion.',
  'mobile:nokia': 'Covers the pre-smartphone era: Snake, preloaded on the Nokia 6110 in 1997 '
    + 'and later on hundreds of millions of handsets, and the Java ME, BREW and i-mode catalogues '
    + 'sold through carrier portals. At its peak this was a $3–4 billion business, and the App '
    + 'Store erased it in about four years.',
  'mobile:other': 'Several thousand publishers, including the entire hypercasual sector and the '
    + 'third-party Android stores that dominate distribution inside China. Mobile is the least '
    + 'concentrated segment in gaming: even after naming the nineteen largest publishers, '
    + 'roughly half of all spending remains in this band.',

  // ---------------------------------------------------------------- arcade
  'arcade:atari': 'Atari created the commercial arcade video game business with Pong in 1972 '
    + 'and produced many of the defining titles of the golden age, including Asteroids, '
    + 'Centipede and Missile Command.',
  'arcade:taito': 'Taito, founded in Tokyo in 1953, released Space Invaders in 1978. The game '
    + 'is estimated to have taken around $2 billion in coin drop and roughly tripled the size '
    + 'of the Japanese arcade market on its own.',
  'arcade:namco': 'Namco released Pac-Man in 1980, which sold approximately 100,000 cabinets in '
    + 'the United States alone in its first year. Now Bandai Namco, it continues to operate one '
    + 'of the largest arcade chains in Japan.',
  'arcade:sega': 'Sega began as a manufacturer of coin-operated amusement machines for US '
    + 'military bases in Japan. Its Model 2 and Model 3 arcade boards kept coin-op hardware '
    + 'visibly ahead of home consoles until roughly 1999, after which the gap closed and the '
    + 'business contracted sharply.',
  'arcade:nintendo': 'Nintendo\'s arcade business was brief but decisive: Donkey Kong (1981) '
    + 'was created to convert 2,000 unsold Radar Scope cabinets and rescued Nintendo of America '
    + 'from failure. Nintendo left the arcade business in the early 1990s.',
  'arcade:midway': 'Midway, later merged with Bally and Williams, licensed Space Invaders and '
    + 'Pac-Man for the United States and developed Defender, Mortal Kombat and NBA Jam. The '
    + 'last of these is estimated to have taken around $1 billion in its first year.',
  'arcade:konami': 'Konami produced Frogger, Gradius and the Teenage Mutant Ninja Turtles '
    + 'cabinets, and then in 1998 Dance Dance Revolution, which sustained Japanese arcades by '
    + 'making them a place to be watched rather than merely to play.',
  'arcade:capcom': 'Capcom released Street Fighter II in 1991, the highest-grossing arcade game '
    + 'ever produced, with lifetime coin drop estimated above $10.6 billion across its '
    + 'revisions. It also created the competitive fighting-game community as an organised scene.',
  'arcade:snk': 'SNK\'s Neo Geo MVS, introduced in 1990, allowed operators to stock several '
    + 'games in a single cabinet and swap them cheaply — an unusually operator-friendly design '
    + 'that kept the platform commercially viable for over a decade.',
  'arcade:other': 'Data East, Irem, Jaleco, Nichibutsu, Technos, Atari Games after 1985, and '
    + 'the modern redemption and prize-machine operators that make up most Western arcade floor '
    + 'space today.',

  // ---------------------------------------------------------------- vr / cloud
  'vr:meta': 'Meta acquired Oculus in 2014 for $2 billion, two years before the Rift shipped. '
    + 'The standalone Quest line, from 2019, is the only VR platform to have sold in the tens '
    + 'of millions. Cumulative Quest store content revenue passed $3 billion in early 2025.',
  'vr:sony': 'Sony released PlayStation VR in 2016 into an installed base of more than 100 '
    + 'million PS4s, selling around 5 million units, and PSVR2 in 2023.',
  'vr:valve': 'Valve released the Index headset in 2019 and Half-Life: Alyx in 2020 — still the '
    + 'clearest example of a VR title driving hardware sales.',
  'vr:htc': 'HTC co-developed the Vive with Valve and has since repositioned the line towards '
    + 'enterprise and training customers.',
  'vr:apple': 'Apple released the Vision Pro in 2024 at $3,499, marketing it as a spatial '
    + 'computer rather than a games device. Its games catalogue remains small.',
  'vr:bytedance': 'Pico, owned by ByteDance, is the principal standalone VR platform inside '
    + 'China, where Meta does not operate.',
  'vr:other': 'Samsung Gear VR and Google Cardboard and Daydream — enormous in units shipped, '
    + 'negligible in revenue — along with Windows Mixed Reality, Pimax, Varjo and the '
    + 'location-based VR arcades.',
  'cloud:microsoft': 'Xbox Cloud Gaming is bundled into Game Pass Ultimate rather than sold '
    + 'separately, so any revenue figure for it is an allocation rather than a reported line '
    + 'item.',
  'cloud:sony': 'Sony acquired Gaikai in 2012 for $380 million and OnLive\'s patents in 2015. '
    + 'PlayStation Now was the highest-earning cloud service in the world as late as 2021, '
    + 'largely for want of competitors at scale.',
  'cloud:nvidia': 'GeForce Now is the only major service that streams games the player already '
    + 'owns on other storefronts, rather than licensing its own catalogue.',
  'cloud:google': 'Stadia launched in November 2019, stopped funding first-party development in '
    + 'February 2021, and closed on 18 January 2023. Google refunded every hardware and software '
    + 'purchase.',
  'cloud:amazon': 'Amazon Luna, launched in 2020, is structured as a set of subscription '
    + 'channels rather than a single catalogue.',
  'cloud:other': 'Shadow, Boosteroid, Blacknut, and the large Chinese services — Tencent Start, '
    + 'Huawei Cloud Game, migu — that operate almost entirely inside China.',
};

export const REGION_NOTES = {
  na: 'The United States and Canada. The largest single console market in the world and the '
    + 'origin of the industry, but no longer the largest games market overall — it was overtaken '
    + 'by Asia-Pacific during the 2010s. North America over-indexes heavily on console and on '
    + 'Xbox in particular, and under-indexes on PC free-to-play relative to Asia.',

  eu: 'The European Union, United Kingdom, Russia and Türkiye, following Newzoo\'s regional '
    + 'definition. Europe was a home-computer market before it was a console market: the ZX '
    + 'Spectrum, Commodore 64 and Amstrad CPC gave the UK, France, Germany and Spain a mass '
    + 'software business in the mid-1980s that US retail tracking barely recorded. PlayStation '
    + 'has consistently held a larger share here than in North America.',

  jp: 'Japan invented most of the industry\'s durable forms — the arcade boom, the licensed '
    + 'cartridge model, the handheld, and mobile gaming through i-mode — and remains the third '
    + 'or fourth largest market despite a population smaller than that of several individual '
    + 'competitors. It is the only major market where arcades remained a multi-billion-dollar '
    + 'business into the 2010s, where handhelds outsold home consoles for long stretches, and '
    + 'where Xbox has never established a meaningful presence.',

  cn: 'China is the largest single national games market, at roughly $45 billion in 2024 '
    + 'according to the CNG/Game Publishing Committee. Its shape is unlike anywhere else: home '
    + 'consoles were banned from 2000 to 2015, so the market developed around PC internet cafés '
    + 'and then mobile, and console spending remains a small fraction of the total. Publishing '
    + 'requires a government-issued licence, and freezes on new licences in 2018 and 2021–22 '
    + 'are visible in the revenue record.',

  apac: 'Asia-Pacific excluding Japan and China: South Korea, Taiwan, South-East Asia, India '
    + 'and Australia. South Korea is the anchor — it commercialised free-to-play and the PC '
    + 'bang, and its studios exported the item-shop model worldwide. South-East Asia and India '
    + 'are among the fastest-growing markets by players, though spending per player remains '
    + 'far below Western levels, which is why mobile free-to-play dominates there.',

  latam: 'Brazil, Mexico and the rest of Central and South America. Brazil alone is over half '
    + 'the region. High hardware import duties historically suppressed console sales — the Sega '
    + 'Master System remained in production locally by Tectoy into the 2010s, long after it was '
    + 'discontinued everywhere else — and the region skews strongly towards mobile and towards '
    + 'free-to-play PC titles.',

  mea: 'The Middle East and Africa. The fastest-growing region in percentage terms and the '
    + 'smallest in absolute revenue. Growth is driven by mobile internet access and a young '
    + 'population; Saudi Arabia has also become a significant industry investor through Savvy '
    + 'Games Group and the Public Investment Fund. Sub-Saharan Africa remains a small fraction '
    + 'of the regional total.',
};
