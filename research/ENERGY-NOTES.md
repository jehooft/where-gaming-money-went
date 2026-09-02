# Research notes — World electricity generation by source, 1900–2025

This is the sourcing record for tab 02 of the application.

**The important structural difference from the gaming half of this project: almost nothing
here is modelled.** Electricity generation is one of the best-documented statistical series
in existence. Rather than reconstruct it, this tab ingests published datasets verbatim and
commits a trimmed copy so every number on screen can be traced back to a source file. The
only derived quantity is the carbon series, which is generation multiplied by a published
emission factor.

---

## 1. Generation data

### Primary source

**Our World in Data, _Electricity production by source_.**
<https://ourworldindata.org/grapher/electricity-production-by-source>
Downloaded as `?csvType=full`. Licensed CC BY 4.0.

OWID's series is itself a merge of:
- **Ember**, *Yearly Electricity Data* — the modern spine, country-level, 2000 onward
- **Energy Institute** (formerly BP), *Statistical Review of World Energy* — 1965 onward
- historical estimates that carry the **World** series back to **1900**

Columns used: Coal, Gas, Nuclear, Hydropower, Solar, Oil, Wind, Bioenergy, Other renewables.
All in TWh.

Trimmed to the 22 entities in `data/energy-sources.mjs` and committed as
`data/source/electricity-by-source.csv` (1,429 rows) by `data/stage-energy-sources.mjs`.

### Coverage, and an important subtlety

The upstream file carries **hydro, nuclear and renewables back to 1965** for most countries
but **fossil fuels only from 1985**. Charting the full available range per country would
therefore show Germany in 1970 as nuclear and hydro alone — implying a spotlessly clean grid
that never existed.

The build defines an entity's coverage as **the range over which a complete fuel mix exists**,
and blanks anything earlier. The resulting coverage is:

| Entity | Coverage |
|---|---|
| World | **1900–2025** |
| United Kingdom | **1920–2025** |
| Czechia, Greece, Norway | 1990–2025 |
| everything else | 1985–2025 |

Only the World and the United Kingdom genuinely have a century of data behind them; the app
clamps the year slider per entity rather than pretending otherwise.

### Cross-checks against the published record

- World total generation, 2024: **30,930 TWh** in this dataset. Ember reports world generation
  of roughly 30,900 TWh for 2024.
- World coal, 2024: 10,539 TWh; gas 6,883; hydro 4,434; nuclear 2,777; wind 2,510; solar 2,143.
- World, 1900: 6.4 TWh total, roughly 41% of it hydroelectric.

### Sources considered and rejected

- **Ember's own CSV** (`yearly_full_release_long_format.csv`) — the direct download returned an
  HTML page rather than the file. OWID republishes the same Ember data, so nothing is lost.
- **US EIA Monthly Energy Review Table 7.2b** — genuinely excellent US data by fuel back to
  **1949**, downloaded to `research/sources/energy/eia_t72b.csv`. Not used in the end, because
  mixing a US-only definition (net generation, electric power sector) into a chart otherwise
  built on one consistent worldwide definition would make the United States non-comparable with
  every other entity. It is kept in the research folder as a cross-check.
- **UK DUKES "Electricity capacity and generation from 1920"**
  (`uk_electricity_since_1920.xlsx`, sheet *Estimated Historical Generation*) — official UK
  data by fuel from 1920. Also not used directly, for the same comparability reason; OWID
  already carries the UK back to 1920. Retained as a cross-check. Note DUKES' own caveat:
  "generation by fuel was not recorded in DUKES prior to 1996", so its pre-1996 series is
  itself estimated.
- **"The rise and stall of world electricity efficiency: 1900–2017"** (MPRA 112530) — confirms
  the provenance of long-run world electricity data (Etemad et al. for 1900–1970, IEA
  thereafter) but publishes its results as figures, not extractable tables.

---

## 2. Sub-fuel detail — the coal-rank question

The brief asked for coal to open into lignite, anthracite and bituminous. That detail exists,
but **not worldwide**: no global agency publishes electricity generation broken down by coal
rank. The IEA's *Coal Information* is the closest and is paywalled.

**Eurostat does publish it**, for the EU and its member states:

- Dataset `nrg_bal_peh` — *Production of electricity and derived heat by type of fuel*
- Indicator `GEP` (gross electricity production), unit GWh, 1990–2024
- <https://ec.europa.eu/eurostat/databrowser/view/nrg_bal_peh>
- © European Union; reuse permitted with attribution

