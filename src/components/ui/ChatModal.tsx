'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store';

interface ChatModalProps {
  item: {
    title: string;
    content: string;
    source?: string;
  };
  onClose: () => void;
}

export function ChatModal({ item, onClose }: ChatModalProps) {
  const { thesis } = useAppStore();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item,
          message: userMessage,
          previousMessages: messages,
          thesis: thesis ? { summary: thesis.summary } : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
        ]);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Discuss This</h3>
            <p className="text-sm text-zinc-500 truncate max-w-md">{item.title}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Context */}
        <div className="border-b border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="text-xs font-medium text-zinc-500 mb-1">Context:</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3">{item.content}</p>
          {item.source && (
            <p className="mt-1 text-xs text-zinc-400">Source: @{item.source}</p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-zinc-500 py-8">
              <p>Ask questions about this content.</p>
              <p className="mt-2">Try:</p>
              <div className="mt-2 space-y-1">
                <button
                  onClick={() => setInput("What are the implications of this?")}
                  className="block mx-auto text-blue-600 hover:underline"
                >
                  "What are the implications of this?"
                </button>
                <button
                  onClick={() => setInput("How does this connect to my thesis?")}
                  className="block mx-auto text-blue-600 hover:underline"
                >
                  "How does this connect to my thesis?"
                </button>
                <button
                  onClick={() => setInput("What's the contrarian view here?")}
                  className="block mx-auto text-blue-600 hover:underline"
                >
                  "What's the contrarian view here?"
                </button>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg px-4 py-2">
                <Loader2 size={16} className="animate-spin text-zinc-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={1}
              className="flex-1 resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
