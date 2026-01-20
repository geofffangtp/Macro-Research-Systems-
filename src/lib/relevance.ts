// Topic Classification and Relevance Scoring for Macro Research
// Prioritizes market-moving content over noise

export type TopicCategory =
  | 'MACRO_DATA'      // Economic releases, Fed, central banks
  | 'MARKETS'         // Equities, credit, currencies, commodities
  | 'POLICY_MARKET'   // Tariffs, regulation with clear market impact
  | 'POLICY_OTHER'    // Domestic policy without clear market impact
  | 'GEOPOLITICAL'    // Wars, international relations affecting markets
  | 'CORPORATE'       // Earnings, M&A, company news
  | 'POLITICAL'       // Elections, campaigns, domestic politics
  | 'OTHER';          // Everything else

export interface ScoredContent {
  title?: string;
  content: string;
  source: string;
  url?: string;
  category: TopicCategory;
  relevanceScore: number;
  isBreaking: boolean;
}

// ============================================
// Category Keywords
// ============================================

const CATEGORY_KEYWORDS: Record<TopicCategory, string[]> = {
  MACRO_DATA: [
    'fed', 'federal reserve', 'fomc', 'powell', 'interest rate', 'rate cut', 'rate hike',
    'inflation', 'cpi', 'pce', 'core inflation', 'deflation', 'disinflation',
    'gdp', 'growth', 'recession', 'slowdown', 'contraction', 'expansion',
    'employment', 'jobs report', 'nfp', 'payrolls', 'unemployment', 'jobless claims',
    'ism', 'pmi', 'manufacturing', 'services',
    'retail sales', 'consumer spending', 'consumer confidence',
    'central bank', 'boj', 'ecb', 'pboc', 'boe', 'rba', 'snb',
    'monetary policy', 'quantitative', 'balance sheet', 'taper',
    'housing starts', 'building permits', 'existing home sales',
  ],

  MARKETS: [
    'stock', 'equities', 's&p', 'dow', 'nasdaq', 'russell',
    'bond', 'treasury', 'treasuries', 'yield', 'yields', 'credit spread', 'high yield',
    'vix', 'volatility', 'implied vol',
    'dollar', 'euro', 'yen', 'yuan', 'currency', 'forex', 'fx', 'dxy',
    'oil', 'crude', 'wti', 'brent', 'gold', 'copper', 'commodities', 'silver',
    'futures', 'options', 'derivatives',
    'rally', 'selloff', 'correction', 'bear market', 'bull market',
    'support', 'resistance', 'breakout', 'breakdown',
    'risk-off', 'risk-on', 'flight to quality',
  ],

  POLICY_MARKET: [
    'tariff', 'tariffs', 'trade war', 'trade deal', 'import tax', 'export ban',
    'sanctions', 'embargo', 'trade policy', 'trade talks',
    'regulation', 'sec', 'cftc', 'banking regulation', 'basel',
    'tax', 'taxes', 'fiscal', 'deficit', 'debt ceiling', 'government shutdown',
    'antitrust', 'breakup', 'merger blocked',
    'stimulus', 'fiscal stimulus', 'infrastructure bill',
    'crypto regulation', 'bitcoin etf',
  ],

  GEOPOLITICAL: [
    'war', 'military', 'invasion', 'conflict', 'attack',
    'nato', 'alliance', 'treaty',
    'china', 'taiwan', 'south china sea',
    'russia', 'ukraine', 'putin',
    'middle east', 'iran', 'israel', 'saudi',
    'north korea', 'nuclear',
    'oil supply', 'strait', 'shipping lane',
    'coup', 'revolution', 'regime change',
  ],

  CORPORATE: [
    'earnings', 'revenue', 'profit', 'guidance', 'eps', 'beat', 'miss',
    'ipo', 'merger', 'acquisition', 'buyout', 'takeover', 'deal',
    'layoffs', 'restructuring', 'cost cutting',
    'ceo', 'management', 'board',
    'dividend', 'buyback', 'share repurchase',
    'bankruptcy', 'default', 'credit downgrade',
  ],

  POLITICAL: [
    'election', 'campaign', 'poll', 'polls', 'vote', 'voting', 'ballot',
    'congress', 'senate', 'house', 'speaker', 'majority',
    'republican', 'democrat', 'gop', 'partisan', 'bipartisan',
    'immigration', 'border', 'deportation',
    'impeach', 'investigation', 'subpoena',
    'supreme court', 'judicial',
  ],

  POLICY_OTHER: [
    '401k', '401(k)', 'retirement', 'social security', 'pension',
    'healthcare', 'medicare', 'medicaid', 'obamacare', 'aca',
    'education', 'student loan', 'college',
    'housing policy', 'rent control', 'zoning',
    'minimum wage', 'labor law',
    'climate policy', 'green new deal', 'carbon tax',
  ],

  OTHER: [],
};

// ============================================
// Breaking/Urgency Keywords
// ============================================

const BREAKING_KEYWORDS = [
  'breaking', 'just in', 'alert', 'urgent', 'developing',
  'announces', 'declares', 'unveils', 'confirms',
  'crash', 'crashes', 'surge', 'surges', 'plunge', 'plunges', 'spike', 'spikes',
  'emergency', 'crisis', 'shock', 'collapse',
  'halted', 'suspended', 'intervention',
];

