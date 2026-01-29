'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, BookOpen, Tag, Eye, CheckCircle, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/store';

interface ExtractedConversationKnowledge {
  topic: string;
  questionsAsked: string[];
  thesisImpact: string;
  keyInsights: string[];
  conclusion: string;
  catalystToWatch?: string;
  tags: string[];
  status: 'open' | 'closed' | 'watching';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SaveConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSaveComplete?: () => void;
}

export function SaveConversationModal({ isOpen, onClose, messages, onSaveComplete }: SaveConversationModalProps) {
  const { addKnowledgeEntry, knowledgeEntries, thesis } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [topic, setTopic] = useState('');
  const [questionsAsked, setQuestionsAsked] = useState<string[]>(['']);
  const [thesisImpact, setThesisImpact] = useState('');
  const [keyInsights, setKeyInsights] = useState<string[]>(['']);
  const [conclusion, setConclusion] = useState('');
  const [catalystToWatch, setCatalystToWatch] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<'open' | 'closed' | 'watching'>('watching');

  // Extract knowledge when modal opens
  useEffect(() => {
    if (isOpen && messages.length >= 2) {
      extractKnowledge();
    }
  }, [isOpen, messages]);

  const extractKnowledge = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const existingTopics = knowledgeEntries.map((e) => e.topic);
      const response = await fetch('/api/knowledge/extract-from-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          existingTopics,
          thesisContext: thesis?.summary,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract knowledge');
      }

      const data = await response.json();
      const extracted: ExtractedConversationKnowledge = data.extracted;

      // Pre-fill form with extracted data
      setTopic(extracted.topic);
      setQuestionsAsked(extracted.questionsAsked.length > 0 ? extracted.questionsAsked : ['']);
      setThesisImpact(extracted.thesisImpact);
      setKeyInsights(extracted.keyInsights.length > 0 ? extracted.keyInsights : ['']);
      setConclusion(extracted.conclusion);
      setCatalystToWatch(extracted.catalystToWatch || '');
      setTags(extracted.tags);
      setStatus(extracted.status);
    } catch (err) {
      console.error('Error extracting knowledge:', err);
      setError('Failed to analyze conversation. You can still fill in the fields manually.');
      // Set defaults
      setTopic('');
      setQuestionsAsked(['']);
      setThesisImpact('');
      setKeyInsights(['']);
      setConclusion('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestionsAsked([...questionsAsked, '']);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questionsAsked.length > 1) {
      setQuestionsAsked(questionsAsked.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questionsAsked];
    newQuestions[index] = value;
    setQuestionsAsked(newQuestions);
  };

  const handleAddInsight = () => {
    setKeyInsights([...keyInsights, '']);
  };

  const handleRemoveInsight = (index: number) => {
    if (keyInsights.length > 1) {
      setKeyInsights(keyInsights.filter((_, i) => i !== index));
    }
  };

  const handleInsightChange = (index: number, value: string) => {
    const newInsights = [...keyInsights];
    newInsights[index] = value;
    setKeyInsights(newInsights);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!topic.trim() || !conclusion.trim()) {
      setError('Topic and conclusion are required');
      return;
    }

    setIsSaving(true);

    try {
      const filteredInsights = keyInsights.filter((i) => i.trim());
      const filteredQuestions = questionsAsked.filter((q) => q.trim());
      const today = new Date().toISOString().split('T')[0];

      // Create a rich sourceRef that captures the conversation context
      const sourceRef = `Conversation (${today}): ${filteredQuestions.length > 0 ? filteredQuestions[0].slice(0, 40) : topic}...`;

      // Combine questions asked into the key insights or as a prefix to conclusion
      const fullConclusion = filteredQuestions.length > 0
        ? `Questions explored: ${filteredQuestions.join('; ')}\n\n${conclusion.trim()}`
        : conclusion.trim();

      addKnowledgeEntry({
        topic: topic.trim(),
        dateCreated: today,
        thesisImpact: thesisImpact.trim(),
        keyInsights: filteredInsights.length > 0 ? filteredInsights : [conclusion.slice(0, 200)],
        conclusion: fullConclusion,
        catalystToWatch: catalystToWatch.trim() || undefined,
        sourceRef,
        status,
        relatedItemIds: [],
        tags,
      });

      // Clear the chat after saving
      if (onSaveComplete) {
        onSaveComplete();
      }

      onClose();
    } catch (err) {
      console.error('Error saving to KB:', err);
      setError('Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const messageCount = messages.length;
  const userMessageCount = messages.filter((m) => m.role === 'user').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <MessageSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Save Conversation to KB
              </h3>
              <p className="text-xs text-slate-500">
                {messageCount} messages ({userMessageCount} questions)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <p className="mt-3 text-sm text-slate-500">Analyzing conversation...</p>
            <p className="mt-1 text-xs text-slate-400">Extracting key insights from {messageCount} messages</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                {error}
              </div>
            )}

            {/* Topic */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Topic *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Healthcare Policy & Medicare Advantage"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Questions Asked */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Questions Explored
              </label>
              {questionsAsked.map((question, index) => (
                <div key={index} className="mb-2 flex gap-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => handleQuestionChange(index, e.target.value)}
                    placeholder="What question did you explore?"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  {questionsAsked.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(index)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-800"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                + Add another question
              </button>
            </div>

            {/* Thesis Impact */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Thesis Impact
              </label>
              <input
                type="text"
                value={thesisImpact}
                onChange={(e) => setThesisImpact(e.target.value)}
                placeholder="How does this affect your investment thesis?"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Key Insights */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Key Insights
              </label>
              {keyInsights.map((insight, index) => (
                <div key={index} className="mb-2 flex gap-2">
                  <input
                    type="text"
                    value={insight}
                    onChange={(e) => handleInsightChange(index, e.target.value)}
                    placeholder="Add an insight..."
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  {keyInsights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveInsight(index)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-800"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddInsight}
                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                + Add another insight
              </button>
            </div>

            {/* Conclusion */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Conclusion *
              </label>
              <textarea
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                placeholder="The main takeaway from this research conversation..."
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Catalyst to Watch */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Catalyst to Watch
              </label>
              <input
                type="text"
                value={catalystToWatch}
                onChange={(e) => setCatalystToWatch(e.target.value)}
                placeholder="e.g., Final Medicare rates announced in April"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Status
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'watching', label: 'Watching', icon: Eye },
                  { value: 'open', label: 'Open', icon: BookOpen },
                  { value: 'closed', label: 'Closed', icon: CheckCircle },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(option.value as typeof status)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                        status === option.value
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon size={14} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <Tag size={10} />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-0.5 text-slate-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add a tag..."
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !topic.trim() || !conclusion.trim()}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Save Conversation
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
