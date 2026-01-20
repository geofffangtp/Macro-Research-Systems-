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

function buildSystemPrompt(context: ContextData): string {
  let systemPrompt = `You are a macro research assistant helping an investor analyze market information and develop their investment thesis.

Your role is to:
- Provide substantive, analytical responses (not generic advice)
- Connect everything back to the investor's thesis and key monitors
- Think in second-order effects: "If X, then Y, which means Z"
- Challenge assumptions and surface contrarian views when appropriate
- Be direct and specific - use numbers and names, not vague statements
- Reference the loaded context naturally without being overly mechanical about it

Be conversational but substantive. This investor wants a research partner, not a chatbot.
`;

  // Add digest context
  if (context.digest) {
    systemPrompt += `

CURRENT DIGEST (${context.digest.date}):
${context.digest.content.slice(0, 6000)}
${context.digest.content.length > 6000 ? '\n[...truncated for context window]' : ''}
`;
  }

  // Add thesis context
  if (context.thesis) {
    systemPrompt += `

INVESTOR'S THESIS: "${context.thesis.name}"
${context.thesis.summary}
`;

    if (context.thesis.scenarios && context.thesis.scenarios.length > 0) {
      systemPrompt += `
SCENARIOS:
${context.thesis.scenarios.map((s) => `- ${s.name} (${s.probability}%): ${s.description}`).join('\n')}
`;
    }

    if (context.thesis.keyMonitors && context.thesis.keyMonitors.length > 0) {
      systemPrompt += `
KEY MONITORS:
${context.thesis.keyMonitors.map((m) => `- ${m}`).join('\n')}
`;
    }

    if (context.thesis.turningPointSignals && context.thesis.turningPointSignals.length > 0) {
      systemPrompt += `
TURNING POINT SIGNALS:
${context.thesis.turningPointSignals
  .map((s) => `Phase ${s.phase} - ${s.name} [${s.status.toUpperCase()}]: ${s.indicators.join(', ')}`)
  .join('\n')}
`;
    }
  }

  // Add knowledge entries
  if (context.knowledgeEntries && context.knowledgeEntries.length > 0) {
    systemPrompt += `

ACCUMULATED KNOWLEDGE (reference when relevant):
${context.knowledgeEntries
  .map((e) => {
    let entry = `- [${e.topic}] ${e.conclusion}`;
    if (e.thesisImpact) entry += ` | Impact: ${e.thesisImpact}`;
    if (e.catalystToWatch) entry += ` | Watching: ${e.catalystToWatch}`;
    if (e.status === 'watching') entry += ' [ACTIVE]';
    return entry;
  })
  .join('\n')}
`;
  }

  // Add open threads
  if (context.openThreads && context.openThreads.length > 0) {
    systemPrompt += `

OPEN THREADS (questions/issues being tracked):
${context.openThreads.map((t) => `- [${new Date(t.createdDate).toLocaleDateString()}] ${t.content}`).join('\n')}
`;
  }

  return systemPrompt;
}

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, chatRequestSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { item, message, previousMessages, thesis, context, enableWebSearch } = validation.data;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Build context from new format or legacy format
    let fullContext: ContextData = {};

    if (context) {
      fullContext = context;
    } else if (item) {
      // Legacy: single item context
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

    const systemPrompt = buildSystemPrompt(fullContext);

    // Build messages array
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (previousMessages && previousMessages.length > 0) {
      messages.push(...previousMessages);
    }

    messages.push({ role: 'user', content: message });

    // Call Claude API with optional web search
    const apiParams: Anthropic.MessageCreateParams = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages,
    };

    // Enable web search if requested
    if (enableWebSearch) {
      apiParams.tools = [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 3,
        } as Anthropic.WebSearchTool20250305,
      ];
    }

    const response = await anthropic.messages.create(apiParams);

    // Extract text response, handling web search results if present
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
