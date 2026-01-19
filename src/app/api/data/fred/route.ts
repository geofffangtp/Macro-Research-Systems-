import { NextResponse } from 'next/server';
import { fetchAllMacroIndicators, getLatestFredValue, isFredConfigured, FRED_SERIES } from '@/lib/fred';
import { validateRequest, fredRefreshSchema } from '@/lib/validations';
import { z } from 'zod';

// Schema for GET query params
const fredGetSchema = z.object({
  series: z.string().max(50).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seriesId = searchParams.get('series');

  // Validate query param
  const validation = fredGetSchema.safeParse({ series: seriesId });
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid series parameter' },
      { status: 400 }
    );
  }

  if (!isFredConfigured()) {
    return NextResponse.json(
      { error: 'FRED API key not configured' },
      { status: 503 }
    );
  }

  try {
    // If specific series requested, fetch just that one
    if (seriesId) {
      const data = await getLatestFredValue(seriesId);
      if (!data) {
        return NextResponse.json(
          { error: 'No data found for series' },
          { status: 404 }
        );
      }
      return NextResponse.json({ data });
    }

    // Otherwise fetch all macro indicators
    const indicators = await fetchAllMacroIndicators();
    return NextResponse.json({
      indicators,
      availableSeries: Object.keys(FRED_SERIES),
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('FRED API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FRED data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Validate request body
    const validation = await validateRequest(request, fredRefreshSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { seriesIds } = validation.data;

    if (!isFredConfigured()) {
      return NextResponse.json(
        { error: 'FRED API key not configured' },
        { status: 503 }
      );
    }

    const results: Record<string, { date: string; value: number } | null> = {};

    for (const seriesId of seriesIds || Object.values(FRED_SERIES)) {
      results[seriesId] = await getLatestFredValue(seriesId);
    }

    return NextResponse.json({
      data: results,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('FRED refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh FRED data' },
      { status: 500 }
    );
  }
}
