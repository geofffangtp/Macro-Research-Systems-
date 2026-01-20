import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface MarketData {
  // Core market data
  vix?: { value: number; date: string };
  hySpread?: { value: number; date: string };
  treasury10y?: { value: number; date: string };
  treasury2y?: { value: number; date: string };
  yieldCurve?: { value: number; date: string };

  // Labor market
  initialClaims?: { value: number; date: string };
  continuingClaims?: { value: number; date: string };
  unemploymentDuration?: { value: number; date: string };
  unemploymentRate?: { value: number; date: string };

  // Inflation & Economy
  coreCpi?: { value: number; date: string };
  cassFreight?: { value: number; date: string };
  m2?: { value: number; date: string };
  copper?: { value: number; date: string };
  breakeven10y?: { value: number; date: string };
}

interface SourceItem {
  source: string;
  content: string;
  url?: string;
  title?: string;
}

interface ThesisSignal {
  phase: number;
  name: string;
  indicators: string[];
  status: string;
}

interface KnowledgeEntry {
  topic: string;
  conclusion: string;
  dateCreated: string;
  thesisImpact?: string;
  status?: 'open' | 'closed' | 'watching';
  catalystToWatch?: string;
}

interface OpenThread {
  content: string;
  createdDate: string;
  status: 'open' | 'resolved' | 'stale';
}

interface ThesisScenario {
  name: string;
  probability: number;
  description: string;
}

interface IntlMarketData {
  stoxx600?: string;
  dax?: string;
  ftse?: string;
  nikkei?: string;
  hangSeng?: string;
  shanghai?: string;
  dxy?: string;
  eurUsd?: string;
  usdJpy?: string;
  usdCny?: string;
  notableMovers?: string;
  intlEvents?: string;
}

interface DigestInput {
  items: SourceItem[];
  marketData: MarketData;
  thesis: {
    name: string;
    summary: string;
    keyMonitors: string[];
    scenarios?: ThesisScenario[];
    turningPointSignals?: ThesisSignal[];
  } | null;
  knowledgeEntries?: KnowledgeEntry[];
  recentOpenThreads?: OpenThread[];
  intlMarketData?: IntlMarketData;
}

