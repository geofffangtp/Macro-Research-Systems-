import { NextRequest, NextResponse } from 'next/server';
import { generateDigest } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, dataReleases, thesis } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    const digest = await generateDigest(items, dataReleases, thesis);

    return NextResponse.json({ digest });
  } catch (error) {
    console.error('Error generating digest:', error);
    return NextResponse.json(
      { error: 'Failed to generate digest' },
      { status: 500 }
    );
  }
}
