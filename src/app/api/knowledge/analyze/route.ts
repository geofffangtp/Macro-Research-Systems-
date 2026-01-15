import { NextRequest, NextResponse } from 'next/server';
import { analyzeForKnowledgeBase } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, existingTopics } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

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
