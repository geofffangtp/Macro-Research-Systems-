import { NextRequest, NextResponse } from 'next/server';
import { discussItem } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { item, message, previousMessages, thesis } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
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
