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
  let systemPrompt = `You're my research partner. I'm an investor trying to figure out what's actually true.

Your job is NOT to help me confirm what I already believe. Your job is to help me see clearly - including where my current thinking might be wrong.

When I share an interpretation:
- Separate what's factual from what's inference from what's narrative
- Point out what I might be missing or dismissing too quickly
- Consider alternative explanations I haven't mentioned
- Tell me what data would change the picture

Be direct. Push back. If my thesis has holes, I need to know.

Here's my current context (treat this as "what I'm currently thinking" not "what's true"):
`;

  // Add thesis context first - framed as "current thinking" not "truth"
  if (context.thesis) {
    systemPrompt += `
---
THESIS I'M CURRENTLY TESTING: "${context.thesis.name}"
${context.thesis.summary}

(Note: This is my working hypothesis, not established fact. Challenge it if the data doesn't support it.)
`;

    if (context.thesis.scenarios && context.thesis.scenarios.length > 0) {
      systemPrompt += `
My current probability estimates: ${context.thesis.scenarios.map((s) => `${s.name} ${s.probability}%`).join(', ')}
`;
    }
  }

  // Add knowledge entries - framed as prior conclusions that could be revised
  if (context.knowledgeEntries && context.knowledgeEntries.length > 0) {
    systemPrompt += `
---
PRIOR RESEARCH & CONCLUSIONS (may need updating):
${context.knowledgeEntries
  .map((e) => {
    let entry = `• ${e.topic}: ${e.conclusion}`;
    if (e.catalystToWatch) entry += ` (watching: ${e.catalystToWatch})`;
    return entry;
  })
  .join('\n')}
`;
  }

  // Add today's digest (current context)
  if (context.digest) {
    systemPrompt += `
---
TODAY'S DIGEST (${context.digest.date}):
${context.digest.content.slice(0, 8000)}
${context.digest.content.length > 8000 ? '\n[...truncated]' : ''}
`;
  }

  // Add open threads if any
  if (context.openThreads && context.openThreads.length > 0) {
    systemPrompt += `
---
OPEN QUESTIONS I'M TRACKING:
${context.openThreads.map((t) => `• ${t.content}`).join('\n')}
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
