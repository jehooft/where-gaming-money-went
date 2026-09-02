// Annotated milestones for the electricity chart. Every entry is a matter of
// record — a date, a plant, a treaty or a published statistic. Where a figure is
// an estimate it is worded as one.
//
// fuel  : which band the leader line points at
// side  : 'top' or 'bottom'
// tier  : 1 = always shown, 2 = wider viewports, 3 = zoomed in only

export const ENERGY_EVENTS = [
  {
    year: 1900, fuel: 'hydro', side: 'bottom', tier: 2,
    title: 'The grid begins',
    text: 'World electricity generation is around 6 TWh — less than a single large power station '
      + 'produces today. Roughly 40% of it is hydroelectric; the rest is coal-fired.',
  },
  {
    year: 1913, fuel: 'coal', side: 'top', tier: 3,
    title: 'Coal takes the lead',
    text: 'Thermal generation pulls decisively ahead of hydropower as central coal stations grow '
      + 'large enough to serve whole cities rather than single districts.',
  },
  {
    year: 1936, fuel: 'hydro', side: 'bottom', tier: 2,
    title: 'Hoover Dam',
    text: 'Completed on the Colorado River, and for two years the largest power station in the '
      + 'world. The 1930s are the decade of state-financed hydro at scale, in the United States '
      + 'and the Soviet Union alike.',
  },
  {
    year: 1954, fuel: 'nuclear', side: 'top', tier: 1,
    title: 'First nuclear electricity on a grid',
    text: 'The Obninsk reactor near Moscow supplies 5 MW to the Soviet grid in June 1954. '
      + 'Britain\'s Calder Hall follows in 1956 as the first station to deliver nuclear power '
      + 'commercially at scale.',
  },
  {
    year: 1965, fuel: 'oil', side: 'bottom', tier: 2,
    title: 'The oil-fired decade',
    text: 'Cheap crude makes oil a mainstream generating fuel. Oil-fired output climbs to a peak '
      + 'in the mid-1970s, when it supplies around a fifth of world electricity.',
  },
  {
    year: 1973, fuel: 'oil', side: 'bottom', tier: 1,
    title: 'The oil shock ends oil power',
    text: 'The 1973 embargo and the 1979 price spike make oil-fired generation uneconomic. Its '
      + 'share collapses over the following two decades and never recovers; today it is under 2%.',
  },
  {
    year: 1974, fuel: 'nuclear', side: 'top', tier: 2,
    title: 'France commits to nuclear',
    text: 'The Messmer plan responds to the oil shock by ordering a standardised reactor fleet. '
      + 'France ends up deriving a larger share of its electricity from nuclear power than any '
      + 'other country.',
  },
  {
    year: 1979, fuel: 'nuclear', side: 'top', tier: 2,
    title: 'Three Mile Island',
    text: 'A partial meltdown in Pennsylvania. No new US reactor ordered after 1978 was completed '
      + 'for more than thirty years, and the growth curve of world nuclear output bends here.',
  },
  {
    year: 1986, fuel: 'nuclear', side: 'top', tier: 1,
    title: 'Chernobyl',
    text: 'The accident at Reactor 4 halts nuclear expansion across much of Europe. Global nuclear '
      + 'output continues rising into the 1990s on plants already under construction, then '
      + 'plateaus and has stayed roughly flat ever since.',
  },
  {
    year: 1991, fuel: 'gas', side: 'bottom', tier: 1,
    title: 'The dash for gas',
    text: 'Combined-cycle gas turbines reach around 60% thermal efficiency against roughly 40% for '
      + 'conventional coal plant. Cheap turbines and liberalised markets make gas the default new '
      + 'build across Europe and North America.',
  },
  {
    year: 2001, fuel: 'coal', side: 'top', tier: 1,
    title: 'China\'s coal build-out',
    text: 'China joins the WTO and its electricity demand roughly quintuples over the next two '
      + 'decades. Almost all of the growth in world coal generation this century happens in Asia; '
      + 'coal output in Europe and North America falls over the same period.',
  },
  {
    year: 2011, fuel: 'nuclear', side: 'top', tier: 1,
    title: 'Fukushima',
    text: 'Japan idles its entire nuclear fleet after the March 2011 accident and replaces the '
      + 'output almost entirely with imported gas and coal. Germany brings forward its own '
      + 'nuclear phase-out, completed in April 2023.',
  },
  {
    year: 2015, fuel: 'solar', side: 'bottom', tier: 2,
    title: 'Solar becomes cheap',
    text: 'Module prices having fallen by roughly 90% over the previous decade, solar moves from '
      + 'subsidised niche to the cheapest source of new electricity in much of the world. World '
      + 'solar output passes 1,000 TWh in 2021 and 2,000 TWh in 2024.',
  },
  {
    year: 2021, fuel: 'wind', side: 'bottom', tier: 1,
    title: 'Wind and solar pass a tenth of world electricity',
    text: 'Together they supply more than 10% of global generation for the first time. Both are '
      + 'now adding more output each year than any other source, though coal generation has not '
      + 'yet begun to fall in absolute terms.',
  },
  {
    year: 2024, fuel: 'coal', side: 'top', tier: 2,
    title: 'Britain closes its last coal plant',
    text: 'Ratcliffe-on-Soar shuts in September 2024, ending 142 years of coal-fired generation in '
      + 'the country that started it. Coal supplied 97% of British electricity as recently as 1970.',
  },
];

// Vertical rules marking eras on the electricity chart.
export const ENERGY_ERAS = [
  { from: 1900, to: 1945, label: 'Electrification' },
  { from: 1945, to: 1973, label: 'Post-war boom' },
  { from: 1973, to: 1990, label: 'Oil shock & nuclear' },
  { from: 1990, to: 2010, label: 'Gas & liberalisation' },
  { from: 2010, to: 2026, label: 'Wind & solar' },
];
