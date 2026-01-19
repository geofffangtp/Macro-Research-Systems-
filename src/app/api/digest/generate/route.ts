import { NextRequest, NextResponse } from 'next/server';
import { generateDigest } from '@/lib/claude';
import { validateRequest, digestRequestSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, digestRequestSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { items, dataReleases, thesis } = validation.data;

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
