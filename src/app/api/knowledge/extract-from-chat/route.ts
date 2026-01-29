import { NextRequest, NextResponse } from 'next/server';
import { extractKnowledgeFromChat } from '@/lib/claude';
import { validateRequest, knowledgeExtractFromChatSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, knowledgeExtractFromChatSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { assistantMessage, userMessage, existingTopics, thesisContext } = validation.data;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    const extracted = await extractKnowledgeFromChat(
      assistantMessage,
      userMessage,
      existingTopics || [],
      thesisContext
    );

    return NextResponse.json({ extracted });
  } catch (error) {
    console.error('Error extracting knowledge from chat:', error);
    return NextResponse.json(
      { error: 'Failed to extract knowledge from chat' },
      { status: 500 }
    );
  }
}
