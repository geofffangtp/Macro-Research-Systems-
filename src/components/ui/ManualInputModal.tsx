'use client';

import { useState } from 'react';
import { X, Link, Twitter, FileText, Lightbulb } from 'lucide-react';
import { useAppStore } from '@/store';
import { ManualInput } from '@/types';

interface ManualInputModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManualInputModal({ isOpen, onClose }: ManualInputModalProps) {
  const { addSourceItem, sources } = useAppStore();
  const [inputType, setInputType] = useState<ManualInput['type']>('tweet');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Find or create a manual source
      let manualSource = sources.find((s) => s.platform === 'manual');
      if (!manualSource) {
        // Use a default manual source ID
        manualSource = {
          id: 'manual-source',
          handle: 'manual',
          name: 'Manual Input',
          focus: 'User-submitted content',
          style: 'Various',
          tier: 'tier1',
          weight: 1.0,
          platform: 'manual',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      addSourceItem({
        sourceId: manualSource.id,
        title: inputType === 'tweet' ? `Tweet from ${author || 'Unknown'}` : content.slice(0, 50),
        content,
        url: url || undefined,
        author: author || undefined,
        publishedAt: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        isRead: false,
        isFlagged: false,
        category: inputType,
      });

      // Reset form
      setContent('');
      setUrl('');
      setAuthor('');
      onClose();
    } catch (error) {
      console.error('Error adding content:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputTypes = [
    { id: 'tweet' as const, label: 'Tweet', icon: Twitter },
    { id: 'article' as const, label: 'Article', icon: FileText },
    { id: 'thought' as const, label: 'Thought', icon: Lightbulb },
    { id: 'note' as const, label: 'Note', icon: Link },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Add Content
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Input Type Selector */}
        <div className="mb-4 flex gap-2">
          {inputTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setInputType(type.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  inputType === type.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon size={16} />
                {type.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Author field for tweets */}
          {inputType === 'tweet' && (
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Author Handle
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="@username"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          )}

          {/* Content field */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                inputType === 'tweet'
                  ? 'Paste tweet content...'
                  : inputType === 'article'
                  ? 'Paste article excerpt or summary...'
                  : 'Enter your thoughts or notes...'
              }
              rows={6}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          {/* URL field */}
          {(inputType === 'tweet' || inputType === 'article') && (
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                URL (optional)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          )}

          {/* Submit button */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