// ============================================
// Category Weights
// ============================================

const CATEGORY_WEIGHTS: Record<TopicCategory, number> = {
  MACRO_DATA: 10,      // Highest priority - Fed, economic data
  MARKETS: 9,          // Direct market moves
  POLICY_MARKET: 8,    // Tariffs, trade = high priority
  GEOPOLITICAL: 7,     // Can move markets significantly
  CORPORATE: 5,        // Important but more narrow
  POLICY_OTHER: 3,     // 401(k) housing = lower priority
  POLITICAL: 2,        // Pure politics = low priority
  OTHER: 1,            // Default
};

// ============================================
// Classification Functions
// ============================================

export function classifyContent(title: string | undefined, content: string): TopicCategory {
  const text = `${title || ''} ${content}`.toLowerCase();

  const scores: Record<TopicCategory, number> = {
    MACRO_DATA: 0,
    MARKETS: 0,
    POLICY_MARKET: 0,
    GEOPOLITICAL: 0,
    CORPORATE: 0,
    POLITICAL: 0,
    POLICY_OTHER: 0,
    OTHER: 0,
  };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[category as TopicCategory] += 1;
      }
    }
  }

  // Find highest scoring category
  let maxCategory: TopicCategory = 'OTHER';
  let maxScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxCategory = category as TopicCategory;
    }
  }

  return maxCategory;
}

export function scoreRelevance(
  title: string | undefined,
  content: string,
  category: TopicCategory
): { score: number; isBreaking: boolean } {
  const text = `${title || ''} ${content}`.toLowerCase();

  // Base score from category
  let score = CATEGORY_WEIGHTS[category];

  // Breaking news bonus
  let isBreaking = false;
  for (const keyword of BREAKING_KEYWORDS) {
    if (text.includes(keyword)) {
      score += 5;
      isBreaking = true;
      break;
    }
  }

  // Title keywords get extra weight (more prominent)
  const titleLower = (title || '').toLowerCase();
  for (const keyword of [...CATEGORY_KEYWORDS.MACRO_DATA, ...CATEGORY_KEYWORDS.MARKETS]) {
    if (titleLower.includes(keyword)) {
      score += 1; // Bonus for keywords in title
    }
  }

  return { score, isBreaking };
}

// ============================================
// Ranking Functions
// ============================================

export function rankContent(items: Array<{
  title?: string;
  content: string;
  source: string;
  url?: string;
}>): ScoredContent[] {
  return items
    .map((item) => {
      const category = classifyContent(item.title, item.content);
      const { score, isBreaking } = scoreRelevance(item.title, item.content, category);

      return {
        ...item,
        category,
        relevanceScore: score,
        isBreaking,
      };
    })
    .sort((a, b) => {
      // Breaking news first
      if (a.isBreaking && !b.isBreaking) return -1;
      if (!a.isBreaking && b.isBreaking) return 1;
      // Then by score
      return b.relevanceScore - a.relevanceScore;
    });
}

export function getTopContent(items: ScoredContent[], limit: number = 15): ScoredContent[] {
  // Already sorted by rankContent
  return items.slice(0, limit);
}

// ============================================
// Filtering Helpers
// ============================================

// Filter out low-relevance content
export function filterLowRelevance(items: ScoredContent[], minScore: number = 3): ScoredContent[] {
  return items.filter((item) => item.relevanceScore >= minScore);
}

// Get only market-moving content (MACRO_DATA, MARKETS, POLICY_MARKET, GEOPOLITICAL)
export function getMarketMovingContent(items: ScoredContent[]): ScoredContent[] {
  const marketCategories: TopicCategory[] = ['MACRO_DATA', 'MARKETS', 'POLICY_MARKET', 'GEOPOLITICAL'];
  return items.filter((item) => marketCategories.includes(item.category));
}

// Debug logging helper
export function logContentRanking(items: ScoredContent[], label: string = 'Content ranking'): void {
  console.log(`\n${label}:`);
  items.slice(0, 20).forEach((item, i) => {
    const breakingTag = item.isBreaking ? ' [BREAKING]' : '';
    const displayTitle = item.title || item.content.slice(0, 60);
    console.log(`  ${i + 1}. [${item.relevanceScore}] ${item.category}${breakingTag}: ${displayTitle.slice(0, 60)}`);
  });
}

// ============================================
// Category Labels for UI
// ============================================

export const CATEGORY_LABELS: Record<TopicCategory, string> = {
  MACRO_DATA: 'Economic Data',
  MARKETS: 'Markets',
  POLICY_MARKET: 'Market Policy',
  GEOPOLITICAL: 'Geopolitical',
  CORPORATE: 'Corporate',
  POLITICAL: 'Politics',
  POLICY_OTHER: 'Other Policy',
  OTHER: 'Other',
};

export const CATEGORY_COLORS: Record<TopicCategory, string> = {
  MACRO_DATA: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  MARKETS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  POLICY_MARKET: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  GEOPOLITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  CORPORATE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  POLITICAL: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  POLICY_OTHER: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  OTHER: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};
