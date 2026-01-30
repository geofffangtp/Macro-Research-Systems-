'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  Building2,
  Landmark,
  Globe,
  Plus,
  X,
  Star,
} from 'lucide-react';
import { useAppStore } from '@/store';

interface Catalyst {
  id: string;
  title: string;
  date: string; // ISO date string
  time?: string; // e.g., "8:30 AM ET"
  category: 'economic' | 'fed' | 'earnings' | 'geopolitical' | 'other';
  importance: 'high' | 'medium' | 'low';
  description?: string;
  previousValue?: string;
  expectedValue?: string;
  isFlagged?: boolean;
  sourceType?: 'data_release' | 'custom';
}

// Get the start of the week (Sunday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Format date for display
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Check if date is today
function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// Check if date is in the past
function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

const categoryConfig = {
  economic: {
    icon: TrendingUp,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-800',
    label: 'Economic',
  },
  fed: {
    icon: Landmark,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    border: 'border-violet-200 dark:border-violet-800',
    label: 'Fed',
  },
  earnings: {
    icon: Building2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-800',
    label: 'Earnings',
  },
  geopolitical: {
    icon: Globe,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-800',
    label: 'Geopolitical',
  },
  other: {
    icon: Calendar,
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-500/10',
    border: 'border-slate-200 dark:border-slate-700',
    label: 'Other',
  },
};

const importanceColors = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-slate-300 dark:border-l-slate-600',
};

