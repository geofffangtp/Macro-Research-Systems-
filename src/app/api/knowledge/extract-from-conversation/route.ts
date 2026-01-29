import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const conversationExtractSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().max(50000),
    })
  ).min(2).max(100),
  existingTopics: z.array(z.string().max(200)).max(100).optional(),
  thesisContext: z.string().max(5000).optional(),
});

export interface ExtractedConversationKnowledge {
  topic: string;
  questionsAsked: string[];
  thesisImpact: string;
  keyInsights: string[];
  conclusion: string;
  catalystToWatch?: string;
  tags: string[];
  status: 'open' | 'closed' | 'watching';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = conversationExtractSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json(
        { error: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }

    const { messages, existingTopics, thesisContext } = validation.data;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Format the conversation for analysis
    const conversationText = messages
      .map((m) => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`)
      .join('\n\n---\n\n');

    const prompt = `You are extracting a single knowledge base entry from an entire research conversation.

FULL CONVERSATION:
${conversationText}

${thesisContext ? `USER'S THESIS CONTEXT:\n${thesisContext}\n` : ''}

EXISTING TOPICS IN KNOWLEDGE BASE (use existing topic if relevant, or create new one):
${existingTopics && existingTopics.length > 0 ? existingTopics.join(', ') : 'None yet'}

Your task: Analyze the ENTIRE conversation and extract ONE consolidated knowledge entry that captures the key learnings.

Focus on:
1. What questions did the user ask? (summarize the main lines of inquiry)
2. What were the key insights discovered through the conversation?
3. How does this affect their investment thesis?
4. What's the main takeaway/conclusion?

Respond ONLY with valid JSON (no markdown code blocks):
{
  "topic": "string - short topic name that captures the main subject (2-5 words)",
  "questionsAsked": ["string array - 2-4 main questions/lines of inquiry from the user, summarized"],
  "thesisImpact": "string - 1-2 sentences on how this conversation affects the investment thesis",
  "keyInsights": ["string array - 3-6 key takeaways from the entire conversation, each one sentence"],
  "conclusion": "string - the main conclusion or actionable insight from the whole conversation (2-3 sentences)",
  "catalystToWatch": "string or null - specific event/data to watch that would update this view",
  "tags": ["string array - 3-5 relevant tags"],
  "status": "watching" | "open" | "closed" - use 'watching' if there's an active catalyst, 'open' if more research needed, 'closed' if concluded
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');

    if (textBlock) {
      try {
        const parsed = JSON.parse(textBlock.text);
        const extracted: ExtractedConversationKnowledge = {
          topic: parsed.topic || 'Research Conversation',
          questionsAsked: Array.isArray(parsed.questionsAsked) ? parsed.questionsAsked : [],
          thesisImpact: parsed.thesisImpact || 'Unknown impact',
          keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
          conclusion: parsed.conclusion || 'No conclusion extracted',
          catalystToWatch: parsed.catalystToWatch || undefined,
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          status: ['watching', 'open', 'closed'].includes(parsed.status) ? parsed.status : 'open',
        };
        return NextResponse.json({ extracted });
      } catch {
        // Fallback if JSON parsing fails
        return NextResponse.json({
          extracted: {
            topic: 'Research Conversation',
            questionsAsked: [],
            thesisImpact: 'Unknown impact',
            keyInsights: [],
            conclusion: 'Failed to extract - please fill manually',
            tags: [],
            status: 'open',
          },
        });
      }
    }

    return NextResponse.json(
      { error: 'No response from Claude' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error extracting knowledge from conversation:', error);
    return NextResponse.json(
      { error: 'Failed to extract knowledge from conversation' },
      { status: 500 }
    );
  }
}