Product codes used:

| Code | Fuel | Parent |
|---|---|---|
| C0220 | Lignite | Coal |
| C0129 | Other bituminous coal | Coal |
| C0210 | Sub-bituminous coal | Coal |
| C0121 | Coking coal | Coal |
| C0110 | Anthracite | Coal |
| C0350-0370 | Coke & manufactured gases | Coal |
| O4680 | Fuel oil | Oil |
| O4671XR5220B | Gas oil & diesel | Oil |
| O4694 | Petroleum coke | Oil |
| O4610 | Refinery gas | Oil |
| O4699 | Other oil products | Oil |
| RA420 | Solar photovoltaic | Solar |
| RA410 | Solar thermal (CSP) | Solar |
| R5110-5150_W6000RI | Primary solid biofuels | Bioenergy |
| R5300 | Biogases | Bioenergy |
| W6210 | Renewable municipal waste | Bioenergy |
| RA200 | Geothermal | Other renewables |
| RA500 | Tide, wave, ocean | Other renewables |

Committed as `data/source/eurostat-subfuels.csv` (2,520 rows).

**Consequence, stated plainly in the app:** coal opens into its ranks for the European Union,
Germany, France, Poland, Czechia, Spain, Italy, the Netherlands and Greece. It does **not**
open for the World, the United States, China, India or anywhere else, because that split is
not measured there. The app disables the control rather than inventing a number.

### Reconciling two sources

Eurostat and OWID disagree slightly by construction — gross versus net production, and
Eurostat's solid-fuel aggregate includes derived gases. The build applies Eurostat's **shares**
to OWID's **level**, so the sub-bands always sum exactly to the parent fuel. Verified for
Germany: parent and sub-band sum agree to within 0.001 TWh in every year.

Because Eurostat's detail starts in 1990 but the parent series starts in 1985, each fuel also
carries a **"type not reported"** band holding whatever the detailed return does not account
for. Without it, opening coal for Germany would make 1985–89 vanish from the chart.

---

## 3. Carbon intensity

### Lifecycle basis — the default