export function CatalystsCalendar() {
  const { dataReleases } = useAppStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedCatalyst, setSelectedCatalyst] = useState<Catalyst | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customCatalysts, setCustomCatalysts] = useState<Catalyst[]>([]);

  // Convert data releases to catalysts
  const catalysts = useMemo(() => {
    const fromReleases: Catalyst[] = dataReleases
      .filter((r) => r.nextReleaseDate) // Only those with upcoming dates
      .map((release) => ({
        id: `release-${release.id}`,
        title: release.name,
        date: release.nextReleaseDate!,
        category: 'economic' as const,
        importance: release.tier === 'tier1' ? 'high' : release.tier === 'tier2' ? 'medium' : 'low',
        description: release.thesisConnection || release.description,
        previousValue: release.lastValue,
        sourceType: 'data_release' as const,
      }));

    return [...fromReleases, ...customCatalysts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [dataReleases, customCatalysts]);

  const addCustomCatalyst = (catalyst: Omit<Catalyst, 'id' | 'sourceType'>) => {
    const newCatalyst: Catalyst = {
      ...catalyst,
      id: `custom-${Date.now()}`,
      sourceType: 'custom',
    };
    setCustomCatalysts((prev) => [...prev, newCatalyst]);
    setShowAddModal(false);
  };

  // Calculate week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    const weekStart = getWeekStart(today);
    weekStart.setDate(weekStart.getDate() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return date;
    });
  }, [weekOffset]);

  // Group catalysts by date
  const catalystsByDate = useMemo(() => {
    const grouped: Record<string, Catalyst[]> = {};
    catalysts.forEach((catalyst) => {
      if (!grouped[catalyst.date]) {
        grouped[catalyst.date] = [];
      }
      grouped[catalyst.date].push(catalyst);
    });
    // Sort by importance within each day
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.importance] - order[b.importance];
      });
    });
    return grouped;
  }, [catalysts]);

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${formatDate(start)} - ${formatDate(end)}, ${end.getFullYear()}`;
  }, [weekDates]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
            <Calendar size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Catalysts</h3>
            <p className="text-xs text-slate-500">{weekLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
          >
            <Plus size={14} />
            Add
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Today
            </button>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-2 dark:border-slate-800">
        {Object.entries(categoryConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1.5">
            <config.icon size={12} className={config.color} />
            <span className="text-[10px] font-medium text-slate-500">{config.label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-[10px] text-slate-400">High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[10px] text-slate-400">Med</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-800">
        {weekDates.map((date) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayCatalysts = catalystsByDate[dateStr] || [];
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <div
              key={dateStr}
              className={`min-h-[180px] ${
                isToday(date)
                  ? 'bg-indigo-50/50 dark:bg-indigo-500/5'
                  : isPast(date)
                  ? 'bg-slate-50/50 dark:bg-slate-800/30'
                  : isWeekend
                  ? 'bg-slate-50/30 dark:bg-slate-800/20'
                  : ''
              }`}
            >
              {/* Day Header */}
              <div className={`sticky top-0 border-b border-slate-100 p-2 dark:border-slate-800 ${
                isToday(date) ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'bg-white dark:bg-slate-900'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-medium uppercase ${
                    isWeekend ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {dayName}
                  </span>
                  {isToday(date) && (
                    <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      TODAY
                    </span>
                  )}
                </div>
                <div className={`text-lg font-bold ${
                  isToday(date)
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : isPast(date)
                    ? 'text-slate-400'
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {date.getDate()}
                </div>
              </div>

              {/* Events */}
              <div className="space-y-1 p-1.5">
                {dayCatalysts.length === 0 && !isWeekend && (
                  <div className="flex h-12 items-center justify-center">
                    <span className="text-[10px] text-slate-300 dark:text-slate-600">No events</span>
                  </div>
                )}
                {dayCatalysts.map((catalyst) => {
                  const config = categoryConfig[catalyst.category];
                  return (
                    <button
                      key={catalyst.id}
                      onClick={() => setSelectedCatalyst(catalyst)}
                      className={`w-full rounded-md border-l-2 ${importanceColors[catalyst.importance]} ${config.bg} p-1.5 text-left transition-all hover:scale-[1.02] hover:shadow-sm`}
                    >
                      <div className="flex items-start gap-1">
                        <config.icon size={10} className={`mt-0.5 flex-shrink-0 ${config.color}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-[10px] font-semibold ${config.color}`}>
                            {catalyst.title}
                          </p>
                          {catalyst.time && (
                            <p className="text-[9px] text-slate-500">{catalyst.time}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedCatalyst && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedCatalyst(null)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const config = categoryConfig[selectedCatalyst.category];
                  return (
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bg}`}>
                      <config.icon size={20} className={config.color} />
                    </div>
                  );
                })()}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {selectedCatalyst.title}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {new Date(selectedCatalyst.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {selectedCatalyst.time && ` · ${selectedCatalyst.time}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCatalyst(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {selectedCatalyst.description && (
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                {selectedCatalyst.description}
              </p>
            )}

            <div className="mt-4 flex gap-4">
              {selectedCatalyst.previousValue && (
                <div className="flex-1 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-[10px] font-medium uppercase text-slate-500">Previous</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedCatalyst.previousValue}
                  </p>
                </div>
              )}
              {selectedCatalyst.expectedValue && (
                <div className="flex-1 rounded-lg bg-indigo-50 p-3 dark:bg-indigo-500/10">
                  <p className="text-[10px] font-medium uppercase text-indigo-600 dark:text-indigo-400">
                    Expected
                  </p>
                  <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                    {selectedCatalyst.expectedValue}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  categoryConfig[selectedCatalyst.category].bg
                } ${categoryConfig[selectedCatalyst.category].color}`}
              >
                {categoryConfig[selectedCatalyst.category].label}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  selectedCatalyst.importance === 'high'
                    ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                    : selectedCatalyst.importance === 'medium'
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {selectedCatalyst.importance.charAt(0).toUpperCase() + selectedCatalyst.importance.slice(1)} Importance
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Catalyst Modal */}
      {showAddModal && (
        <AddCatalystModal
          onAdd={addCustomCatalyst}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// Add Catalyst Modal Component
function AddCatalystModal({
  onAdd,
  onClose,
}: {
  onAdd: (catalyst: Omit<Catalyst, 'id' | 'sourceType'>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<Catalyst['category']>('earnings');
  const [importance, setImportance] = useState<Catalyst['importance']>('high');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    onAdd({
      title,
      date,
      time: time || undefined,
      category,
      importance,
      description: description || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Catalyst</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., MSFT Earnings, Fed Meeting"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Time
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g., 2:00 PM ET"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Catalyst['category'])}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="earnings">Earnings</option>
                <option value="economic">Economic</option>
                <option value="fed">Fed</option>
                <option value="geopolitical">Geopolitical</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Importance
              </label>
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value as Catalyst['importance'])}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Why it matters (thesis connection)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Key indicator for AI capex narrative..."
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Add Catalyst
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
