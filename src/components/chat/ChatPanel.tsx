'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, MessageSquare, Sparkles, Globe, ChevronDown, ChevronUp, X, BookmarkPlus, Save, Maximize2, Minimize2, BookOpen, Zap, Settings, Swords, FileText, ListTree, ToggleLeft, ToggleRight, Copy, Check, TrendingUp, Download, RefreshCw, Sparkle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAppStore } from '@/store';
import { SaveToKBModal } from './SaveToKBModal';
import { SaveConversationModal } from './SaveConversationModal';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Clean mode quick actions - general research questions
const CLEAN_QUICK_ACTIONS = [
  { label: "Explain a concept", prompt: "Explain " },
  { label: "Bull vs bear case", prompt: "What are the bull and bear cases for " },
  { label: "Second-order effects", prompt: "What are the second-order effects of " },
  { label: "Historical parallels", prompt: "What historical parallels exist for " },
];

// Context mode quick actions - thesis-specific
const CONTEXT_QUICK_ACTIONS = [
  { label: "Thesis impact", prompt: "How does today's news affect my thesis? Be specific." },
  { label: "Challenge my view", prompt: "Steel man the case against my thesis. What am I missing?" },
  { label: "Update scenarios", prompt: "Should I update my scenario probabilities? Walk me through it." },
  { label: "Trade expressions", prompt: "What are 3 specific trade expressions for my thesis with bull/bear for each?" },
];

// Hot macro topics for quick access
const MACRO_TOPICS = [
  "Fed policy path",
  "China deflation",
  "Yen carry trade",
  "Credit spreads",
  "Oil supply/demand",
  "Fiscal dominance",
  "Dollar strength",
  "Yield curve",
];

// Slash commands for quick actions
const SLASH_COMMANDS = [
  { command: '/stock', description: 'Stock analysis', prompt: 'Give me a comprehensive investment analysis of ' },
  { command: '/industry', description: 'Industry for PE/VC', prompt: 'Analyze the [INDUSTRY] space for a growth equity investor. Cover: TAM, key players, what makes winners, deal multiples, and risks.' },
  { command: '/data', description: 'Data release reaction', prompt: 'The latest [DATA] came in at [X] vs [Y] expected. What does this mean?' },
  { command: '/bull', description: 'Bull case', prompt: 'Give me the strongest bull case for ' },
  { command: '/bear', description: 'Bear case', prompt: 'Give me the strongest bear case for ' },
  { command: '/compare', description: 'Compare two things', prompt: 'Compare and contrast ' },
  { command: '/explain', description: 'Explain concept', prompt: 'Explain ' },
  { command: '/thesis', description: 'Analyze vs thesis', prompt: 'How does this affect my thesis: ' },
];

// Analysis templates for common workflows
const ANALYSIS_TEMPLATES = [
  {
    name: "Stock Deep Dive",
    prompt: "Give me a comprehensive investment analysis of [TICKER]. Cover: business model, competitive moat, financial health (specific numbers), valuation vs history, key risks, and what would make you bullish vs bearish.",
  },
  {
    name: "PE Industry Scan",
    prompt: "Analyze the [INDUSTRY] space for a PE investor. Cover: TAM and growth rate, key players and positioning, what makes a winner, typical deal multiples (EV/Revenue, EV/EBITDA), and key investment risks.",
  },
  {
    name: "Macro Data Reaction",
    prompt: "The latest [DATA RELEASE] came in at [NUMBER] vs [EXPECTATION] expected. Walk me through: what this means, market implications, how it affects Fed policy, and what to watch next.",
  },
  {
    name: "Position Stress Test",
    prompt: "I'm [LONG/SHORT] [POSITION] based on [THESIS]. Steel man the case against me. What could make this trade blow up? What am I missing?",
  },
];

