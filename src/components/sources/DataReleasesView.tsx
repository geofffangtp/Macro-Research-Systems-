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
} from 'lucide-react';

export function DataReleasesView() {
  const { dataReleases, updateDataRelease } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);

  const tier1 = dataReleases.filter((d) => d.tier === 'tier1');
  const tier2 = dataReleases.filter((d) => d.tier === 'tier2');
  const tier3 = dataReleases.filter((d) => d.tier === 'tier3');

  return (
    <div className="mx-auto max-w-6xl">
      {/* Upcoming Releases */}
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 flex items-center gap-2 font-medium text-zinc-900 dark:text-white">
          <Calendar size={18} />
          Upcoming Releases
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
                className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800"
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  {release.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {new Date(release.nextReleaseDate!).toLocaleDateString()}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Tier 1: Core to Thesis */}
      <DataReleaseSection
        title="Core to Thesis"
        description="Always tracked - directly connected to investment thesis"
        releases={tier1}
        tierColor="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        onEdit={setEditingId}
        editingId={editingId}
        onUpdate={updateDataRelease}
        onCancelEdit={() => setEditingId(null)}
      />

      {/* Tier 2: Supporting Indicators */}
      <DataReleaseSection
        title="Supporting Indicators"
        description="Provide additional context and confirmation"
        releases={tier2}
        tierColor="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        onEdit={setEditingId}
        editingId={editingId}
        onUpdate={updateDataRelease}
        onCancelEdit={() => setEditingId(null)}
      />

      {/* Tier 3: AI/Energy Nexus */}
      <DataReleaseSection
        title="AI/Energy Nexus"
        description="Tracking the AI CapEx cycle and energy constraints"
        releases={tier3}
        tierColor="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        onEdit={setEditingId}
        editingId={editingId}
        onUpdate={updateDataRelease}
        onCancelEdit={() => setEditingId(null)}
      />
    </div>
  );
}

interface DataReleaseSectionProps {
  title: string;
  description: string;
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
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  onCancelEdit: () => void;
}

function DataReleaseSectionProps({
  title,
  description,
  releases,
  tierColor,
  onEdit,
  editingId,
  onUpdate,
  onCancelEdit,
}: DataReleaseSectionProps) {
  return (
    <div className="mb-6">
      <div className="mb-3">
        <h3 className="font-medium text-zinc-900 dark:text-white">{title}</h3>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
      <div className="space-y-2">
        {releases.map((release) => (
          <DataReleaseCard
            key={release.id}
            release={release}
            tierColor={tierColor}
            isEditing={editingId === release.id}
            onEdit={() => onEdit(release.id)}
            onUpdate={(updates) => {
              onUpdate(release.id, updates);
              onCancelEdit();
            }}
            onCancel={onCancelEdit}
          />
        ))}
      </div>
    </div>
  );
}

// Use this as the actual export
function DataReleaseSection(props: DataReleaseSectionProps) {
  return <DataReleaseSectionProps {...props} />;
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
}

function DataReleaseCard({
  release,
  tierColor,
  isEditing,
  onEdit,
  onUpdate,
  onCancel,
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
      ? 'text-green-600'
      : release.trend === 'down'
      ? 'text-red-600'
      : 'text-zinc-400';

  if (isEditing) {
    return (
      <div className="rounded-xl border border-blue-300 bg-white p-4 dark:border-blue-800 dark:bg-zinc-900">
        <h4 className="mb-3 font-medium text-zinc-900 dark:text-white">
          {release.name}
        </h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Last Value
            </label>
            <input
              type="text"
              value={lastValue}
              onChange={(e) => setLastValue(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Trend
            </label>
            <select
              value={trend}
              onChange={(e) => setTrend(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">--</option>
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="flat">Flat</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onUpdate({
                lastValue,
                trend: trend || undefined,
                notes: notes || undefined,
                releaseDate: new Date().toISOString(),
              })
            }
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-zinc-900 dark:text-white">
              {release.name}
            </h4>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tierColor}`}>
              {release.frequency}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{release.thesisConnection}</p>
        </div>
        <div className="flex items-center gap-3">
          {release.lastValue && (
            <div className="text-right">
              <div className="flex items-center gap-1">
                <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {release.lastValue}
                </span>
                <TrendIcon size={16} className={trendColor} />
              </div>
              {release.previousValue && (
                <p className="text-xs text-zinc-400">
                  prev: {release.previousValue}
                </p>
              )}
            </div>
          )}
          <button
            onClick={onEdit}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Edit2 size={16} />
          </button>
        </div>
      </div>
      {release.notes && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800">
          <AlertCircle size={14} className="mt-0.5 text-zinc-400" />
          <p className="text-xs text-zinc-600 dark:text-zinc-400">{release.notes}</p>
        </div>
      )}
    </div>
  );
}
