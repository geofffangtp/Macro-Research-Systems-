import { NextRequest, NextResponse } from 'next/server';
import { fetchRSSFeed, truncateContent } from '@/lib/rss';
import { validateRequest, rssRequestSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    // Validate request body with SSRF protection
    const validation = await validateRequest(request, rssRequestSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { url } = validation.data;

    const items = await fetchRSSFeed(url);
    const processedItems = items.map((item) => ({
      ...item,
      content: truncateContent(item.content, 1000),
    }));

    return NextResponse.json({ items: processedItems });
  } catch (error) {
    console.error('Error fetching RSS:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSS feed' },
      { status: 500 }
    );
  }
}
