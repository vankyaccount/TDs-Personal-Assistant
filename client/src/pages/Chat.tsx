import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Trash2, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { btsMembers, getMemberById } from '../utils/btsData';
import type { Message } from '../types';
import 'highlight.js/styles/github-dark.css';

export default function Chat() {
  const [input, setInput] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const token = useAuthStore((s) => s.token);
  const conversations = useChatStore((s) => s.conversations);
  const activeConversation = useChatStore((s) => s.activeConversation);
  const messages = useChatStore((s) => s.messages);
  const setConversations = useChatStore((s) => s.setConversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const setMessages = useChatStore((s) => s.setMessages);
  const addMessage = useChatStore((s) => s.addMessage);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveConversation(data);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const startNewChat = async () => {
    setActiveConversation(null);
    setMessages([]);
    setSelectedPersona(null);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(conversations.filter((c) => c.id !== id));
      if (activeConversation?.id === id) {
        startNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    const messagesToSend = [...messages, userMessage];

    if (selectedPersona) {
      const member = btsMembers.find(m => m.id === selectedPersona);
      if (member) {
        messagesToSend.unshift({
          id: 'system',
          role: 'system' as any,
          content: member.systemPrompt,
          createdAt: new Date().toISOString(),
        } as any);
      }
    }

    setInput('');
    addMessage(userMessage);
    setStreaming(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: messagesToSend,
          conversationId: activeConversation?.id,
          persona: selectedPersona,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Chat failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let conversationId = activeConversation?.id;

      if (reader) {
        const assistantMsgObj: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
        };
        addMessage(assistantMsgObj);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

          for (const line of lines) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              setStreaming(false);
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.conversationId) conversationId = parsed.conversationId;
              if (parsed.content) {
                assistantMessage += parsed.content;
                const current = messages;
                const newMessages = [...current];
                const lastIdx = newMessages.length - 1;
                if (newMessages[lastIdx]?.role === 'assistant') {
                  newMessages[lastIdx] = { ...newMessages[lastIdx], content: assistantMessage };
                }
                setMessages(newMessages);
              }
            } catch {}
          }
        }

        if (conversationId) {
          await loadConversations();
          await loadMessages(conversationId);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat error:', err);
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-8rem)]">
      <div className="hidden md:flex w-64 lg:w-72 bg-surface rounded-lg border border-border flex-col flex-shrink-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-text">Conversations</h3>
          <button
            onClick={startNewChat}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-bts-purple"
            title="New chat"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <AnimatePresence>
            {conversations.map((conv) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => loadMessages(conv.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all group ${
                  activeConversation?.id === conv.id
                    ? 'bg-bts-purple text-white'
                    : 'hover:bg-surface-hover text-text-muted'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{conv.title}</p>
                    {conv.persona && <p className="text-xs opacity-75 capitalize">{conv.persona}</p>}
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-surface rounded-lg border border-border">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <h3 className="text-xl font-semibold text-gradient mb-2">Start a conversation</h3>
                <p className="text-text-muted text-sm">
                  {selectedPersona
                    ? `Chatting as ${btsMembers.find(m => m.id === selectedPersona)?.name}`
                    : 'Select a BTS member persona or start chatting'}
                </p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg, idx) => {
                const member = selectedPersona ? getMemberById(selectedPersona) : null;
                return (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && member ? (
                      <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[80%]">
                        <span className="text-xs font-semibold text-text-muted ml-14" style={{ color: member.accentColor }}>{member.name} says...</span>
                        <div className="flex gap-2 items-start">
                          <motion.img
                            src={member.avatar}
                            alt={member.name}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            style={{ border: `2px solid ${member.accentColor}` }}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <div
                            className="rounded-lg p-4 bg-surface-hover text-text flex-1 min-w-0"
                            style={{ borderLeft: `4px solid ${member.accentColor}` }}
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                              className="prose prose-invert prose-sm max-w-none"
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ) : msg.role === 'assistant' ? (
                      <div className="rounded-lg p-4 bg-surface-hover text-text max-w-[80%]">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                          className="prose prose-invert prose-sm max-w-none"
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="max-w-[80%] rounded-lg p-4 bg-bts-purple text-white">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
              {streaming && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  {selectedPersona && getMemberById(selectedPersona) ? (
                    <div className="flex gap-2 items-start">
                      <motion.img
                        src={getMemberById(selectedPersona)!.avatar}
                        alt="Typing..."
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        style={{ border: `2px solid ${getMemberById(selectedPersona)!.accentColor}` }}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <div className="bg-surface-hover rounded-lg p-4" style={{ borderLeft: `4px solid ${getMemberById(selectedPersona)!.accentColor}` }}>
                        <Loader2 size={20} className="animate-spin" style={{ color: getMemberById(selectedPersona)!.accentColor }} />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-surface-hover rounded-lg p-4">
                      <Loader2 size={20} className="animate-spin text-bts-purple" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedPersona(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                !selectedPersona
                  ? 'bg-bts-purple text-white'
                  : 'bg-surface hover:bg-surface-hover text-text-muted'
              }`}
            >
              Standard
            </button>
            {btsMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedPersona(member.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all text-white`}
                style={selectedPersona === member.id ? { backgroundColor: member.accentColor } : { backgroundColor: 'transparent', color: '#b0b9c3' }}
              >
                {member.name}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 input-field resize-none"
              rows={1}
              disabled={streaming}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              className="btn-primary px-4 disabled:opacity-50"
            >
              {streaming ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
