import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Newspaper } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { NewsArticle } from '../types';

export default function News() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/news', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setArticles(await res.json());
      }
    } catch (err) {
      console.error('Failed to load news:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient">BTS & K-Pop News</h1>
        <button onClick={loadNews} className="btn-primary flex items-center gap-2">
          <Newspaper size={18} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-8">
          <p className="text-text-muted">Loading latest news...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-text-muted">No articles found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {articles.map((article, idx) => (
            <motion.a
              key={idx}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card bg-surface border-border hover:border-bts-purple/50 flex items-start gap-4 group"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-text group-hover:text-bts-purple transition-colors mb-1">
                  {article.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>{article.source}</span>
                  <span>•</span>
                  <span>{new Date(article.pubDate).toLocaleDateString()}</span>
                </div>
              </div>
              <ExternalLink size={18} className="text-text-muted group-hover:text-bts-purple transition-colors flex-shrink-0" />
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
}