export async function generateDigest(
  items: SourceItem[],
  marketData: MarketData,
  thesis: DigestInput['thesis'],
  knowledgeEntries?: DigestInput['knowledgeEntries'],
  recentOpenThreads?: DigestInput['recentOpenThreads'],
  intlMarketData?: DigestInput['intlMarketData']
): Promise<string> {
  // Format source items - group by source for clarity
  const sourceGroups: Record<string, SourceItem[]> = {};
  for (const item of items) {
    const src = item.source || 'Unknown';
    if (!sourceGroups[src]) sourceGroups[src] = [];
    sourceGroups[src].push(item);
  }

  const itemsText = Object.entries(sourceGroups)
    .map(([source, sourceItems]) => {
      const itemsList = sourceItems
        .map((item) => `  - ${item.title || item.content.slice(0, 100)}...`)
        .join('\n');
      return `@${source}:\n${itemsList}`;
    })
    .join('\n\n');

  // Format market data
  const marketSnapshot = formatMarketSnapshot(marketData);

  // Format thesis context with full detail
  const thesisContext = thesis
    ? `
THESIS: "${thesis.name}"
${thesis.summary}

${thesis.scenarios && thesis.scenarios.length > 0 ? `SCENARIOS:
${thesis.scenarios.map((s) => `- ${s.name} (${s.probability}%): ${s.description}`).join('\n')}
` : ''}
KEY MONITORS:
${thesis.keyMonitors.map((m) => `- ${m}`).join('\n')}

${thesis.turningPointSignals ? `TURNING POINT FRAMEWORK:
${thesis.turningPointSignals.map((s) => `Phase ${s.phase} - ${s.name} [${s.status.toUpperCase()}]
  Indicators: ${s.indicators.join(', ')}`).join('\n')}` : ''}`
    : '';

  // Format knowledge base context with richer detail
  const kbContext = knowledgeEntries && knowledgeEntries.length > 0
    ? `
ACCUMULATED KNOWLEDGE (reference when relevant):
${knowledgeEntries.map((e) => {
  let entry = `- [${e.topic}] ${e.conclusion}`;
  if (e.thesisImpact) entry += ` | Thesis impact: ${e.thesisImpact}`;
  if (e.catalystToWatch) entry += ` | Watching: ${e.catalystToWatch}`;
  if (e.status === 'watching') entry += ' [ACTIVE]';
  return entry;
}).join('\n')}`
    : '';

  // Format recent open threads for continuity
  const threadsContext = recentOpenThreads && recentOpenThreads.length > 0
    ? `
OPEN THREADS FROM RECENT DIGESTS (check if any are resolved):
${recentOpenThreads.map((t) => `- [${new Date(t.createdDate).toLocaleDateString()}] ${t.content}`).join('\n')}

When today's content resolves or updates one of these threads, call it out explicitly:
"✅ THREAD RESOLVED: [original thread] - [what resolved it]"
"📝 THREAD UPDATE: [original thread] - [new development]"`
    : '';

  // Format international market data
  const intlContext = formatIntlMarketData(intlMarketData);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const prompt = `You are a macro research analyst writing a substantive daily digest. This should be 15 minutes of valuable reading, not 2 minutes of headlines.

# MACRO DIGEST - ${today}

---

## INPUTS

**Market Data (US - FRED):**
${marketSnapshot}

${intlContext ? `**International Markets:**
${intlContext}

` : ''}**Today's Content:**
${itemsText}

**Thesis Framework:**${thesisContext}

${kbContext ? `**Prior Knowledge:**${kbContext}` : ''}
${threadsContext ? `**Open Threads:**${threadsContext}` : ''}

---

## YOUR TASK

Generate a comprehensive macro digest with the following sections. Be substantive - this is analysis, not summarization.

---

## BOTTOM LINE

Write 4-6 sentences on what actually matters today. Be specific and direct:
- What happened that's material to the thesis?
- Does it strengthen, challenge, or not affect the current view?
- What's the key question this raises?

Don't summarize articles. Synthesize and analyze. Connect to the thesis.

---

## MARKET SNAPSHOT

Create markdown tables with key levels:

**Rates & Spreads:**
| Metric | Level | Notes |
|--------|-------|-------|
| VIX | ${marketData.vix?.value?.toFixed(1) || 'N/A'} | [reading: complacent/elevated/stressed] |
| 10Y | ${marketData.treasury10y?.value?.toFixed(2) || 'N/A'}% | |
| 2Y | ${marketData.treasury2y?.value?.toFixed(2) || 'N/A'}% | |
| Curve (10Y-2Y) | ${marketData.yieldCurve?.value?.toFixed(0) || 'N/A'}bp | [steepening/flattening/inverted] |
| HY OAS | ${marketData.hySpread?.value?.toFixed(0) || 'N/A'}bp | [no stress / watch / stress] |

**Labor Market:**
| Metric | Level | Notes |
|--------|-------|-------|
| Initial Claims | ${marketData.initialClaims?.value ? (marketData.initialClaims.value / 1000).toFixed(0) + 'K' : 'N/A'} | [trend direction] |
| Continuing Claims | ${marketData.continuingClaims?.value ? (marketData.continuingClaims.value / 1000000).toFixed(2) + 'M' : 'N/A'} | [trend direction] |
| Unemployment Rate | ${marketData.unemploymentRate?.value?.toFixed(1) || 'N/A'}% | |
| Avg Duration | ${marketData.unemploymentDuration?.value?.toFixed(1) || 'N/A'} weeks | [rising = harder to find work] |

**Inflation & Economy:**
| Metric | Level | Notes |
|--------|-------|-------|
| 10Y Breakeven | ${marketData.breakeven10y?.value?.toFixed(2) || 'N/A'}% | [inflation expectations] |
| Core CPI Index | ${marketData.coreCpi?.value?.toFixed(1) || 'N/A'} | |
| M2 Money Supply | ${marketData.m2?.value ? '$' + (marketData.m2.value / 1000).toFixed(2) + 'T' : 'N/A'} | |
| Copper | ${marketData.copper?.value ? '$' + marketData.copper.value.toFixed(2) : 'N/A'}/lb | [economic health proxy] |
| Cass Freight | ${marketData.cassFreight?.value?.toFixed(2) || 'N/A'} | [shipping volume] |

${intlMarketData && (intlMarketData.stoxx600 || intlMarketData.dax || intlMarketData.ftse) ? `**Europe:**
| Index | Change | Notes |
|-------|--------|-------|
${intlMarketData.stoxx600 ? `| Stoxx 600 | ${intlMarketData.stoxx600} | |` : ''}
${intlMarketData.dax ? `| DAX | ${intlMarketData.dax} | |` : ''}
${intlMarketData.ftse ? `| FTSE | ${intlMarketData.ftse} | |` : ''}
` : ''}
${intlMarketData && (intlMarketData.nikkei || intlMarketData.hangSeng || intlMarketData.shanghai) ? `**Asia:**
| Index | Change | Notes |
|-------|--------|-------|
${intlMarketData.nikkei ? `| Nikkei | ${intlMarketData.nikkei} | |` : ''}
${intlMarketData.hangSeng ? `| Hang Seng | ${intlMarketData.hangSeng} | |` : ''}
${intlMarketData.shanghai ? `| Shanghai | ${intlMarketData.shanghai} | |` : ''}
` : ''}
${intlMarketData && (intlMarketData.dxy || intlMarketData.eurUsd || intlMarketData.usdJpy) ? `**Currencies:**
| Pair | Level | Notes |
|------|-------|-------|
${intlMarketData.dxy ? `| DXY | ${intlMarketData.dxy} | [dollar strength/weakness] |` : ''}
${intlMarketData.eurUsd ? `| EUR/USD | ${intlMarketData.eurUsd} | |` : ''}
${intlMarketData.usdJpy ? `| USD/JPY | ${intlMarketData.usdJpy} | [yen carry implications] |` : ''}
${intlMarketData.usdCny ? `| USD/CNY | ${intlMarketData.usdCny} | |` : ''}
` : ''}
${intlMarketData?.notableMovers ? `**Notable Movers:** ${intlMarketData.notableMovers}
` : ''}
${intlMarketData?.intlEvents ? `**International Events:** ${intlMarketData.intlEvents}
` : ''}

---

## WHAT HAPPENED

For each significant story (usually 1-3), write a substantive analysis:

### 1. [Story Title] (THE STORY / IMPORTANT / NOTABLE)

**What happened:** [2-3 sentences on the facts]

**Why it matters for the thesis:** [This is the key part - connect to the thesis framework]

**Second-order effects:** Think through implications:
- If X, then Y, which means Z
- Who gets hurt? Who benefits?
- How does this connect to other thesis signals?

**What to watch:** [Specific indicators or events that will resolve uncertainty]

---

## THESIS SCORECARD

Create a table evaluating each signal:

| Signal | Status | Current Reading | Threshold |
|--------|--------|-----------------|-----------|
${thesis ? thesis.keyMonitors.map((m) => `| ${m} | ⚠️ Watching | [current level/status] | [what would trigger change] |`).join('\n') : '| No thesis configured | | | |'}

**Phase Status:**
${thesis?.turningPointSignals ? thesis.turningPointSignals.map((s) => `- Phase ${s.phase} (${s.name}): ${s.status === 'triggered' ? '🟢 TRIGGERED' : s.status === 'watching' ? '🟡 WATCHING' : '⚪ NOT YET'}`).join('\n') : '- No signals configured'}

**Net Assessment:** [2-3 sentences on overall thesis status. Are we closer to turning points? What would change the view?]

---

## WHAT I'M WATCHING

Create a table with specific, answerable questions:

| Question | Catalyst | Timeframe |
|----------|----------|-----------|
| [Specific question] | [What event/data answers it] | [When] |
| [Specific question] | [What event/data answers it] | [When] |
| [Specific question] | [What event/data answers it] | [When] |

---

## DEVIL'S ADVOCATE

Write 3-4 numbered points on why the current thesis might be wrong. Be honest and specific:

1. **[Title]** - [Why this challenges the thesis]
2. **[Title]** - [Why this challenges the thesis]
3. **[Title]** - [Why this challenges the thesis]

---

## DEEP DIVE (if major story)

If there's a significant story that warrants deeper analysis, include a section like:

### [Topic] - Deep Dive

**Background:** [Context needed to understand]

**The Details:** [Substantive explanation]

**Thesis Connection:** [How it relates to the investment framework]

**Key Uncertainty:** [What's unknown and how it resolves]

---

## RULES

1. **Substance over summary** - Every paragraph should contain analysis, not just facts
2. **Thesis-centric** - Everything connects back to the investment thesis
3. **Specific numbers** - "VIX at 15.8" not "volatility is low"
4. **Second-order thinking** - "If X then Y then Z" reasoning
5. **No source attribution in text** - Synthesize, don't quote
6. **Tables for data** - Use markdown tables for structured information
7. **Skip empty sections** - If nothing happened in a category, don't include it
8. **Be direct** - No hedging, no "it remains to be seen", no "time will tell"

Generate the full digest now.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock ? textBlock.text : '';
}

function formatMarketSnapshot(data: MarketData): string {
  const lines: string[] = [];

  // Core rates & spreads
  if (data.vix) lines.push(`VIX: ${data.vix.value.toFixed(2)} (as of ${data.vix.date})`);
  if (data.hySpread) lines.push(`HY Credit Spread (OAS): ${data.hySpread.value.toFixed(0)}bp (as of ${data.hySpread.date})`);
  if (data.treasury10y) lines.push(`10Y Treasury: ${data.treasury10y.value.toFixed(2)}% (as of ${data.treasury10y.date})`);
  if (data.treasury2y) lines.push(`2Y Treasury: ${data.treasury2y.value.toFixed(2)}% (as of ${data.treasury2y.date})`);
  if (data.yieldCurve) lines.push(`2Y/10Y Spread: ${data.yieldCurve.value.toFixed(0)}bp`);

  // Labor market
  if (data.initialClaims) lines.push(`Initial Claims: ${(data.initialClaims.value / 1000).toFixed(0)}K (as of ${data.initialClaims.date})`);
  if (data.continuingClaims) lines.push(`Continuing Claims: ${(data.continuingClaims.value / 1000000).toFixed(2)}M (as of ${data.continuingClaims.date})`);
  if (data.unemploymentRate) lines.push(`Unemployment Rate: ${data.unemploymentRate.value.toFixed(1)}% (as of ${data.unemploymentRate.date})`);
  if (data.unemploymentDuration) lines.push(`Avg Unemployment Duration: ${data.unemploymentDuration.value.toFixed(1)} weeks (as of ${data.unemploymentDuration.date})`);

  // Inflation & Economy
  if (data.coreCpi) lines.push(`Core CPI Index: ${data.coreCpi.value.toFixed(1)} (as of ${data.coreCpi.date})`);
  if (data.breakeven10y) lines.push(`10Y Breakeven Inflation: ${data.breakeven10y.value.toFixed(2)}% (as of ${data.breakeven10y.date})`);
  if (data.m2) lines.push(`M2 Money Supply: $${(data.m2.value / 1000).toFixed(2)}T (as of ${data.m2.date})`);
  if (data.copper) lines.push(`Copper: $${data.copper.value.toFixed(2)}/lb (as of ${data.copper.date})`);
  if (data.cassFreight) lines.push(`Cass Freight Index: ${data.cassFreight.value.toFixed(2)} (as of ${data.cassFreight.date})`);

  return lines.length > 0 ? lines.join('\n') : 'No market data available';
}

function formatIntlMarketData(data?: IntlMarketData): string {
  if (!data) return '';

  const sections: string[] = [];

  // European indices
  const europeLines: string[] = [];
  if (data.stoxx600) europeLines.push(`Stoxx 600: ${data.stoxx600}`);
  if (data.dax) europeLines.push(`DAX: ${data.dax}`);
  if (data.ftse) europeLines.push(`FTSE: ${data.ftse}`);
  if (europeLines.length > 0) {
    sections.push(`Europe:\n${europeLines.map((l) => `  - ${l}`).join('\n')}`);
  }

  // Asian indices
  const asiaLines: string[] = [];
  if (data.nikkei) asiaLines.push(`Nikkei: ${data.nikkei}`);
  if (data.hangSeng) asiaLines.push(`Hang Seng: ${data.hangSeng}`);
  if (data.shanghai) asiaLines.push(`Shanghai: ${data.shanghai}`);
  if (asiaLines.length > 0) {
    sections.push(`Asia:\n${asiaLines.map((l) => `  - ${l}`).join('\n')}`);
  }

  // Currencies
  const fxLines: string[] = [];
  if (data.dxy) fxLines.push(`DXY: ${data.dxy}`);
  if (data.eurUsd) fxLines.push(`EUR/USD: ${data.eurUsd}`);
  if (data.usdJpy) fxLines.push(`USD/JPY: ${data.usdJpy}`);
  if (data.usdCny) fxLines.push(`USD/CNY: ${data.usdCny}`);
  if (fxLines.length > 0) {
    sections.push(`Currencies:\n${fxLines.map((l) => `  - ${l}`).join('\n')}`);
  }

  // Notable movers
  if (data.notableMovers) {
    sections.push(`Notable Movers: ${data.notableMovers}`);
  }

  // International events
  if (data.intlEvents) {
    sections.push(`International Events: ${data.intlEvents}`);
  }

  return sections.join('\n\n');
}

function formatSignals(signals: ThesisSignal[]): string {
  return `TURNING POINT SIGNALS:
${signals.map((s) => `Phase ${s.phase} (${s.name}): ${s.status.toUpperCase()}
  Watching: ${s.indicators.join(', ')}`).join('\n')}`
}

export async function discussItem(
  item: { title: string; content: string; source?: string },
  userMessage: string,
  previousMessages: { role: 'user' | 'assistant'; content: string }[] = [],
  thesis?: { summary: string } | null
): Promise<string> {
  const context = `Context item being discussed:
Title: ${item.title}
Source: ${item.source || 'Unknown'}
Content: ${item.content}
${thesis ? `\nUser's thesis context: ${thesis.summary}` : ''}`;

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: context },
    { role: 'assistant', content: 'I understand the context. How would you like to discuss this?' },
    ...previousMessages,
    { role: 'user', content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: `You are a macro research analyst helping an investor analyze market information.
Be objective and data-driven. Challenge assumptions when appropriate.
Connect insights to broader market themes and the user's investment thesis when relevant.
Be concise but thorough.`,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock ? textBlock.text : '';
}

export async function analyzeForKnowledgeBase(
  content: string,
  existingTopics: string[]
): Promise<{
  suggestedTopic: string;
  keyInsights: string[];
  thesisRelevance: string;
  suggestedTags: string[];
}> {
  const prompt = `Analyze this content for a personal knowledge base:

Content:
${content}

Existing topics in the knowledge base:
${existingTopics.join(', ') || 'None yet'}

Provide:
1. A suggested topic name (use an existing one if it fits, or suggest a new one)
2. Key insights (3-5 bullet points)
3. Thesis relevance (how might this impact macro investing decisions?)
4. Suggested tags (3-5 relevant tags)

Respond in JSON format:
{
  "suggestedTopic": "string",
  "keyInsights": ["string"],
  "thesisRelevance": "string",
  "suggestedTags": ["string"]
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (textBlock) {
    try {
      return JSON.parse(textBlock.text);
    } catch {
      return {
        suggestedTopic: 'Uncategorized',
        keyInsights: [content.slice(0, 200)],
        thesisRelevance: 'Unknown',
        suggestedTags: [],
      };
    }
  }
  return {
    suggestedTopic: 'Uncategorized',
    keyInsights: [content.slice(0, 200)],
    thesisRelevance: 'Unknown',
    suggestedTags: [],
  };
}

export { anthropic };
