'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Edit2,
  Calendar,
  AlertCircle,
  Pencil,
  Check,
  X,
  Database,
  Zap,
} from 'lucide-react';

export function DataReleasesView() {
  const { dataReleases, updateDataRelease } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);

  const tier1 = dataReleases.filter((d) => d.tier === 'tier1');
  const tier2 = dataReleases.filter((d) => d.tier === 'tier2');
  const tier3 = dataReleases.filter((d) => d.tier === 'tier3');

  const filledCount = dataReleases.filter((d) => d.lastValue).length;
  const totalCount = dataReleases.length;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
                <Database size={16} className="text-white" />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-indigo-400">
                Economic Indicators
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Data Releases
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {filledCount} of {totalCount} indicators have values
            </p>
          </div>
          <button
            onClick={() => setBulkEditMode(!bulkEditMode)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              bulkEditMode
                ? 'bg-white text-slate-900'
                : 'btn-gradient text-white'
            }`}
          >
            {bulkEditMode ? (
              <>
                <Check size={16} />
                Done Editing
              </>
            ) : (
              <>
                <Pencil size={16} />
                Bulk Edit Values
              </>
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: `${(filledCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Upcoming Releases */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Calendar size={16} className="text-indigo-500" />
          Upcoming Releases
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dataReleases
            .filter((d) => d.nextReleaseDate)
            .sort(
              (a, b) =>
                new Date(a.nextReleaseDate!).getTime() -
                new Date(b.nextReleaseDate!).getTime()
            )
            .slice(0, 4)
            .map((release) => (
              <div
                key={release.id}
                className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {release.name}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(release.nextReleaseDate!).toLocaleDateString()}
                </p>
              </div>
            ))}
          {dataReleases.filter((d) => d.nextReleaseDate).length === 0 && (
            <p className="col-span-4 text-sm text-slate-400">
              No upcoming releases scheduled. Add release dates when editing.
            </p>
          )}
        </div>
      </div>

      {/* Tier 1: Core to Thesis */}
      <DataReleaseSection
        title="Core to Thesis"
        description="Always tracked - directly connected to investment thesis"
        icon={<Zap size={16} />}
        releases={tier1}
        tierColor="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-700 dark:text-indigo-400"
        onEdit={setEditingId}
        editingId={editingId}
        bulkEditMode={bulkEditMode}
        onUpdate={updateDataRelease}
        onCancelEdit={() => setEditingId(null)}
      />

      {/* Tier 2: Supporting Indicators */}
      <DataReleaseSection
        title="Supporting Indicators"
        description="Provide additional context and confirmation"
        icon={<TrendingUp size={16} />}
        releases={tier2}
        tierColor="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
        onEdit={setEditingId}
        editingId={editingId}
        bulkEditMode={bulkEditMode}
        onUpdate={updateDataRelease}
        onCancelEdit={() => setEditingId(null)}
      />

      {/* Tier 3: AI/Energy Nexus */}
      <DataReleaseSection
        title="AI/Energy Nexus"
        description="Tracking the AI CapEx cycle and energy constraints"
        icon={<Database size={16} />}
        releases={tier3}
        tierColor="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        onEdit={setEditingId}
        editingId={editingId}
        bulkEditMode={bulkEditMode}
        onUpdate={updateDataRelease}
        onCancelEdit={() => setEditingId(null)}
      />
    </div>
  );
}

interface DataReleaseSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  releases: Array<{
    id: string;
    name: string;
    description: string;
    frequency: string;
    tier: string;
    thesisConnection: string;
    lastValue?: string;
    previousValue?: string;
    releaseDate?: string;
    nextReleaseDate?: string;
    trend?: string;
    notes?: string;
  }>;
  tierColor: string;
  onEdit: (id: string) => void;
  editingId: string | null;
  bulkEditMode: boolean;
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  onCancelEdit: () => void;
}

function DataReleaseSection({
  title,
  description,
  icon,
  releases,
  tierColor,
  onEdit,
  editingId,
  bulkEditMode,
  onUpdate,
  onCancelEdit,
}: DataReleaseSectionProps) {
  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="space-y-3">
        {releases.map((release) => (
          <DataReleaseCard
            key={release.id}
            release={release}
            tierColor={tierColor}
            isEditing={editingId === release.id || bulkEditMode}
            onEdit={() => onEdit(release.id)}
            onUpdate={(updates) => {
              onUpdate(release.id, updates);
              if (!bulkEditMode) onCancelEdit();
            }}
            onCancel={onCancelEdit}
            bulkEditMode={bulkEditMode}
          />
        ))}
      </div>
    </div>
  );
}

