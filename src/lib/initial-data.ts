import { Source, DataRelease, Thesis } from '@/types';

export const initialSources: Omit<Source, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Tier 1: Core Signal (Always Include)
  {
    handle: 'KobeissiLetter',
    name: 'The Kobeissi Letter',
    focus: 'Data-driven macro, breaking economic news',
    style: 'Neutral, charts-heavy',
    tier: 'tier1',
    weight: 1.0,
    platform: 'twitter',
  },
  {
    handle: 'MacroAlf',
    name: 'Alfonso Peccatiello',
    focus: 'Institutional macro, credit impulse, yield curves',
    style: 'Data-driven, explains mechanisms',
    tier: 'tier1',
    weight: 1.0,
    platform: 'substack',
    rssUrl: 'https://themacrocompass.substack.com/feed',
  },
  {
    handle: 'LynAldenContact',
    name: 'Lyn Alden',
    focus: 'Fiscal dominance, liquidity, debt cycles',
    style: 'Long-form, structural analysis',
    tier: 'tier1',
    weight: 1.0,
    platform: 'substack',
    rssUrl: 'https://www.lynalden.com/feed/',
  },
  {
    handle: 'nickgerli1',
    name: 'Nick Gerli',
    focus: 'Residential housing, inventory, price-to-income',
    style: 'Bearish housing, data-heavy',
    tier: 'tier1',
    weight: 1.0,
    platform: 'twitter',
  },
  {
    handle: 'SpectatorIndex',
    name: 'The Spectator Index',
    focus: 'Geopolitical + macro headlines',
    style: 'Neutral, news aggregation',
    tier: 'tier1',
    weight: 1.0,
    platform: 'twitter',
  },
  // Tier 2: Rotate by Relevance
  {
    handle: 'EJ_Antoni',
    name: 'E.J. Antoni',
    focus: 'Labor market, inflation deep-dives',
    style: 'Data-heavy',
    tier: 'tier2',
    weight: 0.7,
    platform: 'twitter',
  },
  {
    handle: 'biaboronska',
    name: 'Bia Boronska',
    focus: 'Fed policy, labor market',
    style: 'Analytical',
    tier: 'tier2',
    weight: 0.7,
    platform: 'twitter',
  },
  {
    handle: 'JimBianco',
    name: 'Jim Bianco',
    focus: 'Macro, rates, Fed',
    style: 'Institutional perspective',
    tier: 'tier2',
    weight: 0.7,
    platform: 'twitter',
  },
  {
    handle: 'Jesse_Felder',
    name: 'Jesse Felder',
    focus: 'Contrarian value, valuation',
    style: 'Value-oriented',
    tier: 'tier2',
    weight: 0.7,
    platform: 'substack',
    rssUrl: 'https://thefelderreport.com/feed/',
  },
  {
    handle: 'LoganMohtashami',
    name: 'Logan Mohtashami',
    focus: 'Housing + labor market nexus',
    style: 'Data-focused',
    tier: 'tier2',
    weight: 0.7,
    platform: 'twitter',
  },
  // Tier 3: Contrarian/Discovery
  {
    handle: 'zerohedge',
    name: 'ZeroHedge',
    focus: 'Contrarian, market commentary',
    style: 'Sometimes conspiratorial - use with skepticism',
    tier: 'tier3',
    weight: 0.4,
    platform: 'rss',
    rssUrl: 'https://feeds.feedburner.com/zerohedge/feed',
  },
];

// FRED Series ID mapping for auto-fetch
export const FRED_SERIES_MAP: Record<string, string> = {
  'VIX': 'VIXCLS',
  'Credit Spreads (HY OAS)': 'BAMLH0A0HYM2',
  'Continuing Jobless Claims': 'CCSA',
  'Initial Jobless Claims': 'ICSA',
  'Avg Duration of Unemployment': 'UEMPMEAN',
  'Core CPI': 'CPILFESL',
  'M2 Money Supply': 'WM2NS',
  'Cass Freight Index': 'FRGSHPUSM649NCIS',
  'Copper Prices': 'PCOPPUSDM',
  '2Y Treasury': 'DGS2',
  '10Y Treasury': 'DGS10',
};

