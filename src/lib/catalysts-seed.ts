// Seed data for this week's catalysts (Feb 2-8, 2026)
// This can be updated weekly or eventually automated via API

export interface SeedCatalyst {
  title: string;
  date: string; // ISO date
  time?: string;
  category: 'economic' | 'fed' | 'earnings' | 'geopolitical' | 'other';
  importance: 'high' | 'medium' | 'low';
  description?: string;
  expectedValue?: string;
  previousValue?: string;
}

export const thisWeekCatalysts: SeedCatalyst[] = [
  // ========== MONDAY FEB 2 ==========
  {
    title: 'ISM Manufacturing PMI',
    date: '2026-02-02',
    time: '10:00 AM ET',
    category: 'economic',
    importance: 'high',
    description: 'January 2026 data. New seasonal adjustment factors effective this release.',
  },
  {
    title: 'DIS Earnings',
    date: '2026-02-02',
    time: 'After Close',
    category: 'earnings',
    importance: 'high',
    description: 'Disney Q1 FY26 - streaming profitability, parks recovery',
  },
  {
    title: 'PLTR Earnings',
    date: '2026-02-02',
    time: 'After Close',
    category: 'earnings',
    importance: 'medium',
    description: 'Palantir Q4 - AI/government contract momentum',
  },

  // ========== TUESDAY FEB 3 ==========
  {
    title: 'JOLTS Job Openings',
    date: '2026-02-03',
    time: '10:00 AM ET',
    category: 'economic',
    importance: 'high',
    description: 'December 2025 data. Key for labor market slack assessment.',
  },
  {
    title: 'AMD Earnings',
    date: '2026-02-03',
    time: 'After Close',
    category: 'earnings',
    importance: 'high',
    description: 'AMD Q4 - AI GPU competition, data center growth',
  },
  {
    title: 'GOOGL Earnings',
    date: '2026-02-03',
    time: 'After Close',
    category: 'earnings',
    importance: 'high',
    description: 'Alphabet Q4 - Search, Cloud, AI capex guidance',
  },
  {
    title: 'PFE Earnings',
    date: '2026-02-03',
    time: 'Before Open',
    category: 'earnings',
    importance: 'medium',
    description: 'Pfizer Q4 - post-COVID pipeline progress',
  },
  {
    title: 'MRK Earnings',
    date: '2026-02-03',
    time: 'Before Open',
    category: 'earnings',
    importance: 'medium',
    description: 'Merck Q4 - Keytruda franchise health',
  },
  {
    title: 'PEP Earnings',
    date: '2026-02-03',
    time: 'Before Open',
    category: 'earnings',
    importance: 'medium',
    description: 'PepsiCo Q4 - Consumer staples demand, pricing power',
  },
  {
    title: 'PYPL Earnings',
    date: '2026-02-03',
    time: 'After Close',
    category: 'earnings',
    importance: 'medium',
    description: 'PayPal Q4 - payment volume trends',
  },
  {
    title: 'SMCI Earnings',
    date: '2026-02-03',
    time: 'After Close',
    category: 'earnings',
    importance: 'high',
    description: 'Super Micro Q2 - AI server demand, margin sustainability',
  },

  // ========== WEDNESDAY FEB 4 ==========
  {
    title: 'ISM Services PMI',
    date: '2026-02-04',
    time: '10:00 AM ET',
    category: 'economic',
    importance: 'high',
    description: 'January 2026 data. Services inflation and employment components key.',
  },
  {
    title: 'ADP Employment',
    date: '2026-02-04',
    time: '8:15 AM ET',
    category: 'economic',
    importance: 'medium',
    description: 'Private payrolls preview ahead of Friday NFP',
  },
  {
    title: 'LLY Earnings',
    date: '2026-02-04',
    time: 'Before Open',
    category: 'earnings',
    importance: 'high',
    description: 'Eli Lilly Q4 - GLP-1 sales (Mounjaro/Zepbound), capacity guidance',
  },
  {
    title: 'ABBV Earnings',
    date: '2026-02-04',
    time: 'Before Open',
    category: 'earnings',
    importance: 'medium',
    description: 'AbbVie Q4 - Humira erosion, new drug uptake',
  },
  {
    title: 'UBER Earnings',
    date: '2026-02-04',
    time: 'Before Open',
    category: 'earnings',
    importance: 'medium',
    description: 'Uber Q4 - ride share, delivery, autonomous vehicle strategy',
  },
  {
    title: 'QCOM Earnings',
    date: '2026-02-04',
    time: 'After Close',
    category: 'earnings',
    importance: 'high',
    description: 'Qualcomm Q1 - mobile chip cycle, AI PC ramp',
  },
  {
    title: 'ARM Earnings',
    date: '2026-02-04',
    time: 'After Close',
    category: 'earnings',
    importance: 'high',
    description: 'ARM Q3 - royalty rates, AI chip design wins',
  },

  // ========== THURSDAY FEB 5 ==========
  {
    title: 'Initial Jobless Claims',
    date: '2026-02-05',
    time: '8:30 AM ET',
    category: 'economic',
    importance: 'high',
    description: 'Weekly claims - real-time labor market signal',
  },
  {
    title: 'Productivity & Costs',
    date: '2026-02-05',
    time: '8:30 AM ET',
    category: 'economic',
    importance: 'medium',
    description: 'Q4 2025 preliminary - unit labor costs key for inflation',
  },
  {
    title: 'AMZN Earnings',
    date: '2026-02-05',
    time: 'After Close',
    category: 'earnings',
    importance: 'high',
    description: 'Amazon Q4 - AWS growth, retail margins, AI/capex',
  },
  {
    title: 'MSTR Earnings',
    date: '2026-02-05',
    time: 'After Close',
    category: 'earnings',
    importance: 'medium',
    description: 'MicroStrategy Q4 - Bitcoin strategy, software business',
  },
  {
    title: 'FTNT Earnings',
    date: '2026-02-05',
    time: 'After Close',
    category: 'earnings',
    importance: 'medium',
    description: 'Fortinet Q4 - cybersecurity spending trends',
  },

  // ========== FRIDAY FEB 6 ==========
  {
    title: 'Employment Situation (NFP)',
    date: '2026-02-06',
    time: '8:30 AM ET',
    category: 'economic',
    importance: 'high',
    description: 'January 2026 jobs report. Annual benchmark revisions + new seasonal factors. Key release.',
    previousValue: '+50K (Dec)',
  },

  // ========== FED SPEAKERS ==========
  {
    title: 'Fed Blackout Period',
    date: '2026-02-02',
    time: 'All Week',
    category: 'fed',
    importance: 'low',
    description: 'FOMC blackout period ended Jan 30. Potential for Fed speakers this week.',
  },
];
