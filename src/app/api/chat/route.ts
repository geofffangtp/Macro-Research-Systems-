import { NextRequest, NextResponse } from 'next/server';
import { discussItem } from '@/lib/claude';
import { validateRequest, chatRequestSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, chatRequestSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { item, message, previousMessages, thesis } = validation.data;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    if (!item) {
      return NextResponse.json(
        { error: 'Item is required for chat' },
        { status: 400 }
      );
    }

    const response = await discussItem(item, message, previousMessages, thesis);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
