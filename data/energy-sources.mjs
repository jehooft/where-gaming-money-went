// Electricity generation: source hierarchy, carbon-intensity factors, and the
// entity list. Unlike the gaming half of this project, almost nothing here is
// modelled — the generation numbers are ingested verbatim from published
// statistical datasets. See research/ENERGY-NOTES.md.

// ---------------------------------------------------------------------------
// Hierarchy: group -> fuel -> sub-fuel
// ---------------------------------------------------------------------------
// Groups and fuels exist for every entity. Sub-fuels only exist where a
// statistical agency actually reports them: Eurostat (nrg_bal_peh) breaks
// electricity production down to coal rank, oil product and biofuel type for EU
// countries. No comparable worldwide breakdown is published, so for the World and
// for non-EU entities the fuel bands do not subdivide. The app says so rather
// than inventing a split.

export const ENERGY_GROUPS = [
  { id: 'fossil',     label: 'Fossil fuels', color: '#8a6f5c' },
  { id: 'nuclear',    label: 'Nuclear',      color: '#c0a02c' },
  { id: 'renewables', label: 'Renewables',   color: '#2f9e6f' },
];

// `owid` maps to a column in the OWID "Electricity production by source" export.
export const ENERGY_FUELS = [
  { id: 'coal',     group: 'fossil',     label: 'Coal',             owid: 'Coal',              color: '#4a4a52' },
  { id: 'oil',      group: 'fossil',     label: 'Oil',              owid: 'Oil',               color: '#7d5c4a' },
  { id: 'gas',      group: 'fossil',     label: 'Natural gas',      owid: 'Gas',               color: '#c98b4b' },
  { id: 'nuclear',  group: 'nuclear',    label: 'Nuclear',          owid: 'Nuclear',           color: '#d4b02a' },
  { id: 'hydro',    group: 'renewables', label: 'Hydropower',       owid: 'Hydropower',        color: '#2f7fb8' },
  { id: 'wind',     group: 'renewables', label: 'Wind',             owid: 'Wind',              color: '#5ec2c2' },
  { id: 'solar',    group: 'renewables', label: 'Solar',            owid: 'Solar',             color: '#f2c14e' },
  { id: 'bio',      group: 'renewables', label: 'Bioenergy',        owid: 'Bioenergy',         color: '#7a9e4f' },
  { id: 'otherren', group: 'renewables', label: 'Other renewables', owid: 'Other renewables',  color: '#9b7fc2' },
];

// Sub-fuels, keyed by parent fuel. `siec` is the Eurostat product code in
// nrg_bal_peh (Production of electricity and derived heat by type of fuel).
export const ENERGY_SUBFUELS = {
  coal: [
    { id: 'coal-lignite',  label: 'Lignite (brown coal)', siec: 'C0220' },
    { id: 'coal-bitum',    label: 'Other bituminous coal', siec: 'C0129' },
    { id: 'coal-subbit',   label: 'Sub-bituminous coal',   siec: 'C0210' },
    { id: 'coal-coking',   label: 'Coking coal',           siec: 'C0121' },
    { id: 'coal-anthr',    label: 'Anthracite',            siec: 'C0110' },
    { id: 'coal-derived',  label: 'Coke & manufactured gases', siec: 'C0350-0370' },
  ],
  oil: [
    { id: 'oil-fueloil',  label: 'Fuel oil',              siec: 'O4680' },
    { id: 'oil-gasoil',   label: 'Gas oil & diesel',      siec: 'O4671XR5220B' },
    { id: 'oil-petcoke',  label: 'Petroleum coke',        siec: 'O4694' },
    { id: 'oil-refgas',   label: 'Refinery gas',          siec: 'O4610' },
    { id: 'oil-other',    label: 'Other oil products',    siec: 'O4699' },
  ],
  solar: [
    { id: 'solar-pv',      label: 'Photovoltaic',          siec: 'RA420' },
    { id: 'solar-thermal', label: 'Solar thermal (CSP)',   siec: 'RA410' },
  ],
  bio: [
    { id: 'bio-solid', label: 'Solid biofuels',            siec: 'R5110-5150_W6000RI' },
    { id: 'bio-gases', label: 'Biogases',                  siec: 'R5300' },
    { id: 'bio-waste', label: 'Renewable municipal waste', siec: 'W6210' },
  ],
  otherren: [
    { id: 'or-geo',   label: 'Geothermal',        siec: 'RA200' },
    { id: 'or-tidal', label: 'Tide, wave & ocean', siec: 'RA500' },
  ],
};