interface ChatPanelProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function ChatPanel({ isExpanded = false, onToggleExpand }: ChatPanelProps) {
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
  const [hoveredMessageIndex, setHoveredMessageIndex] = useState<number | null>(null);
  // Context mode toggle - default OFF (clean mode) so Claude isn't biased by thesis/KB
  const [contextMode, setContextMode] = useState(false);
  // Response length: 'concise' or 'detailed'
  const [responseLength, setResponseLength] = useState<'concise' | 'detailed'>('detailed');
  // Devil's advocate mode - always argue the opposite
  const [devilsAdvocate, setDevilsAdvocate] = useState(false);
  // Show follow-up suggestions
  const [suggestFollowUps, setSuggestFollowUps] = useState(true);
  // Settings panel open
  const [showSettings, setShowSettings] = useState(false);
  // Track which message was just copied
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  // Show thesis summary panel
  const [showThesisSummary, setShowThesisSummary] = useState(false);
  // Show slash command suggestions
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveConversationModalOpen, setSaveConversationModalOpen] = useState(false);
  const [messageToSave, setMessageToSave] = useState<{ assistant: string; user: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Copy message to clipboard
  const handleCopyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Export conversation to markdown
  const handleExportMarkdown = () => {
    if (messages.length === 0) return;

    const date = new Date().toISOString().split('T')[0];
    let markdown = `# Research Conversation - ${date}\n\n`;

    if (contextMode && thesis) {
      markdown += `> **Thesis Context:** ${thesis.name}\n\n`;
    }

    messages.forEach((msg) => {
      if (msg.role === 'user') {
        markdown += `## Question\n${msg.content}\n\n`;
      } else {
        markdown += `## Analysis\n${msg.content}\n\n---\n\n`;
      }
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Re-ask last question with current settings
  const handleReask = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      setInput(lastUserMessage.content);
      inputRef.current?.focus();
    }
  };

  // Summarize conversation
  const handleSummarize = async () => {
    if (messages.length < 2 || isLoading) return;

    setIsLoading(true);
    try {
      const conversationText = messages.map((m) => `${m.role}: ${m.content}`).join('\n\n');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Summarize this conversation in 3-5 bullet points. What were the key insights and conclusions?\n\n${conversationText}`,
          useContext: false,
          responseLength: 'concise',
          enableWebSearch: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev,
          { role: 'user' as const, content: '[Summarize conversation]' },
          { role: 'assistant' as const, content: data.response }
        ]);
      }
    } catch (err) {
      console.error('Summarize error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle save to KB - find the preceding user message
  const handleSaveToKB = (assistantIndex: number) => {
    const assistantMessage = messages[assistantIndex];
    // Find the most recent user message before this assistant message
    let userMessage = '';
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessage = messages[i].content;
        break;
      }
    }
    setMessageToSave({ assistant: assistantMessage.content, user: userMessage });
    setSaveModalOpen(true);
  };

  // Handle save entire conversation
  const handleSaveConversation = () => {
    if (messages.length >= 2) {
      setSaveConversationModalOpen(true);
    }
  };

  // Clear chat after saving to KB
  const handleClearChat = () => {
    setMessages([]);
    // Create a new session for continued chatting
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const newSession = createChatSession(`Research Session - ${today} (continued)`, 'general', currentDigest?.id);
    setActiveChatSession(newSession);
  };

  // Discard chat entirely without saving
  const handleDiscardChat = () => {
    if (messages.length === 0) return;
    if (window.confirm('Discard this conversation? It will not be saved.')) {
      setMessages([]);
      // Create a fresh session (the old one will be orphaned but that's fine)
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const newSession = createChatSession(`Research Session - ${today}`, 'general', currentDigest?.id);
      setActiveChatSession(newSession);
    }
  };

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
      // Only build and send context if context mode is enabled
      const requestBody: Record<string, unknown> = {
        message: userMessage,
        previousMessages: messages.slice(-10), // Last 10 messages for context
        enableWebSearch: true,
        useContext: contextMode, // Tell API which mode we're in
        responseLength,
        devilsAdvocate,
        suggestFollowUps,
      };

      // Only include context data if context mode is on
      if (contextMode) {
        requestBody.context = buildContext();
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
      if (showSlashCommands) {
        // Select first matching command
        const filtered = SLASH_COMMANDS.filter((c) =>
          c.command.toLowerCase().includes(slashFilter.toLowerCase())
        );
        if (filtered.length > 0) {
          handleSlashCommand(filtered[0]);
          return;
        }
      }
      sendMessage();
    }
    if (e.key === 'Escape' && showSlashCommands) {
      setShowSlashCommands(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Check for slash command
    if (value.startsWith('/')) {
      setShowSlashCommands(true);
      setSlashFilter(value.slice(1));
    } else {
      setShowSlashCommands(false);
    }
  };

  const handleSlashCommand = (cmd: typeof SLASH_COMMANDS[0]) => {
    setInput(cmd.prompt);
    setShowSlashCommands(false);
    inputRef.current?.focus();
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'k') {
        e.preventDefault();
        setShowSettings((prev) => !prev);
      }
      if (modifier && e.key === 'd' && !e.shiftKey) {
        e.preventDefault();
        setDevilsAdvocate((prev) => !prev);
      }
      if (modifier && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setContextMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
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
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            contextMode
              ? 'bg-gradient-to-br from-amber-500 to-orange-500'
              : 'bg-gradient-to-br from-indigo-500 to-violet-500'
          }`}>
            {contextMode ? <BookOpen size={16} className="text-white" /> : <Sparkles size={16} className="text-white" />}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Research Assistant</h3>
            <p className="text-xs text-slate-500">
              {contextMode ? 'Thesis context loaded' : 'Clean mode - unbiased'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Devil's Advocate Toggle */}
          {devilsAdvocate && (
            <span className="flex items-center gap-1 rounded-lg bg-red-100 px-2 py-1 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <Swords size={12} />
              Devil's Advocate
            </span>
          )}
          {/* Context Mode Toggle */}
          <button
            onClick={() => setContextMode(!contextMode)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              contextMode
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
            title={contextMode ? 'Turn off thesis context' : 'Turn on thesis context'}
          >
            {contextMode ? <BookOpen size={14} /> : <Zap size={14} />}
            <span className="hidden sm:inline">{contextMode ? 'Context' : 'Clean'}</span>
          </button>
          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`rounded-lg p-1.5 transition-colors ${
              showSettings
                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800'
            }`}
            title="Chat settings"
          >
            <Settings size={16} />
          </button>
          {/* Export to Markdown */}
          {messages.length >= 2 && (
            <button
              onClick={handleExportMarkdown}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              title="Export to markdown"
            >
              <Download size={14} />
            </button>
          )}
          {/* Summarize */}
          {messages.length >= 4 && (
            <button
              onClick={handleSummarize}
              disabled={isLoading}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 disabled:opacity-50"
              title="Summarize conversation"
            >
              <Sparkle size={14} />
            </button>
          )}
          {/* Re-ask with current settings */}
          {messages.length >= 2 && (
            <button
              onClick={handleReask}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              title="Re-ask last question"
            >
              <RefreshCw size={14} />
            </button>
          )}
          {/* Discard Chat Button */}
          {messages.length >= 1 && (
            <button
              onClick={handleDiscardChat}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              title="Discard conversation without saving"
            >
              <X size={14} />
              <span className="hidden sm:inline">Discard</span>
            </button>
          )}
          {/* Save Conversation Button */}
          {messages.length >= 2 && (
            <button
              onClick={handleSaveConversation}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
              title="Save entire conversation to Knowledge Base"
            >
              <Save size={14} />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}
          {/* Expand/Collapse Button */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              title={isExpanded ? 'Collapse chat' : 'Expand chat'}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}
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

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="grid grid-cols-2 gap-3">
            {/* Response Length */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Response Length</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setResponseLength('concise')}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                    responseLength === 'concise'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                >
                  <FileText size={12} className="inline mr-1" />
                  Concise
                </button>
                <button
                  onClick={() => setResponseLength('detailed')}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                    responseLength === 'detailed'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                >
                  <ListTree size={12} className="inline mr-1" />
                  Detailed
                </button>
              </div>
            </div>

            {/* Follow-up Suggestions */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Follow-ups</label>
              <button
                onClick={() => setSuggestFollowUps(!suggestFollowUps)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  suggestFollowUps
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-white text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}
              >
                <span>Suggest questions</span>
                {suggestFollowUps ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              </button>
            </div>

            {/* Devil's Advocate Mode */}
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Argument Mode</label>
              <button
                onClick={() => setDevilsAdvocate(!devilsAdvocate)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  devilsAdvocate
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-400'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Swords size={14} />
                  Devil's Advocate - Always argue the opposite
                </span>
                {devilsAdvocate ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thesis Summary Panel (context mode only) */}
      {contextMode && thesis && showThesisSummary && (
        <div className="border-b border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/10">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-amber-600 dark:text-amber-400" />
                <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200 truncate">{thesis.name}</h4>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 line-clamp-2">{thesis.summary}</p>
              {thesis.scenarios && thesis.scenarios.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {thesis.scenarios.map((s, i) => (
                    <span key={i} className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
                      {s.name}: {s.probability}%
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowThesisSummary(false)}
              className="text-amber-500 hover:text-amber-700 dark:text-amber-400"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Context indicator (collapsible) */}
      {showContext && (
        <div className={`border-b px-4 py-2 ${
          contextMode
            ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
            : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50'
        }`}>
          <p className="text-xs font-medium text-slate-500 mb-1">
            {contextMode ? 'Context being sent to Claude:' : 'Clean mode - no thesis context sent'}
          </p>
          <div className="flex flex-wrap gap-1">
            {contextMode ? (
              <>
                {currentDigest && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Today's Digest
                  </span>
                )}
                {thesis && (
                  <button
                    onClick={() => setShowThesisSummary(!showThesisSummary)}
                    className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 transition-colors"
                  >
                    Thesis: {thesis.name} {showThesisSummary ? '▲' : '▼'}
                  </button>
                )}
                {knowledgeEntries.length > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {knowledgeEntries.length} KB Entries
                  </span>
                )}
              </>
            ) : (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                No bias from thesis or prior research
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
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
              <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${
                contextMode
                  ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10'
                  : 'bg-gradient-to-br from-indigo-500/10 to-violet-500/10'
              }`}>
                {contextMode
                  ? <BookOpen size={24} className="text-amber-600 dark:text-amber-400" />
                  : <MessageSquare size={24} className="text-indigo-600 dark:text-indigo-400" />
                }
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                {contextMode ? 'Thesis Analysis Mode' : 'Your Research Partner'}
              </h4>
              <p className="mt-1 text-sm text-slate-500">
                {contextMode
                  ? 'I have your thesis, knowledge base, and digest loaded. Ask me how new info affects your views.'
                  : 'Ask anything. I\'ll explain clearly without assumptions or narrative bias.'
                }
              </p>
            </div>

            {/* Quick actions - different based on mode */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 text-center">
                {contextMode ? 'Thesis prompts:' : 'Get started:'}
              </p>
              <div className={`grid gap-2 ${isExpanded ? 'grid-cols-4' : 'grid-cols-2'}`}>
                {(contextMode ? CONTEXT_QUICK_ACTIONS : CLEAN_QUICK_ACTIONS).map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      // For prompts that end with space, put in input instead of sending
                      if (action.prompt.endsWith(' ')) {
                        setInput(action.prompt);
                        inputRef.current?.focus();
                      } else {
                        sendMessage(action.prompt);
                      }
                    }}
                    className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                      contextMode
                        ? 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:border-amber-700'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hot Topics */}
            {!contextMode && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-slate-500 text-center">Hot topics:</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {MACRO_TOPICS.map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(`Explain ${topic} and what I should be watching`);
                        inputRef.current?.focus();
                      }}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-indigo-700"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Templates */}
            {!contextMode && isExpanded && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-slate-500 text-center">Analysis templates:</p>
                <div className="grid grid-cols-2 gap-2">
                  {ANALYSIS_TEMPLATES.map((template, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(template.prompt);
                        inputRef.current?.focus();
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600 hover:border-violet-300 hover:bg-violet-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-300">{template.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mode hint */}
            <div className="mt-4 text-center">
              <button
                onClick={() => setContextMode(!contextMode)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {contextMode
                  ? '→ Switch to clean mode for unbiased answers'
                  : '→ Switch to context mode to analyze against your thesis'
                }
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            onMouseEnter={() => msg.role === 'assistant' && setHoveredMessageIndex(i)}
            onMouseLeave={() => setHoveredMessageIndex(null)}
          >
            <div className="relative group">
              <div
                className={`rounded-2xl px-4 py-2.5 ${
                  isExpanded ? 'max-w-[80%]' : 'max-w-[85%]'
                } ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                    : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0 prose-headings:my-2 prose-strong:text-slate-900 dark:prose-strong:text-white">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}
              </div>
              {/* Action buttons - only on assistant messages */}
              {msg.role === 'assistant' && hoveredMessageIndex === i && (
                <div className="absolute -right-2 -top-2 flex gap-1">
                  <button
                    onClick={() => handleCopyMessage(msg.content, i)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-500 text-white shadow-lg hover:bg-slate-600 transition-all"
                    title="Copy message"
                  >
                    {copiedIndex === i ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={() => handleSaveToKB(i)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transition-all"
                    title="Save to Knowledge Base"
                  >
                    <BookmarkPlus size={14} />
                  </button>
                </div>
              )}
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
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => input.startsWith('/') && setShowSlashCommands(true)}
              onBlur={() => setTimeout(() => setShowSlashCommands(false), 150)}
              placeholder={contextMode
                ? "How does [news] affect my thesis? (type / for commands)"
                : "Ask me anything... (type / for commands)"
              }
              rows={isExpanded ? 2 : 1}
              className={`w-full resize-none rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-white ${
                contextMode
                  ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500 dark:border-amber-700'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700'
              }`}
            />
            {/* Slash command suggestions */}
            {showSlashCommands && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
                <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-medium text-slate-500">Quick commands</p>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {SLASH_COMMANDS.filter((c) =>
                    c.command.toLowerCase().includes(slashFilter.toLowerCase()) ||
                    c.description.toLowerCase().includes(slashFilter.toLowerCase())
                  ).map((cmd, i) => (
                    <button
                      key={i}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSlashCommand(cmd)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <code className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                        {cmd.command}
                      </code>
                      <span className="text-xs text-slate-600 dark:text-slate-400">{cmd.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-slate-400 text-center">
          Enter to send • ⌘K settings • ⌘D devil's advocate • ⌘⇧C context
        </p>
      </div>

      {/* Save to KB Modal (single message) */}
      <SaveToKBModal
        isOpen={saveModalOpen}
        onClose={() => {
          setSaveModalOpen(false);
          setMessageToSave(null);
        }}
        assistantMessage={messageToSave?.assistant || ''}
        userMessage={messageToSave?.user || ''}
      />

      {/* Save Conversation Modal (entire conversation) */}
      <SaveConversationModal
        isOpen={saveConversationModalOpen}
        onClose={() => setSaveConversationModalOpen(false)}
        messages={messages}
        onSaveComplete={handleClearChat}
      />
    </div>
  );
}
