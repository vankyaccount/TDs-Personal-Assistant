import { useState } from 'react';
import { Mic, Loader2, Upload, FileText } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function Meetings() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [structuring, setStructuring] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [structured, setStructured] = useState<any>(null);

  const token = useAuthStore((s) => s.token);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const transcribe = async () => {
    if (!file) return;

    setTranscribing(true);
    const formData = new FormData();
    formData.append('audio', file);

    try {
      const res = await fetch('/api/meetings/transcribe', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setTranscript(data.transcript);
      }
    } catch (err) {
      console.error('Transcription failed:', err);
    } finally {
      setTranscribing(false);
    }
  };

  const structure = async () => {
    if (!transcript) return;

    setStructuring(true);
    try {
      const res = await fetch('/api/meetings/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title || 'Meeting Notes', transcript }),
      });
      if (res.ok) {
        setStructured(await res.json());
      }
    } catch (err) {
      console.error('Structuring failed:', err);
    } finally {
      setStructuring(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gradient">Meeting Notes</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card bg-surface border-border">
            <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
              <Mic size={18} />
              Record or Upload
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Meeting Title</label>
                <input
                  type="text"
                  placeholder="e.g., Weekly Standup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Audio File</label>
                <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-bts-purple/50 transition-colors">
                  <Upload size={24} className="text-text-muted" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-text">
                      {file?.name || 'Click to upload audio'}
                    </p>
                    <p className="text-xs text-text-muted">MP3, WAV, WebM, etc.</p>
                  </div>
                  <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={transcribe}
                  disabled={!file || transcribing}
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                >
                  {transcribing ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />}
                  Transcribe
                </button>
                <button
                  onClick={structure}
                  disabled={!transcript || structuring}
                  className="flex-1 btn-gold py-3 flex items-center justify-center gap-2"
                >
                  {structuring ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
                  Structure Notes
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {transcript && (
            <div className="card bg-surface border-border">
              <h3 className="font-semibold text-text mb-3">Transcript</h3>
              <div className="bg-surface-hover rounded-lg p-3 max-h-60 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{transcript}</p>
              </div>
            </div>
          )}

          {structured && (
            <div className="card bg-surface border-border">
              <h3 className="font-semibold text-text mb-3">Structured Notes</h3>
              <div className="space-y-3">
                {structured.structuredNotes?.summary && (
                  <div>
                    <h4 className="text-sm font-medium text-bts-purple mb-1">Summary</h4>
                    <p className="text-sm text-text">{structured.structuredNotes.summary}</p>
                  </div>
                )}
                {structured.structuredNotes?.actionItems?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-bts-purple mb-1">Action Items</h4>
                    <ul className="text-sm text-text space-y-1">
                      {structured.structuredNotes.actionItems.map((item: any, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-gold">•</span>
                          <span>
                            {item.task} {item.assignee && <span className="text-text-muted">({item.assignee})</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {structured.structuredNotes?.decisions?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-bts-purple mb-1">Decisions</h4>
                    <ul className="text-sm text-text space-y-1">
                      {structured.structuredNotes.decisions.map((decision: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-gold">•</span>
                          <span>{decision}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
