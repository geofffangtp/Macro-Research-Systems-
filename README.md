# Macro Research System

A personal macro research and daily digest system for investors. Built with Next.js, Tailwind CSS, and Claude API.

## Features (Phase 1 MVP)

- **Daily Digest Generation**: On-demand AI-powered digest of market news and analysis
- **Manual Input System**: Paste tweets, articles, and notes for processing
- **RSS Ingestion**: Fetch content from Substack newsletters
- **Data Release Tracking**: Monitor key economic indicators
- **"Discuss This" Chat**: Deep-dive into any topic with Claude
- **Knowledge Base**: Flag and save important insights
- **Source Rating**: Track and weight your information sources
- **Prediction Ledger**: Track predictions and outcomes
- **Mobile-Responsive**: Access from any device

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-repo/macro-research-system.git
cd macro-research-system
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment example:
```bash
cp .env.example .env.local
```

4. Add your Anthropic API key to `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Time Setup

1. Navigate to **Settings** to initialize default data
2. Go to **Sources** to see pre-configured Twitter accounts and data releases
3. Add any Substack RSS feeds you want to track
4. Click **Generate Digest** on the Daily Digest page to create your first digest

## Architecture

```
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   │   ├── chat/       # Claude chat endpoint
│   │   │   ├── digest/     # Digest generation
│   │   │   ├── knowledge/  # Knowledge base analysis
│   │   │   └── rss/        # RSS feed fetching
│   │   ├── page.tsx        # Main application page
│   │   └── layout.tsx      # Root layout
│   ├── components/          # React components
│   │   ├── digest/         # Digest view components
│   │   ├── knowledge/      # Knowledge base components
│   │   ├── layout/         # Layout components
│   │   ├── sources/        # Source management components
│   │   └── ui/             # Shared UI components
│   ├── lib/                 # Utility libraries
│   │   ├── claude.ts       # Claude API wrapper
│   │   ├── rss.ts          # RSS parser
│   │   ├── supabase.ts     # Database client
│   │   └── initial-data.ts # Default sources & data releases
│   ├── store/               # Zustand state management
│   └── types/               # TypeScript type definitions
```

## Data Storage

The MVP uses browser localStorage for persistence. This means:
- Data persists across browser sessions
- No server-side database required
- Easy to get started without Supabase setup

For production use with cloud persistence, configure Supabase:
1. Create a project at [supabase.com](https://supabase.com)
2. Run the schema SQL from `src/lib/supabase.ts`
3. Add your Supabase credentials to `.env.local`

## Pre-configured Sources

### Twitter/X Accounts

**Tier 1 (Core Signal)**
- @KobeissiLetter - Data-driven macro, breaking economic news
- @MacroAlf - Institutional macro, credit impulse, yield curves
- @LynAldenContact - Fiscal dominance, liquidity, debt cycles
- @nickgerli1 - Residential housing, inventory, price-to-income
- @SpectatorIndex - Geopolitical + macro headlines

**Tier 2 (Rotate by Relevance)**
- @EJ_Antoni, @biaboronska, @JimBianco, @Jesse_Felder, @LoganMohtashami

### Data Releases

**Tier 1 (Core to Thesis)**
- ISM Manufacturing (New Orders vs Inventories)
- Cass Freight Index
- Continuing Jobless Claims
- Core CPI
- Credit Spreads (HY OAS)
- VIX

**Tier 2 (Supporting)**
- Global Semiconductor Billings
- % Stocks Above 200-DMA
- 2Y/10Y Spread
- M2 Money Supply

## Investment Thesis Framework

The system is pre-configured with the "Resilient Bear" thesis:

**Scenarios:**
- Base Case (60%): Stagflationary Slog
- Bear Case (30%): Crisis
- Bull Case (10%): Productivity Boom

**Turning Point Signals:**
- Phase 1: Peak Market Stress
- Phase 2: Economic Inflection
- Phase 3: Confirmation & Broadening

Update your thesis in Settings as your view evolves.

## Deployment

Deploy to Vercel:

```bash
npm run build
vercel deploy
```

Or use the Vercel GitHub integration for automatic deployments.

## API Cost Estimates

| Usage Level | Claude API | Monthly Total |
|-------------|------------|---------------|
| Light       | ~$10       | ~$10-15       |
| Moderate    | ~$25       | ~$25-35       |
| Heavy       | ~$50       | ~$50-70       |

## Future Roadmap

- **Phase 2**: Knowledge base querying, topic clustering
- **Phase 3**: Source auditing, prediction accuracy tracking
- **Phase 4**: Twitter API automation, advanced data parsing
- **Phase 5**: Content generation, sharing features

## License

Private - For personal use only.

# Deployment trigger
# Deploy fix
