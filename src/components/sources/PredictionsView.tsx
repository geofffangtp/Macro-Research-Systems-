'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import {
  Plus,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export function PredictionsView() {
  const { predictions, addPrediction, updatePrediction } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  const filteredPredictions = predictions.filter((p) => {
    if (filter === 'pending') return p.status === 'pending';
    if (filter === 'resolved') return p.status !== 'pending';
    return true;
  });

  const stats = {
    total: predictions.length,
    pending: predictions.filter((p) => p.status === 'pending').length,
    correct: predictions.filter((p) => p.status === 'correct').length,
    incorrect: predictions.filter((p) => p.status === 'incorrect').length,
    partial: predictions.filter((p) => p.status === 'partial').length,
  };

  const accuracy =
    stats.correct + stats.incorrect > 0
      ? ((stats.correct / (stats.correct + stats.incorrect)) * 100).toFixed(0)
      : '--';

  return (
    <div className="mx-auto max-w-4xl">
      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Total Predictions</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
            {stats.total}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Pending</p>
          <p className="text-2xl font-semibold text-amber-600">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Accuracy</p>
          <p className="text-2xl font-semibold text-green-600">{accuracy}%</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Correct / Incorrect</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
            <span className="text-green-600">{stats.correct}</span>
            <span className="text-zinc-400"> / </span>
            <span className="text-red-600">{stats.incorrect}</span>
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === 'pending'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === 'resolved'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            Resolved ({stats.total - stats.pending})
          </button>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Prediction
        </button>
      </div>

      {/* Predictions List */}
      <div className="space-y-3">
        {filteredPredictions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <Target size={32} className="mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500">No predictions yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Add your first prediction
            </button>
          </div>
        ) : (
          filteredPredictions.map((prediction) => (
            <PredictionCard
              key={prediction.id}
              prediction={prediction}
              onUpdate={(updates) => updatePrediction(prediction.id, updates)}
            />
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddPredictionModal
          onClose={() => setShowAddModal(false)}
          onSave={(prediction) => {
            addPrediction(prediction);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

interface PredictionCardProps {
  prediction: {
    id: string;
    date: string;
    source: string;
    prediction: string;
    timeframe: string;
    confidence: string;
    status: string;
    outcome?: string;
  };
  onUpdate: (updates: Record<string, unknown>) => void;
}

function PredictionCard({ prediction, onUpdate }: PredictionCardProps) {
  const [showResolve, setShowResolve] = useState(false);
  const [outcome, setOutcome] = useState('');

  const statusIcons = {
    pending: <Clock size={16} className="text-amber-500" />,
    correct: <CheckCircle size={16} className="text-green-500" />,
    incorrect: <XCircle size={16} className="text-red-500" />,
    partial: <AlertTriangle size={16} className="text-yellow-500" />,
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    correct: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    incorrect: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  };

  const confidenceColors = {
    low: 'text-zinc-500',
    medium: 'text-zinc-700 dark:text-zinc-300',
    high: 'text-zinc-900 dark:text-white font-medium',
  };

  const handleResolve = (status: 'correct' | 'incorrect' | 'partial') => {
    onUpdate({
      status,
      outcome: outcome || undefined,
      resolvedAt: new Date().toISOString(),
    });
    setShowResolve(false);
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {statusIcons[prediction.status as keyof typeof statusIcons]}
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[prediction.status as keyof typeof statusColors]}`}>
              {prediction.status}
            </span>
            <span className={`text-xs ${confidenceColors[prediction.confidence as keyof typeof confidenceColors]}`}>
              {prediction.confidence} confidence
            </span>
          </div>
          <p className="mt-2 text-zinc-900 dark:text-white">{prediction.prediction}</p>
          <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
            <span>Source: {prediction.source}</span>
            <span>Timeframe: {prediction.timeframe}</span>
            <span>Date: {new Date(prediction.date).toLocaleDateString()}</span>
          </div>
          {prediction.outcome && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              <strong>Outcome:</strong> {prediction.outcome}
            </p>
          )}
        </div>
      </div>

      {prediction.status === 'pending' && (
        <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          {!showResolve ? (
            <button
              onClick={() => setShowResolve(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Resolve this prediction
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="What happened? (optional)"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleResolve('correct')}
                  className="flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                >
                  <CheckCircle size={14} />
                  Correct
                </button>
                <button
                  onClick={() => handleResolve('partial')}
                  className="flex items-center gap-1 rounded-lg bg-yellow-100 px-3 py-1.5 text-sm font-medium text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                >
                  <AlertTriangle size={14} />
                  Partial
                </button>
                <button
                  onClick={() => handleResolve('incorrect')}
                  className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                >
                  <XCircle size={14} />
                  Incorrect
                </button>
                <button
                  onClick={() => setShowResolve(false)}
                  className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AddPredictionModalProps {
  onClose: () => void;
  onSave: (prediction: {
    date: string;
    source: string;
    prediction: string;
    timeframe: string;
    confidence: 'low' | 'medium' | 'high';
    status: 'pending';
  }) => void;
}

function AddPredictionModal({ onClose, onSave }: AddPredictionModalProps) {
  const [source, setSource] = useState('');
  const [prediction, setPrediction] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date: new Date().toISOString().split('T')[0],
      source,
      prediction,
      timeframe,
      confidence,
      status: 'pending',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
          Add Prediction
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Source
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="@MacroAlf, Personal analysis, etc."
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Prediction
            </label>
            <textarea
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              placeholder="What is being predicted?"
              rows={3}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Timeframe
            </label>
            <input
              type="text"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              placeholder="3 months, Q2 2026, etc."
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Confidence
            </label>
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value as typeof confidence)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Prediction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
