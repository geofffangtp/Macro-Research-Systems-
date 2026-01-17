// FRED API Integration
// Federal Reserve Economic Data - https://fred.stlouisfed.org/

const FRED_API_KEY = process.env.FRED_API_KEY;
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

// Key Series IDs mapped to your thesis indicators
export const FRED_SERIES = {
  // Daily indicators
  vix: 'VIXCLS',                    // CBOE Volatility Index
  hySpread: 'BAMLH0A0HYM2',         // ICE BofA US High Yield OAS
  treasury2y: 'DGS2',               // 2-Year Treasury
  treasury10y: 'DGS10',             // 10-Year Treasury

  // Weekly indicators
  initialClaims: 'ICSA',            // Initial Jobless Claims
  continuingClaims: 'CCSA',         // Continuing Claims
  m2Weekly: 'WM2NS',                // M2 Money Supply (Weekly)

  // Monthly indicators
  coreCpi: 'CPILFESL',              // Core CPI (Less Food & Energy)
  m2: 'M2SL',                       // M2 Money Stock
  avgUnemploymentDuration: 'UEMPMEAN',  // Mean Duration of Unemployment
  medianUnemploymentDuration: 'UEMPMED', // Median Duration
  unemployed27Weeks: 'UEMP27OV',    // Long-term Unemployed
  cassFreightShipments: 'FRGSHPUSM649NCIS', // Cass Freight Index
  cassFreightExpenditures: 'FRGEXPUSM649NCIS', // Freight Costs
  copper: 'PCOPPUSDM',              // Global Copper Price

  // Other useful series
  fedfundsRate: 'FEDFUNDS',         // Federal Funds Rate
  breakeven10y: 'T10YIE',           // 10-Year Breakeven Inflation
  realGdp: 'GDPC1',                 // Real GDP
  unemploymentRate: 'UNRATE',       // Unemployment Rate
} as const;

export type FredSeriesId = typeof FRED_SERIES[keyof typeof FRED_SERIES];

interface FredObservation {
  date: string;
  value: string;
}

interface FredResponse {
  observations: FredObservation[];
}

interface FredSeriesInfo {
  id: string;
  title: string;
  frequency: string;
  units: string;
  seasonal_adjustment: string;
  last_updated: string;
}

/**
 * Fetch observations for a FRED series
 */
export async function getFredSeries(
  seriesId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<FredObservation[]> {
  if (!FRED_API_KEY) {
    console.warn('FRED_API_KEY not configured');
    return [];
  }

  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: FRED_API_KEY,
    file_type: 'json',
    sort_order: options?.sortOrder || 'desc',
  });

  if (options?.startDate) params.append('observation_start', options.startDate);
  if (options?.endDate) params.append('observation_end', options.endDate);
  if (options?.limit) params.append('limit', options.limit.toString());

  try {
    const response = await fetch(
      `${FRED_BASE_URL}/series/observations?${params}`
    );

    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status}`);
    }

    const data: FredResponse = await response.json();
    return data.observations;
  } catch (error) {
    console.error(`Error fetching FRED series ${seriesId}:`, error);
    return [];
  }
}

/**
 * Get the latest value for a series
 */
export async function getLatestFredValue(seriesId: string): Promise<{
  date: string;
  value: number;
  seriesId: string;
} | null> {
  const observations = await getFredSeries(seriesId, { limit: 5 });

  // Find the first non-null value (FRED sometimes has "." for missing data)
  const validObs = observations.find(obs => obs.value !== '.' && obs.value !== '');

  if (!validObs) return null;

  return {
    date: validObs.date,
    value: parseFloat(validObs.value),
    seriesId,
  };
}

/**
 * Get series metadata
 */
export async function getFredSeriesInfo(seriesId: string): Promise<FredSeriesInfo | null> {
  if (!FRED_API_KEY) return null;

  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: FRED_API_KEY,
    file_type: 'json',
  });

  try {
    const response = await fetch(`${FRED_BASE_URL}/series?${params}`);
    const data = await response.json();
    return data.seriess?.[0] || null;
  } catch (error) {
    console.error(`Error fetching FRED series info ${seriesId}:`, error);
    return null;
  }
}

/**
 * Fetch all macro indicators at once
 */
export async function fetchAllMacroIndicators(): Promise<Record<string, {
  date: string;
  value: number;
  seriesId: string;
} | null>> {
  const results: Record<string, { date: string; value: number; seriesId: string } | null> = {};

  // Fetch in parallel but with some batching to avoid rate limits
  const entries = Object.entries(FRED_SERIES);
  const batchSize = 10;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async ([key, seriesId]) => {
        const result = await getLatestFredValue(seriesId);
        return [key, result] as const;
      })
    );

    for (const [key, result] of batchResults) {
      results[key] = result;
    }

    // Small delay between batches to respect rate limits
    if (i + batchSize < entries.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Calculate derived indicators
  if (results.treasury10y && results.treasury2y) {
    results.yieldCurve = {
      date: results.treasury10y.date,
      value: Number((results.treasury10y.value - results.treasury2y.value).toFixed(2)),
      seriesId: 'CALCULATED',
    };
  }

  return results;
}

/**
 * Get historical data for charting
 */
export async function getFredHistory(
  seriesId: string,
  months: number = 12
): Promise<{ date: string; value: number }[]> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const observations = await getFredSeries(seriesId, {
    startDate: startDate.toISOString().split('T')[0],
    sortOrder: 'asc',
  });

  return observations
    .filter(obs => obs.value !== '.' && obs.value !== '')
    .map(obs => ({
      date: obs.date,
      value: parseFloat(obs.value),
    }));
}

/**
 * Check if FRED API is configured
 */
export function isFredConfigured(): boolean {
  return Boolean(FRED_API_KEY && FRED_API_KEY.length > 0);
}

/**
 * Map FRED series to your data release names
 */
export const FRED_TO_RELEASE_MAP: Record<string, string> = {
  'VIX': 'vix',
  'Credit Spreads (HY OAS)': 'hySpread',
  '2Y/10Y Spread': 'yieldCurve',
  'Core CPI': 'coreCpi',
  'M2 Money Supply': 'm2',
  'Continuing Jobless Claims': 'continuingClaims',
  'Avg Duration of Unemployment': 'avgUnemploymentDuration',
  'Cass Freight Index': 'cassFreightShipments',
  'Copper': 'copper',
  'Initial Jobless Claims': 'initialClaims',
};
