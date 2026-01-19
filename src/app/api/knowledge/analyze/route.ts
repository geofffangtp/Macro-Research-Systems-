import { NextRequest, NextResponse } from 'next/server';
import { analyzeForKnowledgeBase } from '@/lib/claude';
import { validateRequest, knowledgeAnalyzeSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, knowledgeAnalyzeSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { content, existingTopics } = validation.data;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    const analysis = await analyzeForKnowledgeBase(content, existingTopics || []);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error analyzing content:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}
