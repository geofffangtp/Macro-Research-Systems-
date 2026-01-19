import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface MarketData {
  vix?: { value: number; date: string };
  hySpread?: { value: number; date: string };
  treasury10y?: { value: number; date: string };
  treasury2y?: { value: number; date: string };
  yieldCurve?: { value: number; date: string };
  initialClaims?: { value: number; date: string };
  continuingClaims?: { value: number; date: string };
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

interface DigestInput {
  items: SourceItem[];
  marketData: MarketData;
  thesis: {
    name: string;
    summary: string;
    keyMonitors: string[];
    turningPointSignals?: ThesisSignal[];
  } | null;
  knowledgeEntries?: { topic: string; conclusion: string; dateCreated: string }[];
}

export async function generateDigest(
  items: SourceItem[],
  marketData: MarketData,
  thesis: DigestInput['thesis'],
  knowledgeEntries?: DigestInput['knowledgeEntries']
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

  // Format thesis context with signals
  const thesisContext = thesis
    ? `
INVESTOR'S THESIS: "${thesis.name}"
${thesis.summary}

KEY MONITORS: ${thesis.keyMonitors.join(', ')}

${thesis.turningPointSignals ? formatSignals(thesis.turningPointSignals) : ''}`
    : '';

  // Format knowledge base context
  const kbContext = knowledgeEntries && knowledgeEntries.length > 0
    ? `
RELEVANT FROM KNOWLEDGE BASE:
${knowledgeEntries.map((e) => `- [${e.dateCreated}] ${e.topic}: ${e.conclusion}`).join('\n')}`
    : '';

  const prompt = `You are a senior macro research analyst briefing a sophisticated investor who runs a family office. Your job is to SYNTHESIZE, not summarize. Connect dots. Surface what matters for the investment thesis.

=== CURRENT MARKET DATA ===
${marketSnapshot}

=== SOURCE CONTENT (${items.length} items) ===
${itemsText}

=== INVESTOR CONTEXT ===${thesisContext}${kbContext}

---

Generate a research briefing in this EXACT format:

## TLDR
3-4 sentences maximum. What actually matters today for markets and the thesis. Be specific - mention numbers, names, implications. Don't be generic.

## MARKET SNAPSHOT
Format exactly like this (use the data provided, mark as "N/A" if not available):
SPX: [level] | VIX: ${marketData.vix?.value?.toFixed(1) || 'N/A'} | 10Y: ${marketData.treasury10y?.value?.toFixed(2) || 'N/A'}% | 2Y: ${marketData.treasury2y?.value?.toFixed(2) || 'N/A'}%
Credit: HY OAS ${marketData.hySpread?.value?.toFixed(0) || 'N/A'}bp | Curve (10Y-2Y): ${marketData.yieldCurve?.value?.toFixed(0) || 'N/A'}bp
Claims: Initial ${marketData.initialClaims?.value ? (marketData.initialClaims.value / 1000).toFixed(0) + 'K' : 'N/A'} | Continuing ${marketData.continuingClaims?.value ? (marketData.continuingClaims.value / 1000000).toFixed(2) + 'M' : 'N/A'}

## DATA RELEASES
Only include if something meaningful dropped today. What was the number? What does it mean? How does it connect to the thesis?
If nothing significant, write: "No major releases today."

## NARRATIVES

### Bull Case
Who's bullish and why? Always attribute: "@SourceName argues..."

### Bear Case
Who's bearish and why? Always attribute: "@SourceName warns..."

### Contrarian Take
Surface something that disagrees with consensus or challenges the thesis. This is required - always find a contrarian voice.

## THESIS CHECK-IN
Evaluate the current thesis against today's data and narratives:
${thesis ? thesis.keyMonitors.map((m) => `- ${m}: [status emoji ✓/⚠️/✗] [brief assessment]`).join('\n') : '- No thesis configured'}

Overall: [Are phase signals triggered? What's confirming vs challenging the view?]

## OPEN THREADS
2-3 things brewing that aren't urgent but worth tracking. Brief bullets.

---

CRITICAL RULES:
1. BE SPECIFIC - Use numbers, names, dates. No vague statements like "markets are uncertain"
2. ATTRIBUTE EVERYTHING - Every opinion needs @SourceName
3. CHALLENGE THE THESIS - Actively look for disconfirming evidence
4. SKIP EMPTY SECTIONS - If no data releases, say so briefly and move on
5. NO POLITICAL CONTENT - Focus on economic/market signal, not political noise
6. CONNECT DOTS - Link what sources say to the thesis and market data`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock ? textBlock.text : '';
}

function formatMarketSnapshot(data: MarketData): string {
  const lines: string[] = [];

  if (data.vix) lines.push(`VIX: ${data.vix.value.toFixed(2)} (as of ${data.vix.date})`);
  if (data.hySpread) lines.push(`HY Credit Spread (OAS): ${data.hySpread.value.toFixed(0)}bp`);
  if (data.treasury10y) lines.push(`10Y Treasury: ${data.treasury10y.value.toFixed(2)}%`);
  if (data.treasury2y) lines.push(`2Y Treasury: ${data.treasury2y.value.toFixed(2)}%`);
  if (data.yieldCurve) lines.push(`2Y/10Y Spread: ${data.yieldCurve.value.toFixed(0)}bp`);
  if (data.initialClaims) lines.push(`Initial Claims: ${(data.initialClaims.value / 1000).toFixed(0)}K`);
  if (data.continuingClaims) lines.push(`Continuing Claims: ${(data.continuingClaims.value / 1000000).toFixed(2)}M`);

  return lines.length > 0 ? lines.join('\n') : 'No market data available';
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