// ---------------------------------------------------------------------------
// Carbon intensity factors, gCO2-equivalent per kWh
// ---------------------------------------------------------------------------
// PRIMARY SOURCE: IPCC AR5 Working Group III, Annex III, Table A.III.2
// ("Emissions of Selected Electricity Supply Technologies"), read directly from
// the published PDF. Those rows give Min / Median / Max lifecycle emissions
// including albedo effect, for currently commercially available technologies.
//
// Two fuels are NOT in that table and are marked `derived`, with the derivation
// written out so it can be checked or replaced:
//   * Oil    - AR5 has no oil-fired row. Derived from the IPCC 2006 Guidelines
//              default factor for heavy fuel oil (77.4 tCO2/TJ) at a 38% plant
//              efficiency: 77.4 / 0.38 x 3.6 = 733 gCO2/kWh direct; +~10% upstream
//              gives ~810 gCO2eq/kWh lifecycle.
//   * Lignite / hard coal - AR5 gives one "Coal - PC" row. UNECE's 2021 Life
//              Cycle Assessment of Electricity Generation Options reports direct
//              CO2 of 849 gCO2/kWh for pulverised lignite against 676 for
//              pulverised hard coal, a ratio of 1.256. That ratio is applied to
//              the AR5 coal median to place lignite above and hard coal below it.
//
// TWO BASES ARE OFFERED, because they answer different questions:
//
//   life   Lifecycle (IPCC AR5 medians). Includes construction, fuel supply chain
//          and decommissioning, so wind, solar, hydro and nuclear are non-zero.
//          This is the right basis for comparing technologies.
//
//   direct Combustion-only, fleet average. This is what national greenhouse-gas
//          inventories and Ember's published power-sector figures measure, and
//          biogenic CO2 is treated as neutral, so bioenergy is zero.
//
// The direct factors for coal, oil and gas are NOT the IPCC AR5 "direct emissions"
// column. That column describes a modern reference plant, and using it made the
// modelled intensity run about 22% below Ember's published carbon_intensity_elec
// for essentially every country and year - the operating fleet is older and less
// efficient than a new build. Instead they are FITTED by least squares across 672
// published country-year intensities (see the report printed by data/build-energy.mjs):
//
//        coal 931   oil 773   gas 593   bioenergy ~0   gCO2/kWh
//
// Those fitted values land squarely inside independently published fleet-average
// ranges, and the bioenergy result of approximately zero independently confirms
// that the published series treats biogenic carbon as neutral. Because the fit is
// derived from the same series it is checked against, the check below confirms
// internal consistency rather than being a fully independent test; the external
// validation is that the fitted numbers match published fleet averages.

