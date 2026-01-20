'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, MessageSquare, Sparkles, Globe, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useAppStore } from '@/store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Quick action prompts
const QUICK_ACTIONS = [
  { label: "Today's key takeaways", prompt: "Summarize today's key takeaways and what's most important for my thesis." },
  { label: "What challenges my thesis?", prompt: "What from today's digest challenges or contradicts my current thesis? Be direct." },
  { label: "What should I watch?", prompt: "What are the key things I should be watching this week based on today's information?" },
  { label: "Second-order effects", prompt: "What are the second-order effects of today's main stories that I might be missing?" },
];

export function ChatPanel() {
  const {
    thesis,
    currentDigest,
    knowledgeEntries,
    chatSessions,
    activeChatSession,
    createChatSession,
    addMessageToSession,
    setActiveChatSession,
    getRecentOpenThreads,
  } = useAppStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get or create today's chat session
  const getTodaySession = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySession = chatSessions.find(
      (s) => s.createdAt.startsWith(today) && s.contextType === 'general'
    );
    return todaySession;
  }, [chatSessions]);

  // Initialize with today's session or create new one
  useEffect(() => {
    const todaySession = getTodaySession();
    if (todaySession) {
      setActiveChatSession(todaySession);
      setMessages(todaySession.messages.map((m) => ({ role: m.role, content: m.content })));
    } else if (!activeChatSession) {
      // Create new session for today
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const newSession = createChatSession(`Research Session - ${today}`, 'general', currentDigest?.id);
      setActiveChatSession(newSession);
    }
  }, []);

  // Sync messages from active session
  useEffect(() => {
    if (activeChatSession) {
      setMessages(activeChatSession.messages.map((m) => ({ role: m.role, content: m.content })));
    }
  }, [activeChatSession]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build context for the API
  const buildContext = () => {
    const context: Record<string, unknown> = {};

    // Current digest content
    if (currentDigest?.rawContent) {
      context.digest = {
        date: currentDigest.generatedAt,
        content: currentDigest.rawContent.slice(0, 8000), // Limit to avoid token overflow
      };
    }

    // Full thesis with scenarios and signals
    if (thesis) {
      context.thesis = {
        name: thesis.name,
        summary: thesis.summary,
        scenarios: thesis.scenarios,
        keyMonitors: thesis.keyMonitors,
        turningPointSignals: thesis.turningPointSignals,
      };
    }

    // Recent knowledge entries (last 30 days, watching status prioritized)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentKnowledge = knowledgeEntries
      .filter((e) => {
        const entryDate = new Date(e.createdAt);
        return entryDate >= thirtyDaysAgo || e.status === 'watching';
      })
      .sort((a, b) => {
        // Prioritize watching status
        if (a.status === 'watching' && b.status !== 'watching') return -1;
        if (b.status === 'watching' && a.status !== 'watching') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 15)
      .map((e) => ({
        topic: e.topic,
        conclusion: e.conclusion,
        thesisImpact: e.thesisImpact,
        catalystToWatch: e.catalystToWatch,
        status: e.status,
      }));

    if (recentKnowledge.length > 0) {
      context.knowledgeEntries = recentKnowledge;
    }

    // Open threads
    const openThreads = getRecentOpenThreads(7);
    if (openThreads.length > 0) {
      context.openThreads = openThreads.map((t) => ({
        content: t.content,
        createdDate: t.createdDate,
      }));
    }

    return context;
  };

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isLoading) return;

    setInput('');
    const newUserMessage: Message = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    // Save user message to session
    if (activeChatSession) {
      addMessageToSession(activeChatSession.id, { role: 'user', content: userMessage });
    }

    try {
      const context = buildContext();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          previousMessages: messages.slice(-10), // Last 10 messages for context
          context,
          enableWebSearch: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = { role: 'assistant', content: data.response };
        setMessages((prev) => [...prev, assistantMessage]);

        // Save assistant message to session
        if (activeChatSession) {
          addMessageToSession(activeChatSession.id, { role: 'assistant', content: data.response });
        }
      } else {
        const errorMsg = 'Sorry, I encountered an error. Please try again.';
        setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Focus chat when "Discuss" is clicked (via custom event)
  useEffect(() => {
    const handleDiscuss = (e: CustomEvent) => {
      setIsMinimized(false);
      inputRef.current?.focus();
      if (e.detail?.prompt) {
        setInput(e.detail.prompt);
      }
    };

    window.addEventListener('discuss-item' as any, handleDiscuss as EventListener);
    return () => window.removeEventListener('discuss-item' as any, handleDiscuss as EventListener);
  }, []);

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-white shadow-lg hover:shadow-xl transition-all"
        >
          <MessageSquare size={20} />
          <span className="font-medium">Research Chat</span>
          {messages.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
              {messages.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Research Assistant</h3>
            <p className="text-xs text-slate-500">Full context loaded</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowContext(!showContext)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            title="View loaded context"
          >
            {showContext ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Context indicator (collapsible) */}
      {showContext && (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-800/50">
          <p className="text-xs font-medium text-slate-500 mb-1">Loaded Context:</p>
          <div className="flex flex-wrap gap-1">
            {currentDigest && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                Today's Digest
              </span>
            )}
            {thesis && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                Thesis: {thesis.name}
              </span>
            )}
            {knowledgeEntries.length > 0 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {knowledgeEntries.length} Knowledge Entries
              </span>
            )}
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Globe size={10} className="inline mr-0.5" />
              Web Search
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="py-8">
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
                <MessageSquare size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Your Research Partner</h4>
              <p className="mt-1 text-sm text-slate-500">
                I have context on today's digest, your thesis, and accumulated knowledge.
              </p>
            </div>

            {/* Quick actions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 text-center">Quick prompts:</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(action.prompt)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                  : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-500" />
                <span className="text-sm text-slate-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the digest, thesis, or market developments..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-slate-400 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
