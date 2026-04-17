import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { btsMembers } from '../../utils/btsData';

export default function MemberSelector() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const member = selectedMember ? btsMembers.find(m => m.id === selectedMember) : null;

  return (
    <div className="bg-surface rounded-lg p-4 border border-border">
      <h3 className="text-sm font-semibold text-text-muted mb-3">Chat Persona</h3>

      {/* Selected Member Display */}
      <AnimatePresence>
        {member && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 bg-bts-purple/10 rounded-lg border border-bts-purple/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-gold"
              />
              <div>
                <p className="font-semibold text-bts-purple">{member.name}</p>
                <p className="text-xs text-text-muted">{member.fullName}</p>
              </div>
            </div>
            <p className="text-xs text-text-muted">{member.role}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member Grid */}
      <div className="grid grid-cols-4 gap-2">
        {btsMembers.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setSelectedMember(m.id === selectedMember ? null : m.id);
              setExpanded(true);
            }}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
              selectedMember === m.id
                ? 'border-gold shadow-lg scale-105'
                : 'border-border hover:border-bts-purple'
            }`}
            title={m.name}
          >
            <img
              src={m.avatar}
              alt={m.name}
              className="w-full h-full object-cover"
            />
            {selectedMember === m.id && (
              <div className="absolute inset-0 bg-bts-purple/20 flex items-center justify-center">
                <span className="text-gold text-xs font-bold">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Clear Selection */}
      {selectedMember && (
        <button
          onClick={() => {
            setSelectedMember(null);
            setExpanded(false);
          }}
          className="mt-3 text-xs text-text-muted hover:text-text transition-colors w-full text-center"
        >
          Clear selection
        </button>
      )}
    </div>
  );
}