export const CARBON_FACTORS = {
  //                lifecycle  min   max   direct   source
  coal:     { life: 820,  min: 740,  max: 910,  direct: 931, src: 'Lifecycle: IPCC AR5 Annex III, Coal - PC. Direct: fitted fleet average.' },
  oil:      { life: 810,  min: 650,  max: 950,  direct: 773, src: 'Lifecycle derived from IPCC 2006 default HFO factor at 38% efficiency. Direct: fitted fleet average.', derived: true },
  gas:      { life: 490,  min: 410,  max: 650,  direct: 593, src: 'Lifecycle: IPCC AR5 Annex III, Gas - Combined Cycle. Direct: fitted fleet average, above CCGT because the fleet includes open-cycle and older plant.' },
  nuclear:  { life: 12,   min: 3.7,  max: 110,  direct: 0,   src: 'IPCC AR5 Annex III, Nuclear' },
  hydro:    { life: 24,   min: 1.0,  max: 2200, direct: 0,   src: 'IPCC AR5 Annex III, Hydropower' },
  wind:     { life: 11,   min: 7.0,  max: 56,   direct: 0,   src: 'IPCC AR5 Annex III, Wind onshore' },
  solar:    { life: 45,   min: 18,   max: 180,  direct: 0,   src: 'IPCC AR5 Annex III, mean of Solar PV rooftop (41) and utility (48)' },
  bio:      { life: 230,  min: 130,  max: 420,  direct: 0,   src: 'Lifecycle: IPCC AR5 Annex III, Biomass - dedicated. Direct: zero, biogenic CO2 treated as neutral (the least-squares fit returned -26, i.e. indistinguishable from zero).' },
  otherren: { life: 38,   min: 6.0,  max: 79,   direct: 0,   src: 'IPCC AR5 Annex III, Geothermal (dominant technology in this band)' },

  // sub-fuels
  'coal-lignite': { life: 1030, min: 900, max: 1150, direct: 1170, src: 'AR5 coal median scaled by UNECE 2021 lignite/hard-coal direct ratio (1.256)', derived: true },
  'coal-bitum':   { life: 820,  min: 740, max: 910,  direct: 931, src: 'IPCC AR5 Annex III, Coal - PC' },
  'coal-subbit':  { life: 890,  min: 800, max: 990,  direct: 1010, src: 'Between hard coal and lignite; AR5 coal scaled on carbon content', derived: true },
  'coal-coking':  { life: 820,  min: 740, max: 910,  direct: 931, src: 'IPCC AR5 Annex III, Coal - PC' },
  'coal-anthr':   { life: 800,  min: 720, max: 890,  direct: 913, src: 'IPCC AR5 Annex III, Coal - PC (anthracite has the highest carbon content but also the highest heating value)' },
  'coal-derived': { life: 820,  min: 740, max: 910,  direct: 931, src: 'Inherited from coal', derived: true },

  'oil-fueloil': { life: 810, min: 650, max: 950, direct: 773, src: 'Inherited from oil', derived: true },
  'oil-gasoil':  { life: 780, min: 640, max: 900, direct: 738, src: 'IPCC 2006 default gas/diesel oil factor (74.1 tCO2/TJ) at 38% efficiency', derived: true },
  'oil-petcoke': { life: 1020, min: 900, max: 1150, direct: 975, src: 'IPCC 2006 default petroleum coke factor (97.5 tCO2/TJ) at 38% efficiency', derived: true },
  'oil-refgas':  { life: 640, min: 520, max: 780, direct: 601, src: 'IPCC 2006 default refinery gas factor (57.6 tCO2/TJ) at 38% efficiency', derived: true },
  'oil-other':   { life: 810, min: 650, max: 950, direct: 773, src: 'Inherited from oil', derived: true },

  'solar-pv':      { life: 45, min: 18,  max: 180, direct: 0, src: 'IPCC AR5 Annex III, Solar PV' },
  'solar-thermal': { life: 27, min: 8.8, max: 63,  direct: 0, src: 'IPCC AR5 Annex III, Concentrated Solar Power' },

  'bio-solid': { life: 230, min: 130, max: 420, direct: 0, src: 'IPCC AR5 Annex III, Biomass - dedicated' },
  'bio-gases': { life: 130, min: 60,  max: 300, direct: 0, src: 'Biogas is lower than solid biomass; AR5 biomass range lower half', derived: true },
  'bio-waste': { life: 230, min: 130, max: 420, direct: 0, src: 'Inherited from bioenergy', derived: true },

  'or-geo':   { life: 38, min: 6.0, max: 79, direct: 0, src: 'IPCC AR5 Annex III, Geothermal' },
  'or-tidal': { life: 17, min: 5.0, max: 40, direct: 0, src: 'No AR5 row; placed between wind offshore and hydro', derived: true },
};

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------
// `owid` is the Entity name in the OWID export; `eurostat` is the geo code in
// nrg_bal_peh where a sub-fuel breakdown is available.
export const ENERGY_ENTITIES = [
  { id: 'world',   label: 'World',          owid: 'World' },
  { id: 'eu',      label: 'European Union', owid: 'European Union (27)', eurostat: 'EU27_2020' },
  { id: 'usa',     label: 'United States',  owid: 'United States' },
  { id: 'china',   label: 'China',          owid: 'China' },
  { id: 'india',   label: 'India',          owid: 'India' },
  { id: 'uk',      label: 'United Kingdom', owid: 'United Kingdom' },
  { id: 'germany', label: 'Germany',        owid: 'Germany', eurostat: 'DE' },
  { id: 'france',  label: 'France',         owid: 'France',  eurostat: 'FR' },
  { id: 'poland',  label: 'Poland',         owid: 'Poland',  eurostat: 'PL' },
  { id: 'czechia', label: 'Czechia',        owid: 'Czechia', eurostat: 'CZ' },
  { id: 'spain',   label: 'Spain',          owid: 'Spain',   eurostat: 'ES' },
  { id: 'italy',   label: 'Italy',          owid: 'Italy',   eurostat: 'IT' },
  { id: 'nether',  label: 'Netherlands',    owid: 'Netherlands', eurostat: 'NL' },
  { id: 'greece',  label: 'Greece',         owid: 'Greece',  eurostat: 'EL' },
  { id: 'japan',   label: 'Japan',          owid: 'Japan' },
  { id: 'brazil',  label: 'Brazil',         owid: 'Brazil' },
  { id: 'canada',  label: 'Canada',         owid: 'Canada' },
  { id: 'russia',  label: 'Russia',         owid: 'Russia' },
  { id: 'safrica', label: 'South Africa',   owid: 'South Africa' },
  { id: 'norway',  label: 'Norway',         owid: 'Norway' },
  { id: 'austral', label: 'Australia',      owid: 'Australia' },
  { id: 'skorea',  label: 'South Korea',    owid: 'South Korea' },
];
