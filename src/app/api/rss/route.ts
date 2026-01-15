import { NextRequest, NextResponse } from 'next/server';
import { fetchRSSFeed, truncateContent } from '@/lib/rss';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

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
