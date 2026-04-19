import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mail,
  CheckSquare,
  Mic,
  Search,
  Newspaper,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { getRandomQuote } from '../utils/btsQuotes';

const quickLinks = [
  { path: '/chat', label: 'Start Chat', icon: MessageSquare, color: 'bts-purple' },
  { path: '/email', label: 'Draft Email', icon: Mail, color: 'hot-pink' },
  { path: '/tasks', label: 'View Tasks', icon: CheckSquare, color: 'gold' },
  { path: '/meetings', label: 'Meeting Notes', icon: Mic, color: 'lavender' },
  { path: '/research', label: 'Research', icon: Search, color: 'bts-purple' },
  { path: '/news', label: 'BTS News', icon: Newspaper, color: 'hot-pink' },
  { path: '/ba-tools', label: 'BA Tools', icon: Briefcase, color: 'gold' },
];

export default function Dashboard() {
  const [quote, setQuote] = useState(() => getRandomQuote());

  useEffect(() => {
    // Get a new random quote on mount
    setQuote(getRandomQuote());
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gradient mb-2">
          Welcome to Tanya's PA
        </h1>
        <p className="text-lg text-text-muted korean-accent mb-4">
          보라해 💜 Your BTS-themed personal assistant
        </p>
        <p className="text-sm text-text-muted max-w-2xl mx-auto">
          Your all-in-one productivity companion featuring AI chat, email drafting, task management,
          meeting notes, research tools, and more — all with a BTS twist.
        </p>
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="group"
          >
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              className="card bg-surface border-border hover:border-bts-purple/50"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-${link.color}/20 text-${link.color}`}>
                  <link.icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text group-hover:text-bts-purple transition-colors">
                    {link.label}
                  </h3>
                  <p className="text-sm text-text-muted">
                    {getLinkDescription(link.label)}
                  </p>
                </div>
                <Sparkles size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* BTS Quote of the Moment */}
      <motion.div
        key={quote.korean}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="card bg-gradient-to-br from-bts-purple/20 to-lavender/20 border-gold/30"
      >
        <p className="text-center text-text italic korean-accent">
          "{quote.korean}" — {quote.english}
        </p>
        <p className="text-center text-xs text-text-muted mt-2">— {quote.source}</p>
      </motion.div>
    </motion.div>
  );
}

function getLinkDescription(label: string): string {
  const descriptions: Record<string, string> = {
    'Start Chat': 'Chat with BTS member personas',
    'Draft Email': 'AI-powered email templates',
    'View Tasks': 'Eisenhower Matrix task manager',
    'Meeting Notes': 'Transcribe & structure meetings',
    'Research': 'Structured AI research',
    'BTS News': 'Latest K-pop headlines',
    'BA Tools': 'PM/BA productivity suite',
  };
  return descriptions[label] || 'Get started';
}