**IPCC AR5, Working Group III, Annex III, Table A.III.2**, *Emissions of Selected Electricity
Supply Technologies*. Read directly from the published PDF
(<https://www.ipcc.ch/site/assets/uploads/2018/02/ipcc_wg3_ar5_annex-iii.pdf>), not from a
secondary summary. Lifecycle emissions including albedo effect, gCO₂eq/kWh, Min / Median / Max:

| Technology | Min | **Median** | Max |
|---|---|---|---|
| Coal — PC | 740 | **820** | 910 |
| Gas — Combined Cycle | 410 | **490** | 650 |
| Biomass — cofiring | 620 | **740** | 890 |
| Biomass — dedicated | 130 | **230** | 420 |
| Geothermal | 6.0 | **38** | 79 |
| Hydropower | 1.0 | **24** | 2200 |
| Nuclear | 3.7 | **12** | 110 |
| Concentrated Solar Power | 8.8 | **27** | 63 |
| Solar PV — rooftop | 26 | **41** | 60 |
| Solar PV — utility | 18 | **48** | 180 |
| Wind onshore | 7.0 | **11** | 56 |
| Wind offshore | 8.0 | **12** | 35 |

**Oil is not in this table.** AR5 has no oil-fired row. The value used (810 gCO₂eq/kWh) is
derived from the IPCC 2006 Guidelines default factor for heavy fuel oil (77.4 tCO₂/TJ) at 38%
plant efficiency — 77.4 ÷ 0.38 × 3.6 = 733 gCO₂/kWh direct, plus roughly 10% upstream. Every
such derived factor is flagged `derived: true` in `data/energy-sources.mjs` and the app says so
in the detail panel.

**Lignite** is likewise absent — AR5 gives a single "Coal — PC" row. UNECE's *Life Cycle
Assessment of Electricity Generation Options* (2021) reports direct CO₂ of 849 gCO₂/kWh for
pulverised lignite against 676 for pulverised hard coal, a ratio of 1.256, which is applied to
the AR5 coal median.

### Combustion basis — and a mistake this process caught

The second basis is combustion-only, matching national greenhouse-gas inventories.

The first attempt used the IPCC AR5 **direct emissions** column (coal 760, gas 370). The
resulting carbon intensity came out **about 22% below** OWID's published `carbon_intensity_elec`
for essentially every country and every year — a systematic bias, not noise. The cause: that
column describes a *modern reference plant*, while the operating global fleet is older and less
efficient.

Rather than guess a correction, the factors were **fitted by ordinary least squares** across all
672 published country-year intensities in the OWID energy dataset, solving

> Σ<sub>fuel</sub> (generation<sub>fuel</sub> × factor<sub>fuel</sub>) = published intensity × total generation

for coal, oil, gas and bioenergy, with zero-carbon sources pinned at zero:

| Fuel | Fitted direct factor |
|---|---|
| Coal | **931** gCO₂/kWh |
| Oil | **773** |
| Gas | **593** |
| Bioenergy | **−26** (i.e. indistinguishable from zero) |

These land inside independently published fleet-average ranges, and the bioenergy result of
approximately zero independently confirms that the published series treats biogenic carbon as
neutral — which is what the accounting convention says it should.

### Validation

`node data/build-energy.mjs` recomputes intensity from the fitted factors and compares it to
OWID's published series at 2000, 2010, 2020 and 2023 for all 22 entities. A check passes on
either a 20% relative or a 30 gCO₂/kWh absolute agreement — the absolute test exists because a
percentage is meaningless near zero (Norway's grid is ~98% hydro, so a 24 g gap reads as −92%).

**81 of 88 checks pass.** World agrees to 0.0%; the United States, China, India, Germany, France
and Poland all agree within 5%.

The seven that fail, and why:

| Entity | Gap | Explanation |
|---|---|---|
| Netherlands, 4 years | +20 to +29% (+55 to +111 g) | Heavy use of combined heat and power. A CHP plant's fuel is split between electricity and heat in national accounts; a single per-kWh electricity factor over-attributes it. |
| Brazil, 2020 & 2023 | −25 to −35% (−33 g) | Grid is ~80% hydro. Small absolute gap, unstable ratio. |
| Canada, 2023 | −21% (−37 g) | Same — predominantly hydro and nuclear. |

These are listed rather than tuned away. Fitting per-country factors would make every check
pass and would mean nothing.

### Caveat on the carbon view

Multiplying generation by a single global factor per fuel is a deliberate simplification. A
2024 Chinese ultra-supercritical coal unit and a 1970s subcritical unit differ by well over 20%
per kWh, and this chart treats them identically. The carbon view is right for comparing
*fuels*; it is not a national emissions inventory.

---

## 4. Known limitations

- **Wind is not split into onshore and offshore.** Eurostat's `nrg_bal_peh` has a single wind
  code (RA300). IRENA publishes the split for capacity, not generation, so it was left out
  rather than approximated.
- **Coal ranks are EU-only**, as described above. This is the single biggest gap against the
  original brief and it is a limit of the published statistics, not of effort.
- **Pre-1965 data exists only for the World and the United Kingdom.**
- **Emission factors are constant over time.** Real fleet efficiency has improved substantially
  since 1900, so the carbon view slightly understates historical emissions and overstates
  modern ones.
- **Bioenergy is counted as carbon-neutral at the stack** on the combustion basis, following
  the standard convention. This is contested, and the lifecycle basis (230 gCO₂eq/kWh) is the
  better one to look at if that convention concerns you.
- Generation is not consumption: transmission losses, own use and net imports are excluded, so
  a country's bands do not equal what its population consumed.

---

## 5. Reproducing the data

```bash
# 1. download the upstream files (git-ignored, ~10 MB)
mkdir -p research/sources/energy && cd research/sources/energy
curl -L -o owid_elec_by_source.csv \
  "https://ourworldindata.org/grapher/electricity-production-by-source.csv?csvType=full"
curl -L -o owid_energy.csv \
  "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv"
curl -L -o eurostat_coalrank.json \
  "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_bal_peh?format=JSON&lang=EN&nrg_bal=GEP&unit=GWH&geo=EU27_2020&geo=DE&geo=PL&geo=CZ&geo=FR&geo=ES&geo=IT&geo=NL&geo=EL&geo=BG&geo=RO&siec=C0110&siec=C0121&siec=C0129&siec=C0210&siec=C0220&siec=O4000XBIO&siec=G3000&siec=N900H&siec=RA100&siec=RA200&siec=RA300&siec=RA400&siec=RA500&siec=R5110-5150_W6000RI&siec=TOTAL"

# 2. trim them into the committed CSVs
node data/stage-energy-sources.mjs

# 3. build, with validation
node data/build-energy.mjs
```

Step 1 is only needed to refresh the data; `data/source/*.csv` is committed, so steps 2–3 work
offline from a clean clone.
