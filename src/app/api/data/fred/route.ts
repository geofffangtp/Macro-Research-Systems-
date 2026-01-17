import { NextResponse } from 'next/server';
import { fetchAllMacroIndicators, getLatestFredValue, isFredConfigured, FRED_SERIES } from '@/lib/fred';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seriesId = searchParams.get('series');

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
  // Endpoint to refresh specific indicators
  try {
    const { seriesIds } = await request.json();

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
