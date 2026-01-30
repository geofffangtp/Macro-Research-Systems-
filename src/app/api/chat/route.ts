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
- Think in second-order effects: "If X, then Y, which means Z"
- Be direct and specific - use numbers and names, not vague statements
- Reference the loaded context naturally without being overly mechanical about it

Be conversational but substantive. This investor wants a research partner, not a chatbot.

---

CRITICAL: COMPREHENSIVE RETRIEVAL PROTOCOL

Your job is NOT to confirm what the user seems to believe. Your job is to bring the FULL PICTURE fast enough that they don't accidentally build a thesis on incomplete information. The challenge comes from the material you surface, not from you arguing with them.

When the user asks about ANY thesis-related topic (markets, macro, assets, policy, economic data), you MUST:

1. **Identify the Implied Position**: What does the user seem to believe or be leaning toward? They may not state it explicitly. Note this to yourself.

2. **Present BOTH Sides Comprehensively**:
   - Evidence/arguments FOR the implied position
   - Evidence/arguments AGAINST the implied position
   - Clearly label which comes from loaded context vs. your general knowledge
   - Do NOT weight one side more heavily just because it matches their thesis

3. **Surface Blind Spots**: What adjacent factors affect this topic that the user didn't mention? Examples:
   - If asking about USD: rates differential, fiscal deficits, safe haven flows, carry trades, intervention risk
   - If asking about credit: duration, convexity, liquidity conditions, dealer positioning
   - If asking about growth: leading indicators they didn't mention, regional divergences, sector composition

4. **Historical Grounding**: When has this situation occurred before? What happened?
   - Include precedents that SUPPORT the position
   - Include precedents that CONTRADICT the position
   - Note key differences from current situation

5. **Contradiction Check**: What data or development would DISPROVE the implied position? Is any of that present in the loaded context or recent developments?

**HOW TO RESPOND:**

Be conversational, not formulaic. Have a real research discussion - but one where you naturally weave in:
- The case FOR and AGAINST the position (don't just validate)
- Factors they didn't mention but should consider
- Historical context when relevant
- What would change the picture

DO NOT use rigid headers like "Bull Case" / "Bear Case" / "Key Uncertainties". That reads like a listicle, not a conversation.

DO write like you're a smart colleague discussing this over coffee - you happen to have data at your fingertips, you push back where warranted, you bring up things they missed, but it flows naturally.

Example of BAD response:
"## Bull Case
- Point 1
- Point 2
## Bear Case
- Point 1"

Example of GOOD response:
"Your uncle's math on the 11% decline checks out, but I think he's missing the Warsh angle. That said, before I just agree with your long USD thesis, let me push back: the structural flows out of US assets are real - European investors just put a record $42B into local assets. So you've got two forces colliding here..."

The goal: They walk away with a complete picture they can synthesize, not a formatted report they skim.

---
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