interface DataReleaseCardProps {
  release: {
    id: string;
    name: string;
    description: string;
    frequency: string;
    thesisConnection: string;
    lastValue?: string;
    previousValue?: string;
    trend?: string;
    notes?: string;
  };
  tierColor: string;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Record<string, unknown>) => void;
  onCancel: () => void;
  bulkEditMode: boolean;
}

function DataReleaseCard({
  release,
  tierColor,
  isEditing,
  onEdit,
  onUpdate,
  onCancel,
  bulkEditMode,
}: DataReleaseCardProps) {
  const [lastValue, setLastValue] = useState(release.lastValue || '');
  const [trend, setTrend] = useState(release.trend || '');
  const [notes, setNotes] = useState(release.notes || '');

  const TrendIcon =
    release.trend === 'up'
      ? TrendingUp
      : release.trend === 'down'
      ? TrendingDown
      : Minus;
  const trendColor =
    release.trend === 'up'
      ? 'text-green-500'
      : release.trend === 'down'
      ? 'text-red-500'
      : 'text-slate-400';

  // Bulk edit mode - inline compact editing
  if (bulkEditMode) {
    return (
      <div className="card-hover rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-900 dark:text-white truncate">
              {release.name}
            </h4>
            <p className="text-xs text-slate-500 truncate">{release.thesisConnection}</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={lastValue}
              onChange={(e) => setLastValue(e.target.value)}
              placeholder="Value"
              className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
            <select
              value={trend}
              onChange={(e) => setTrend(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            >
              <option value="">--</option>
              <option value="up">↑</option>
              <option value="down">↓</option>
              <option value="flat">→</option>
            </select>
            <button
              onClick={() =>
                onUpdate({
                  lastValue: lastValue || undefined,
                  previousValue: release.lastValue,
                  trend: trend || undefined,
                  releaseDate: new Date().toISOString(),
                })
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
            >
              <Check size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Single edit mode - expanded form
  if (isEditing) {
    return (
      <div className="rounded-2xl border-2 border-indigo-300 bg-white p-5 dark:border-indigo-800 dark:bg-slate-900">
        <h4 className="mb-4 font-semibold text-slate-900 dark:text-white">
          {release.name}
        </h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Current Value
            </label>
            <input
              type="text"
              value={lastValue}
              onChange={(e) => setLastValue(e.target.value)}
              placeholder="e.g., 47.2, 3.4%, $4.52"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Trend Direction
            </label>
            <select
              value={trend}
              onChange={(e) => setTrend(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select trend</option>
              <option value="up">↑ Increasing</option>
              <option value="down">↓ Decreasing</option>
              <option value="flat">→ Flat</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            onClick={() =>
              onUpdate({
                lastValue: lastValue || undefined,
                previousValue: release.lastValue,
                trend: trend || undefined,
                notes: notes || undefined,
                releaseDate: new Date().toISOString(),
              })
            }
            className="btn-gradient flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-white"
          >
            <Check size={14} />
            Save
          </button>
        </div>
      </div>
    );
  }

  // Default view
  return (
    <div className="card-hover rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-slate-900 dark:text-white">
              {release.name}
            </h4>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tierColor}`}>
              {release.frequency}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{release.thesisConnection}</p>
        </div>
        <div className="flex items-center gap-3">
          {release.lastValue ? (
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {release.lastValue}
                </span>
                <TrendIcon size={16} className={trendColor} />
              </div>
              {release.previousValue && (
                <p className="text-xs text-slate-400">
                  prev: {release.previousValue}
                </p>
              )}
            </div>
          ) : (
            <span className="text-sm text-slate-400 italic">No data</span>
          )}
          <button
            onClick={onEdit}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            <Edit2 size={16} />
          </button>
        </div>
      </div>
      {release.notes && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <AlertCircle size={14} className="mt-0.5 text-slate-400" />
          <p className="text-xs text-slate-600 dark:text-slate-400">{release.notes}</p>
        </div>
      )}
    </div>
  );
}
