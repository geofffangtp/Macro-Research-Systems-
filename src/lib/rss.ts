import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: ['content:encoded', 'dc:creator'],
  },
});

export interface RSSItem {
  title: string;
  content: string;
  link: string;
  author: string;
  pubDate: string;
}

export async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.map((item) => ({
      title: item.title || '',
      content: item['content:encoded'] || item.contentSnippet || item.content || '',
      link: item.link || '',
      author: item['dc:creator'] || item.creator || feed.title || '',
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return [];
  }
}

export async function fetchMultipleFeeds(
  feeds: { name: string; url: string }[]
): Promise<{ source: string; items: RSSItem[] }[]> {
  const results = await Promise.all(
    feeds.map(async (feed) => {
      const items = await fetchRSSFeed(feed.url);
      return { source: feed.name, items };
    })
  );
  return results;
}

// Common Substack RSS URL patterns
export function getSubstackRSSUrl(substackName: string): string {
  // Most Substacks follow this pattern
  return `https://${substackName}.substack.com/feed`;
}

// Strip HTML tags from content
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// Truncate content to a reasonable length
export function truncateContent(content: string, maxLength: number = 500): string {
  const stripped = stripHtml(content);
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength) + '...';
}
