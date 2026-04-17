import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuthStore } from '../stores/authStore';

export default function Research() {
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState<'quick' | 'deep'>('quick');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ topic: string; content: string } | null>(null);
  const [error, setError] = useState('');

  const token = useAuthStore((s) => s.token);

  const conductResearch = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic, depth }),
      });
      if (res.ok) {
        setResult(await res.json());
      } else {
        setError('Research failed. Please try again.');
      }
    } catch (err) {
      console.error('Research failed:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gradient">AI Research Assistant</h1>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="card bg-surface border-border">
        <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Search size={18} />
          Research Topic
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">What would you like to research?</label>
            <textarea
              placeholder="Enter your research topic..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input-field w-full resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Depth</label>
            <div className="flex gap-3">
              <button
                onClick={() => setDepth('quick')}
                className={`flex-1 p-3 rounded-lg transition-all ${
                  depth === 'quick'
                    ? 'bg-bts-purple text-white'
                    : 'bg-surface-hover text-text-muted hover:bg-bts-purple/20'
                }`}
              >
                Quick Summary
              </button>
              <button
                onClick={() => setDepth('deep')}
                className={`flex-1 p-3 rounded-lg transition-all ${
                  depth === 'deep'
                    ? 'bg-bts-purple text-white'
                    : 'bg-surface-hover text-text-muted hover:bg-bts-purple/20'
                }`}
              >
                Deep Dive
              </button>
            </div>
          </div>

          <button
            onClick={conductResearch}
            disabled={loading || !topic.trim()}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            Conduct Research
          </button>
        </div>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-surface border-border"
        >
          <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
            <FileText size={18} />
            Research Results
          </h3>
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.content}</ReactMarkdown>
          </div>
        </motion.div>
      )}
    </div>
  );
}