export const initialDataReleases: Omit<DataRelease, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Tier 1: Core to Thesis (Always Track)
  {
    name: 'ISM Manufacturing (New Orders vs Inventories)',
    description: 'Key indicator for inventory cycle and restocking signal',
    frequency: 'monthly',
    tier: 'tier1',
    thesisConnection: 'Inventory glut thesis - watching for restocking signal',
    // No FRED series - manual entry required
  },
  {
    name: 'Cass Freight Index',
    description: 'Ground truth of physical economy activity',
    frequency: 'monthly',
    tier: 'tier1',
    thesisConnection: 'Ground truth of physical economy',
    fredSeriesId: 'FRGSHPUSM649NCIS',
  },
  {
    name: 'Continuing Jobless Claims',
    description: 'Weekly labor market deterioration indicator',
    frequency: 'weekly',
    tier: 'tier1',
    thesisConnection: 'Labor market deterioration signal',
    fredSeriesId: 'CCSA',
  },
  {
    name: 'Initial Jobless Claims',
    description: 'Weekly initial unemployment claims',
    frequency: 'weekly',
    tier: 'tier1',
    thesisConnection: 'Labor market real-time signal',
    fredSeriesId: 'ICSA',
  },
  {
    name: 'Avg Duration of Unemployment',
    description: 'Watching for peak/rollover in unemployment duration',
    frequency: 'monthly',
    tier: 'tier1',
    thesisConnection: 'Watching for peak/rollover',
    fredSeriesId: 'UEMPMEAN',
  },
  {
    name: 'Core CPI',
    description: 'Key inflation measure excluding food and energy',
    frequency: 'monthly',
    tier: 'tier1',
    thesisConnection: 'Sticky inflation thesis',
    fredSeriesId: 'CPILFESL',
  },
  {
    name: 'Credit Spreads (HY OAS)',
    description: 'High yield option-adjusted spread',
    frequency: 'daily',
    tier: 'tier1',
    thesisConnection: 'Credit leads equities - Phase 1 washout signal',
    fredSeriesId: 'BAMLH0A0HYM2',
  },
  {
    name: 'VIX',
    description: 'CBOE Volatility Index',
    frequency: 'daily',
    tier: 'tier1',
    thesisConnection: 'Complacency gauge - watching for spike >35-40',
    fredSeriesId: 'VIXCLS',
  },
  // Tier 2: Supporting Indicators
  {
    name: 'Global Semiconductor Billings',
    description: 'Leading indicator for industrial cycle',
    frequency: 'monthly',
    tier: 'tier2',
    thesisConnection: 'Leads industrial cycle',
    // No FRED series - SIA data
  },
  {
    name: '% Stocks Above 200-DMA',
    description: 'Market breadth indicator',
    frequency: 'daily',
    tier: 'tier2',
    thesisConnection: 'Breadth confirmation',
    // No FRED series - manual/scrape
  },
  {
    name: 'Equal Weight vs Cap Weight S&P',
    description: 'Market broadening signal',
    frequency: 'daily',
    tier: 'tier2',
    thesisConnection: 'Broadening signal',
    // No FRED series - calculated from RSP/SPY
  },
  {
    name: '2Y/10Y Spread',
    description: 'Yield curve steepening indicator',
    frequency: 'daily',
    tier: 'tier2',
    thesisConnection: 'Yield curve steepening thesis',
    fredSeriesId: 'T10Y2Y', // FRED has this directly
  },
  {
    name: 'M2 Money Supply',
    description: 'Liquidity backdrop measure',
    frequency: 'weekly',
    tier: 'tier2',
    thesisConnection: 'Liquidity backdrop',
    fredSeriesId: 'WM2NS',
  },
  {
    name: 'Shiller CAPE',
    description: 'Cyclically adjusted P/E ratio',
    frequency: 'monthly',
    tier: 'tier2',
    thesisConnection: 'Valuation reset signal',
    // No FRED series - manual entry
  },
  // Tier 3: AI/Energy Nexus
  {
    name: 'Hyperscaler CapEx',
    description: 'Quarterly capital expenditure from major tech companies',
    frequency: 'quarterly',
    tier: 'tier3',
    thesisConnection: 'Tracking actual vs expected AI investment',
    // No FRED series - earnings data
  },
  {
    name: 'Grid Interconnection Queue',
    description: 'Power grid capacity for new connections',
    frequency: 'quarterly',
    tier: 'tier3',
    thesisConnection: 'Binding constraint on AI buildout',
    // No FRED series - EIA/utility data
  },
  {
    name: 'Copper Prices',
    description: 'Industrial metal proxy for AI energy nexus',
    frequency: 'monthly',
    tier: 'tier3',
    thesisConnection: 'AI energy nexus proxy',
    fredSeriesId: 'PCOPPUSDM',
  },
  {
    name: 'Nickel Prices',
    description: 'Battery and industrial metal',
    frequency: 'daily',
    tier: 'tier3',
    thesisConnection: 'Family office relevance',
    // No FRED series - use Metals.dev API
  },
];

export const initialThesis: Omit<Thesis, 'id'> = {
  name: 'Resilient Bear',
  summary:
    'Stagflationary environment with physical economy weakness masked by AI CapEx cycle. Watching for turning point signals to re-risk.',
  scenarios: [
    {
      name: 'Base Case: Stagflationary Slog',
      probability: 60,
      description: 'Slow growth, sticky inflation, falling real rates',
    },
    {
      name: 'Bear Case: Crisis',
      probability: 30,
      description: 'Concentration shock or policy error leads to significant market stress',
    },
    {
      name: 'Bull Case: Productivity Boom',
      probability: 10,
      description: 'AI-driven productivity gains lead to rapid disinflation and growth',
    },
  ],
  keyMonitors: [
    'Inventory cycle (ISM New Orders vs Inventories)',
    'Freight recovery (Cass Index)',
    'Labor market (duration of unemployment, continuing claims)',
    'Credit spreads (watching for blowout then reversal)',
    'VIX (watching for spike >35-40)',
    'Breadth (% above 200-DMA, equal weight vs cap weight)',
  ],
  turningPointSignals: [
    {
      phase: 1,
      name: 'Peak Market Stress',
      indicators: ['Credit spreads blowout', 'VIX spike >35-40', 'Valuation reset (CAPE compression)'],
      status: 'watching',
    },
    {
      phase: 2,
      name: 'Economic Inflection',
      indicators: ['Inventory turn (ISM)', 'Freight recovery', 'Semi billings inflection'],
      status: 'not_triggered',
    },
    {
      phase: 3,
      name: 'Confirmation & Broadening',
      indicators: ['Breadth improvement', 'Cyclical leadership', 'Bull steepener'],
      status: 'not_triggered',
    },
  ],
  lastUpdated: new Date().toISOString(),
};
