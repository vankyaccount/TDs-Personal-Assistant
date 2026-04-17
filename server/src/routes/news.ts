import { Router, Response } from 'express';
import Parser from 'rss-parser';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const parser = new Parser();

router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const feeds = [
      'https://news.google.com/rss/search?q=BTS+Bangtan+Boys&hl=en-US&gl=US&ceid=US:en',
      'https://www.allkpop.com/rss',
    ];

    const articles: any[] = [];
    const seenTitles = new Set<string>();

    for (const feedUrl of feeds) {
      try {
        const feed = await parser.parseURL(feedUrl);
        for (const item of feed.items.slice(0, 10)) {
          if (item.title && !seenTitles.has(item.title)) {
            seenTitles.add(item.title);
            articles.push({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate || new Date().toISOString(),
              source: feed.title || 'News',
            });
          }
        }
      } catch (err) {
        console.error(`Failed to fetch feed ${feedUrl}:`, err);
      }
      if (articles.length >= 20) break;
    }

    res.json(articles.slice(0, 20));
  } catch (err) {
    console.error('News error:', err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

export default router;
