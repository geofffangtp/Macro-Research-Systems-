import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: ['content:encoded', 'dc:creator'],
  },
});

export interface RSSItem {
  title: string;
  content: string;
  link: string;
  author: string;
  pubDate: string;
}

export async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.map((item) => ({
      title: item.title || '',
      content: item['content:encoded'] || item.contentSnippet || item.content || '',
      link: item.link || '',
      author: item['dc:creator'] || item.creator || feed.title || '',
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return [];
  }
}

export async function fetchMultipleFeeds(
  feeds: { name: string; url: string }[]
): Promise<{ source: string; items: RSSItem[] }[]> {
  const results = await Promise.all(
    feeds.map(async (feed) => {
      const items = await fetchRSSFeed(feed.url);
      return { source: feed.name, items };
    })
  );
  return results;
}

// Common Substack RSS URL patterns
export function getSubstackRSSUrl(substackName: string): string {
  // Most Substacks follow this pattern
  return `https://${substackName}.substack.com/feed`;
}

// Strip HTML tags from content
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// Truncate content to a reasonable length
export function truncateContent(content: string, maxLength: number = 500): string {
  const stripped = stripHtml(content);
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength) + '...';
}

// ============================================
// Financial News Feeds Configuration
// ============================================

export interface FeedConfig {
  url: string;
  name: string;
  category: 'substack' | 'financial_news' | 'central_bank';
}

// Default feeds - can be extended via UI
export const DEFAULT_FEEDS: FeedConfig[] = [
  // Substacks (high quality macro analysis)
  { url: 'https://themacrocompass.substack.com/feed', name: 'The Macro Compass', category: 'substack' },
  { url: 'https://fedguy.substack.com/feed', name: 'Fed Guy', category: 'substack' },
  { url: 'https://noahpinion.substack.com/feed', name: 'Noahpinion', category: 'substack' },
  { url: 'https://apricitas.substack.com/feed', name: 'Apricitas Economics', category: 'substack' },

  // Financial news RSS feeds
  { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg Markets', category: 'financial_news' },
  { url: 'https://www.ft.com/rss/home', name: 'Financial Times', category: 'financial_news' },
  { url: 'https://feeds.reuters.com/reuters/businessNews', name: 'Reuters Business', category: 'financial_news' },
  { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', name: 'CNBC Economy', category: 'financial_news' },
];

// ============================================
// Relevance Scoring
// ============================================

// Keywords that indicate macro relevance (high priority)
const MACRO_KEYWORDS = [
  'fed', 'federal reserve', 'interest rate', 'interest rates', 'rate cut', 'rate hike',
  'inflation', 'cpi', 'pce', 'deflation', 'disinflation',
  'treasury', 'treasuries', 'yield', 'yields', 'bond', 'bonds', 'credit',
  'tariff', 'tariffs', 'trade war', 'trade deal', 'trade policy',
  'gdp', 'growth', 'recession', 'slowdown', 'contraction', 'expansion',
  'employment', 'jobs', 'unemployment', 'claims', 'payroll', 'nonfarm', 'labor',
  'central bank', 'boj', 'ecb', 'pboc', 'boe', 'monetary policy',
  'dollar', 'euro', 'yen', 'yuan', 'currency', 'forex', 'fx',
  'oil', 'crude', 'commodities', 'gold', 'copper',
  'stocks', 'equities', 's&p', 'dow', 'nasdaq', 'market', 'rally', 'selloff',
  'vix', 'volatility', 'risk-off', 'risk-on',
  'china', 'europe', 'emerging markets', 'em',
  'housing', 'real estate', 'mortgage',
  'earnings', 'profit', 'revenue',
  'bank', 'banking', 'financial',
  'stimulus', 'fiscal', 'spending', 'deficit', 'debt ceiling',
];

// Keywords that indicate political noise (lower priority unless market-relevant)
const POLITICAL_KEYWORDS = [
  'election', 'campaign', 'poll', 'polls', 'vote', 'voting',
  'congress', 'senate', 'house', 'democrat', 'republican',
  'immigration', 'border', 'abortion', 'gun',
];

// Keywords that boost relevance (breaking/urgent)
const URGENCY_KEYWORDS = [
  'breaking', 'urgent', 'just in', 'developing',
  'crash', 'surge', 'plunge', 'spike', 'soar', 'tumble',
  'emergency', 'crisis', 'shock',
];

export function scoreRelevance(headline: string, content?: string): number {
  const text = `${headline} ${content || ''}`.toLowerCase();
  let score = 0;

  // Macro keywords: +2 each
  for (const keyword of MACRO_KEYWORDS) {
    if (text.includes(keyword)) score += 2;
  }

  // Political keywords: -1 each (unless also has macro keywords)
  for (const keyword of POLITICAL_KEYWORDS) {
    if (text.includes(keyword)) score -= 1;
  }

  // Urgency keywords: +3 each
  for (const keyword of URGENCY_KEYWORDS) {
    if (text.includes(keyword)) score += 3;
  }

  return score;
}

// ============================================
// News Fetching with Filtering
// ============================================

export interface NewsItem {
  title: string;
  content: string;
  link: string;
  source: string;
  pubDate: string;
  relevanceScore: number;
}

export async function fetchAllNews(
  feeds: FeedConfig[] = DEFAULT_FEEDS,
  hoursBack: number = 24
): Promise<NewsItem[]> {
  const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const allItems: NewsItem[] = [];

  // Fetch all feeds in parallel
  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      try {
        const items = await fetchRSSFeed(feed.url);
        return { source: feed.name, items };
      } catch (error) {
        console.error(`Failed to fetch ${feed.name}:`, error);
        return { source: feed.name, items: [] };
      }
    })
  );

  // Process results
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { source, items } = result.value;
      for (const item of items) {
        const pubDate = new Date(item.pubDate);

        // Filter by time
        if (pubDate < cutoff) continue;

        // Calculate relevance
        const relevanceScore = scoreRelevance(item.title, item.content);

        allItems.push({
          title: item.title,
          content: truncateContent(item.content, 500),
          link: item.link,
          source,
          pubDate: item.pubDate,
          relevanceScore,
        });
      }
    }
  }

  // Sort by relevance (highest first), then by date (newest first)
  return allItems.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });
}

// Get top N most relevant news items
export async function getTopNews(
  limit: number = 15,
  feeds?: FeedConfig[],
  hoursBack?: number
): Promise<NewsItem[]> {
  const allNews = await fetchAllNews(feeds, hoursBack);
  return allNews.slice(0, limit);
}

// Format news for digest prompt
export function formatNewsForPrompt(news: NewsItem[]): string {
  if (news.length === 0) {
    return 'No recent news available.';
  }

  return news
    .map((item, i) => {
      const date = new Date(item.pubDate).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${i + 1}. **${item.title}**
   Source: ${item.source} | ${date}
   ${item.content.slice(0, 200)}${item.content.length > 200 ? '...' : ''}`;
    })
    .join('\n\n');
}
