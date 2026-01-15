import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function generateDigest(
  items: { source: string; content: string; url?: string }[],
  dataReleases: { name: string; value?: string; trend?: string }[],
  thesis: { summary: string; keyMonitors: string[] } | null
): Promise<string> {
  const itemsText = items
    .map((item, i) => `[${i + 1}] @${item.source}: ${item.content}${item.url ? ` (${item.url})` : ''}`)
    .join('\n\n');

  const dataText = dataReleases
    .map((d) => `- ${d.name}: ${d.value || 'No update'} ${d.trend ? `(${d.trend})` : ''}`)
    .join('\n');

  const thesisContext = thesis
    ? `\n\nUser's Current Thesis: ${thesis.summary}\nKey Monitors: ${thesis.keyMonitors.join(', ')}`
    : '';

  const prompt = `You are a macro research analyst creating a daily digest for an investor.

Today's source items:
${itemsText}

Data releases:
${dataText}
${thesisContext}

Generate a structured daily digest in the following format:

## TLDR
3-4 sentences summarizing what actually matters today. Be concise and actionable.

## MARKET SNAPSHOT
Key levels, overnight moves, what's pricing in. Brief - the user can see charts themselves.

## DATA & RELEASES
What came out, what it means, connection to thesis. Only include if something meaningful dropped.

## NARRATIVES & TAKES
What sources are saying. Present both bull and bear perspectives. Flag contrarian takes separately.
Always attribute sources.

## THESIS CHECK-IN
Only include if something today is relevant to the thesis. Does anything challenge or confirm the current view?

## OPEN THREADS
Things brewing that aren't urgent but worth tracking.

Important guidelines:
- Be objective, not confirming. Present data/facts separately from narratives.
- Always surface contrarian views.
- Be concise - target 10-20 minutes of reading.
- Skip sections if nothing relevant to include.
- Focus on interconnections and holistic view over single data points.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock ? textBlock.text : '';
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
