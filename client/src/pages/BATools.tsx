import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, FileText, CheckSquare, Users, AlertTriangle, ListTodo, Gavel } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuthStore } from '../stores/authStore';

const tools = [
  { id: 'status-report', label: 'Status Report', icon: FileText, desc: 'Project status updates' },
  { id: 'user-story', label: 'User Story', icon: CheckSquare, desc: 'Agile user stories' },
  { id: 'raci', label: 'RACI Matrix', icon: Users, desc: 'Role responsibility matrix' },
  { id: 'risk-register', label: 'Risk Register', icon: AlertTriangle, desc: 'Risk tracking' },
  { id: 'requirements', label: 'Requirements', icon: ListTodo, desc: 'Requirements documentation' },
  { id: 'decision-log', label: 'Decision Log', icon: Gavel, desc: 'Decision tracking' },
];

export default function BATools() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const token = useAuthStore((s) => s.token);

  const tool = tools.find((t) => t.id === selectedTool);

  const generate = async () => {
    if (!selectedTool || !input.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/ba-tools/${selectedTool}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ input }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.content);
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gradient">BA/PM Tools</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {!selectedTool ? (
            <div className="grid grid-cols-2 gap-3">
              {tools.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTool(t.id)}
                    className="card bg-surface border-border hover:border-bts-purple/50 text-left group"
                  >
                    <Icon size={24} className="text-bts-purple group-hover:text-gold mb-2" />
                    <h3 className="font-semibold text-text">{t.label}</h3>
                    <p className="text-xs text-text-muted mt-1">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="card bg-surface border-border">
              <button
                onClick={() => {
                  setSelectedTool(null);
                  setInput('');
                  setResult('');
                }}
                className="text-sm text-text-muted hover:text-text mb-4"
              >
                ← Back to tools
              </button>

              <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
                {tool && <tool.icon size={18} />}
                {tool?.label}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Input</label>
                  <textarea
                    placeholder={`Describe what you need for ${tool?.label.toLowerCase()}...`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="input-field w-full resize-none"
                    rows={6}
                  />
                </div>

                <button
                  onClick={generate}
                  disabled={loading || !input.trim()}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
                  Generate
                </button>
              </div>
            </div>
          )}
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card bg-surface border-border"
          >
            <h3 className="font-semibold text-text mb-3">Output</h3>
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
