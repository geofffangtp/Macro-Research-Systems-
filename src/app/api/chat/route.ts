import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { validateRequest, chatRequestSchema } from '@/lib/validations';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface ContextData {
  digest?: {
    date: string;
    content: string;
  };
  thesis?: {
    name: string;
    summary: string;
    scenarios?: Array<{ name: string; probability: number; description: string }>;
    keyMonitors?: string[];
    turningPointSignals?: Array<{
      phase: number;
      name: string;
      indicators: string[];
      status: string;
    }>;
  };
  knowledgeEntries?: Array<{
    topic: string;
    conclusion: string;
    thesisImpact?: string;
    catalystToWatch?: string;
    status?: string;
  }>;
  openThreads?: Array<{
    content: string;
    createdDate: string;
  }>;
}

interface PromptOptions {
  responseLength?: 'concise' | 'detailed';
  devilsAdvocate?: boolean;
  suggestFollowUps?: boolean;
}

// Clean mode - no context loaded, pure conversation
function buildCleanSystemPrompt(options: PromptOptions = {}): string {
  const lengthInstruction = options.responseLength === 'concise'
    ? '\n\n**LENGTH: Keep responses under 300 words. Be direct and skip obvious context.**'
    : '';

  const devilsAdvocateInstruction = options.devilsAdvocate
    ? '\n\n**DEVIL\'S ADVOCATE MODE: Always argue the OPPOSITE of whatever view the user presents. If they\'re bullish, be bearish. If they\'re bearish, be bullish. Don\'t hedge - commit to the contrarian position and make the strongest possible case.**'
    : '';

  const followUpInstruction = options.suggestFollowUps
    ? '\n\n**At the end of your response, add a "---" separator and suggest 2-3 specific follow-up questions the user might want to explore, formatted as a bullet list.**'
    : '';

  return `You are a senior macro research analyst. Your job is to help me understand markets, economics, and investment concepts.

How to respond:

**When I ask you to explain something:**
- Explain it clearly and directly
- Use concrete examples and specific numbers
- Don't assume I have prior context - teach me from scratch
- Keep it factual, not narrative-driven

**When I share a view or thesis:**
- Analyze it objectively
- Present evidence for AND against
- Point out what I might be missing
- Don't just validate - genuinely challenge if warranted

**When I'm confused:**
- Break it down simply
- Use analogies if helpful
- Don't pile on complexity

**General principles:**
- Be direct and specific
- Separate facts from interpretation from speculation
- If data is mixed or unclear, say so - don't force a clean narrative
- Think like an analyst, not an advocate

I want a research partner who helps me see clearly, not one who confirms what I already believe.${lengthInstruction}${devilsAdvocateInstruction}${followUpInstruction}`;
}

// Context mode - load thesis and research context
function buildContextSystemPrompt(context: ContextData, options: PromptOptions = {}): string {
  const lengthInstruction = options.responseLength === 'concise'
    ? '\n\n**LENGTH: Keep responses under 300 words. Be direct and skip obvious context.**'
    : '';

  const devilsAdvocateInstruction = options.devilsAdvocate
    ? '\n\n**DEVIL\'S ADVOCATE MODE: Actively argue AGAINST the user\'s thesis. Find every weakness, every assumption that could be wrong, every way the market could prove them wrong. Don\'t hedge - be the toughest critic possible.**'
    : '';

  const followUpInstruction = options.suggestFollowUps
    ? '\n\n**At the end of your response, add a "---" separator and suggest 2-3 specific follow-up questions related to the thesis, formatted as a bullet list.**'
    : '';

  let systemPrompt = `You are a senior macro research analyst helping me analyze how new information affects my investment thesis.

I'm sharing my current thesis and research context below. Help me:
- See how new data supports or challenges my thesis
- Identify what I might be missing
- Think through implications
- Update my views if warranted

Be direct. If my thesis has holes, tell me. If the data doesn't support my view, say so clearly.${lengthInstruction}${devilsAdvocateInstruction}${followUpInstruction}

---
MY CURRENT THESIS AND CONTEXT:
`;

  if (context.thesis) {
    systemPrompt += `
**THESIS: "${context.thesis.name}"**
${context.thesis.summary}
`;
    if (context.thesis.scenarios && context.thesis.scenarios.length > 0) {
      systemPrompt += `
Scenario probabilities: ${context.thesis.scenarios.map((s) => `${s.name} ${s.probability}%`).join(', ')}
`;
    }
  }

  if (context.knowledgeEntries && context.knowledgeEntries.length > 0) {
    systemPrompt += `
**PRIOR RESEARCH:**
${context.knowledgeEntries.map((e) => `• ${e.topic}: ${e.conclusion}`).join('\n')}
`;
  }

  if (context.digest) {
    systemPrompt += `
**TODAY'S DIGEST (${context.digest.date}):**
${context.digest.content.slice(0, 6000)}
${context.digest.content.length > 6000 ? '\n[...truncated]' : ''}
`;
  }

  return systemPrompt;
}

export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, chatRequestSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { item, message, previousMessages, thesis, context, enableWebSearch, useContext, responseLength, devilsAdvocate, suggestFollowUps } = validation.data;

    const promptOptions: PromptOptions = {
      responseLength,
      devilsAdvocate,
      suggestFollowUps,
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Determine which system prompt to use based on useContext flag
    let systemPrompt: string;

    if (useContext === false) {
      // Explicit clean mode - no context
      systemPrompt = buildCleanSystemPrompt(promptOptions);
    } else if (context || item || thesis) {
      // Context provided - use context mode
      let fullContext: ContextData = {};

      if (context) {
        fullContext = context;
      } else if (item) {
        fullContext = {
          digest: {
            date: new Date().toISOString(),
            content: `Discussing: ${item.title}\n\n${item.content}${item.source ? `\n\nSource: @${item.source}` : ''}`,
          },
        };
        if (thesis) {
          fullContext.thesis = {
            name: thesis.name || 'Investment Thesis',
            summary: thesis.summary,
          };
        }
      }

      systemPrompt = buildContextSystemPrompt(fullContext, promptOptions);
    } else {
      // No context provided - default to clean mode
      systemPrompt = buildCleanSystemPrompt(promptOptions);
    }

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (previousMessages && previousMessages.length > 0) {
      messages.push(...previousMessages);
    }

    messages.push({ role: 'user', content: message });

    const apiParams: Anthropic.MessageCreateParams = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages,
    };

    if (enableWebSearch) {
      apiParams.tools = [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5,
        } as Anthropic.WebSearchTool20250305,
      ];
    }

    const response = await anthropic.messages.create(apiParams);

    let responseText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        responseText += block.text;
      }
    }

    if (!responseText) {
      responseText = 'I apologize, but I was unable to generate a response. Please try again.';
    }

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
