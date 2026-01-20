import { NextRequest, NextResponse } from 'next/server';
import { generateDigest } from '@/lib/claude';
import { getLatestFredValue, isFredConfigured } from '@/lib/fred';
import { getTopNews, type NewsItem } from '@/lib/rss';
import { rankContent, getTopContent, logContentRanking } from '@/lib/relevance';
import { z } from 'zod';

// Updated schema for the new digest format
const digestRequestSchema = z.object({
  items: z.array(
    z.object({
      source: z.string().max(500),
      content: z.string().max(50000),
      url: z.string().max(2000).optional(),
      title: z.string().max(1000).optional(),
    })
  ).max(100).default([]),
  thesis: z.object({
    name: z.string().max(500),
    summary: z.string().max(5000),
    keyMonitors: z.array(z.string().max(500)).max(20).default([]),
    scenarios: z.array(
      z.object({
        name: z.string(),
        probability: z.number(),
        description: z.string(),
      })
    ).optional(),
    turningPointSignals: z.array(
      z.object({
        phase: z.number(),
        name: z.string(),
        indicators: z.array(z.string()),
        status: z.string(),
      })
    ).optional(),
  }).nullable().default(null),
  knowledgeEntries: z.array(
    z.object({
      topic: z.string(),
      conclusion: z.string(),
      dateCreated: z.string(),
      thesisImpact: z.string().optional(),
      status: z.enum(['open', 'closed', 'watching']).optional(),
      catalystToWatch: z.string().optional(),
    })
  ).optional(),
  recentOpenThreads: z.array(
    z.object({
      content: z.string(),
      createdDate: z.string(),
      status: z.enum(['open', 'resolved', 'stale']),
    })
  ).optional(),
  intlMarketData: z.object({
    stoxx600: z.string().optional(),
    dax: z.string().optional(),
    ftse: z.string().optional(),
    nikkei: z.string().optional(),
    hangSeng: z.string().optional(),
    shanghai: z.string().optional(),
    dxy: z.string().optional(),
    eurUsd: z.string().optional(),
    usdJpy: z.string().optional(),
    usdCny: z.string().optional(),
    notableMovers: z.string().optional(),
    intlEvents: z.string().optional(),
  }).optional(),
});

async function fetchMarketData() {
  if (!isFredConfigured()) {
    console.warn('FRED API not configured, skipping market data fetch');
    return {};
  }

  // Fetch ALL needed indicators in parallel
  const [
    vix,
    hySpread,
    treasury10y,
    treasury2y,
    initialClaims,
    continuingClaims,
    unemploymentDuration,
    coreCpi,
    cassFreight,
    m2,
    copper,
    breakeven10y,
    unemploymentRate
  ] = await Promise.all([
    getLatestFredValue('VIXCLS'),           // VIX
    getLatestFredValue('BAMLH0A0HYM2'),     // HY Credit Spread
    getLatestFredValue('DGS10'),            // 10Y Treasury
    getLatestFredValue('DGS2'),             // 2Y Treasury
    getLatestFredValue('ICSA'),             // Initial Claims
    getLatestFredValue('CCSA'),             // Continuing Claims
    getLatestFredValue('UEMPMEAN'),         // Avg Unemployment Duration
    getLatestFredValue('CPILFESL'),         // Core CPI
    getLatestFredValue('FRGSHPUSM649NCIS'), // Cass Freight Shipments
    getLatestFredValue('WM2NS'),            // M2 Money Supply
    getLatestFredValue('PCOPPUSDM'),        // Copper Price
    getLatestFredValue('T10YIE'),           // 10Y Breakeven Inflation
    getLatestFredValue('UNRATE'),           // Unemployment Rate
  ]);

  // Calculate yield curve in basis points
  const yieldCurve = treasury10y && treasury2y
    ? {
        value: (treasury10y.value - treasury2y.value) * 100,
        date: treasury10y.date,
        seriesId: 'CALCULATED',
      }
    : null;

  return {
    // Core market data
    vix: vix ? { value: vix.value, date: vix.date } : undefined,
    hySpread: hySpread ? { value: hySpread.value * 100, date: hySpread.date } : undefined, // Convert to bp
    treasury10y: treasury10y ? { value: treasury10y.value, date: treasury10y.date } : undefined,
    treasury2y: treasury2y ? { value: treasury2y.value, date: treasury2y.date } : undefined,
    yieldCurve: yieldCurve ? { value: yieldCurve.value, date: yieldCurve.date } : undefined,

    // Labor market
    initialClaims: initialClaims ? { value: initialClaims.value, date: initialClaims.date } : undefined,
    continuingClaims: continuingClaims ? { value: continuingClaims.value, date: continuingClaims.date } : undefined,
    unemploymentDuration: unemploymentDuration ? { value: unemploymentDuration.value, date: unemploymentDuration.date } : undefined,
    unemploymentRate: unemploymentRate ? { value: unemploymentRate.value, date: unemploymentRate.date } : undefined,

    // Inflation & Economy
    coreCpi: coreCpi ? { value: coreCpi.value, date: coreCpi.date } : undefined,
    cassFreight: cassFreight ? { value: cassFreight.value, date: cassFreight.date } : undefined,
    m2: m2 ? { value: m2.value, date: m2.date } : undefined,
    copper: copper ? { value: copper.value, date: copper.date } : undefined,
    breakeven10y: breakeven10y ? { value: breakeven10y.value, date: breakeven10y.date } : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = digestRequestSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json(
        { error: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }

    const { items, thesis, knowledgeEntries, recentOpenThreads, intlMarketData } = validation.data;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Fetch market data and news in parallel
    console.log('Fetching market data from FRED and news from RSS feeds...');
    const [marketData, newsItems] = await Promise.all([
      fetchMarketData(),
      getTopNews(15, undefined, 24).catch((err) => {
        console.error('Failed to fetch news:', err);
        return [] as NewsItem[];
      }),
    ]);

    console.log('Market data fetched:', Object.keys(marketData).filter((k) => marketData[k as keyof typeof marketData]));
    console.log(`News fetched: ${newsItems.length} items`);

    // Combine user-provided items with news for relevance ranking
    const newsAsSourceItems = newsItems.map((news) => ({
      source: news.source,
      content: news.content,
      url: news.link,
      title: news.title,
    }));

    // Merge all content: user items first, then news items
    const allContent = [...items, ...newsAsSourceItems];

    // Rank content by relevance (macro data > markets > policy > corporate > political)
    const rankedContent = rankContent(allContent);

    // Log the ranking for debugging
    logContentRanking(rankedContent, 'Digest content ranking');

    // Take top 20 most relevant items
    const topContent = getTopContent(rankedContent, 20);

    // Convert back to source items format
    const relevantItems = topContent.map((item) => ({
      source: item.source,
      content: item.content,
      url: item.url,
      title: item.title,
    }));

    console.log(`Content filtered: ${allContent.length} -> ${relevantItems.length} items (by relevance)`);

    // Generate digest with relevance-filtered content
    const digest = await generateDigest(relevantItems, marketData, thesis, knowledgeEntries, recentOpenThreads, intlMarketData);

    return NextResponse.json({
      digest,
      marketData, // Return market data for UI display
      newsCount: newsItems.length, // Track how many news items were fetched
    });
  } catch (error) {
    console.error('Error generating digest:', error);
    return NextResponse.json(
      { error: 'Failed to generate digest' },
      { status: 500 }
    );
  }
}
