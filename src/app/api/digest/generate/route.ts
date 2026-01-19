import { NextRequest, NextResponse } from 'next/server';
import { generateDigest } from '@/lib/claude';
import { getLatestFredValue, isFredConfigured } from '@/lib/fred';
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
    })
  ).optional(),
});

async function fetchMarketData() {
  if (!isFredConfigured()) {
    console.warn('FRED API not configured, skipping market data fetch');
    return {};
  }

  // Fetch key indicators in parallel
  const [vix, hySpread, treasury10y, treasury2y, initialClaims, continuingClaims] = await Promise.all([
    getLatestFredValue('VIXCLS'),
    getLatestFredValue('BAMLH0A0HYM2'),
    getLatestFredValue('DGS10'),
    getLatestFredValue('DGS2'),
    getLatestFredValue('ICSA'),
    getLatestFredValue('CCSA'),
  ]);

  // Calculate yield curve
  const yieldCurve = treasury10y && treasury2y
    ? {
        value: (treasury10y.value - treasury2y.value) * 100, // Convert to basis points
        date: treasury10y.date,
        seriesId: 'CALCULATED',
      }
    : null;

  return {
    vix: vix ? { value: vix.value, date: vix.date } : undefined,
    hySpread: hySpread ? { value: hySpread.value * 100, date: hySpread.date } : undefined, // OAS is in percentage, convert to bp
    treasury10y: treasury10y ? { value: treasury10y.value, date: treasury10y.date } : undefined,
    treasury2y: treasury2y ? { value: treasury2y.value, date: treasury2y.date } : undefined,
    yieldCurve: yieldCurve ? { value: yieldCurve.value, date: yieldCurve.date } : undefined,
    initialClaims: initialClaims ? { value: initialClaims.value, date: initialClaims.date } : undefined,
    continuingClaims: continuingClaims ? { value: continuingClaims.value, date: continuingClaims.date } : undefined,
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

    const { items, thesis, knowledgeEntries } = validation.data;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Fetch real market data from FRED
    console.log('Fetching market data from FRED...');
    const marketData = await fetchMarketData();
    console.log('Market data fetched:', Object.keys(marketData).filter((k) => marketData[k as keyof typeof marketData]));

    // Generate digest with real data
    const digest = await generateDigest(items, marketData, thesis, knowledgeEntries);

    return NextResponse.json({
      digest,
      marketData, // Return market data for UI display
    });
  } catch (error) {
    console.error('Error generating digest:', error);
    return NextResponse.json(
      { error: 'Failed to generate digest' },
      { status: 500 }
    );
  }
}
