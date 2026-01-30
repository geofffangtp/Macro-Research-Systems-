import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const weeklyRequestSchema = z.object({
  digests: z.array(z.object({
    date: z.string(),
    content: z.string(),
  })),
  knowledgeEntries: z.array(z.object({
    topic: z.string(),
    conclusion: z.string(),
    thesisImpact: z.string().optional(),
    createdAt: z.string(),
  })).optional(),
  thesis: z.object({
    name: z.string(),
    summary: z.string(),
  }).nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = weeklyRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { digests, knowledgeEntries, thesis } = validation.data;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build context from the week
    const digestsSummary = digests
      .map((d) => `### ${d.date}\n${d.content}`)
      .join('\n\n---\n\n');

    const kbSummary = knowledgeEntries?.length
      ? knowledgeEntries
          .map((e) => `- **${e.topic}**: ${e.conclusion}${e.thesisImpact ? ` (Thesis impact: ${e.thesisImpact})` : ''}`)
          .join('\n')
      : 'No new knowledge entries this week.';

    const prompt = `You are a macro research analyst reviewing your week's work. Generate a Weekly Synthesis based on the daily digests and knowledge base entries below.

${thesis ? `## Current Thesis\n**${thesis.name}**: ${thesis.summary}\n\n` : ''}

## This Week's Digests
${digestsSummary}

## Knowledge Base Entries Added This Week
${kbSummary}

---

Generate a Weekly Synthesis with these sections:

## Week in Review
A 2-3 paragraph narrative of what happened this week in markets and how it relates to the thesis. What was the dominant story? What surprised you?

## Key Themes
- Bullet points of the 3-5 major themes that emerged this week
- Note which are new vs. continuing from prior weeks

## Thesis Evolution
How did your thesis signals move this week? What strengthened the thesis? What challenged it? Be specific about which data points or events moved the needle.

## Knowledge Gained
Summarize the new knowledge entries - what did you learn this week that you didn't know before? How does it connect to existing understanding?

## Open Questions
What questions emerged this week that need more research? What are you watching for next week?

## Looking Ahead
Based on this week's developments, what should you be paying attention to next week? Any key catalysts or data releases?

Keep it concise but substantive. This is for personal review, not publication.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const synthesis = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    return NextResponse.json({ synthesis });
  } catch (error) {
    console.error('Error generating weekly synthesis:', error);
    return NextResponse.json(
      { error: 'Failed to generate weekly synthesis' },
      { status: 500 }
    );
  }
}
