import { useState } from 'react';
import { Mail, Loader2, Copy, Check } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const templates = [
  { id: 'client', label: 'Client Communication', desc: 'Project updates, deliverables, timelines' },
  { id: 'leadership', label: 'Leadership Update', desc: 'Status reports, escalations, decisions' },
  { id: 'team', label: 'Team Coordination', desc: 'Task assignments, collaboration, meetings' },
];

export default function Email() {
  const [template, setTemplate] = useState('client');
  const [tone, setTone] = useState(50);
  const [context, setContext] = useState('');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const token = useAuthStore((s) => s.token);

  const generateDraft = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ template, tone, context, recipient }),
      });
      if (res.ok) {
        setDraft(await res.json());
      }
    } catch (err) {
      console.error('Failed to generate draft:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (draft) {
      navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gradient">Email Drafter</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card bg-surface border-border">
            <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
              <Mail size={18} />
              Email Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Template</label>
                <div className="grid gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        template === t.id
                          ? 'bg-bts-purple text-white border-2 border-bts-purple'
                          : 'bg-surface-hover border-2 border-border hover:border-bts-purple/50'
                      }`}
                    >
                      <p className="font-medium">{t.label}</p>
                      <p className="text-xs opacity-75">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Tone: {tone <= 25 ? 'Formal' : tone <= 50 ? 'Professional' : tone <= 75 ? 'Friendly' : 'Casual'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="25"
                  value={tone}
                  onChange={(e) => setTone(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>Formal</span>
                  <span>Professional</span>
                  <span>Friendly</span>
                  <span>Casual</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Recipient (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., John Smith, Project Team"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Context</label>
                <textarea
                  placeholder="Describe what you want to communicate..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="input-field w-full resize-none"
                  rows={4}
                />
              </div>

              <button
                onClick={generateDraft}
                disabled={loading || !context.trim()}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Mail size={20} />}
                Generate Email
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-surface border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text">Preview</h3>
            {draft && (
              <button
                onClick={copyToClipboard}
                className="btn-gold text-sm py-2 px-3 flex items-center gap-2"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          {draft ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Subject</label>
                <div className="bg-surface-hover rounded-lg p-3 border border-border">
                  {draft.subject}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Body</label>
                <div className="bg-surface-hover rounded-lg p-3 border border-border whitespace-pre-wrap">
                  {draft.body}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted">
              <Mail size={48} className="mx-auto mb-3 opacity-50" />
              <p>Fill in the settings and generate your email</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
