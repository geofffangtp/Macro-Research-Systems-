'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Globe, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store';

export function InternationalDataInput() {
  const { intlMarketData, setIntlMarketData, clearIntlMarketData } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (field: string, value: string) => {
    setIntlMarketData({ [field]: value });
  };

  const hasData = Object.values(intlMarketData).some((v) => v && v !== intlMarketData.lastUpdated);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-blue-500" />
          <span className="font-medium text-zinc-900 dark:text-white">
            International Market Data
          </span>
          {hasData && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
              Data entered
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-zinc-500" />
        ) : (
          <ChevronDown size={18} className="text-zinc-500" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-700">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Enter today&apos;s international market data for more comprehensive digest analysis.
            Data is saved and will be included in the next digest generation.
          </p>

          {/* European Indices */}
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              European Indices
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  Stoxx 600
                </label>
                <input
                  type="text"
                  value={intlMarketData.stoxx600 || ''}
                  onChange={(e) => handleChange('stoxx600', e.target.value)}
                  placeholder="-1.2%"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  DAX
                </label>
                <input
                  type="text"
                  value={intlMarketData.dax || ''}
                  onChange={(e) => handleChange('dax', e.target.value)}
                  placeholder="-1.1%"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  FTSE
                </label>
                <input
                  type="text"
                  value={intlMarketData.ftse || ''}
                  onChange={(e) => handleChange('ftse', e.target.value)}
                  placeholder="-0.8%"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Asian Indices */}
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Asian Indices
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  Nikkei
                </label>
                <input
                  type="text"
                  value={intlMarketData.nikkei || ''}
                  onChange={(e) => handleChange('nikkei', e.target.value)}
                  placeholder="-1.0%"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  Hang Seng
                </label>
                <input
                  type="text"
                  value={intlMarketData.hangSeng || ''}
                  onChange={(e) => handleChange('hangSeng', e.target.value)}
                  placeholder="-0.5%"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  Shanghai
                </label>
                <input
                  type="text"
                  value={intlMarketData.shanghai || ''}
                  onChange={(e) => handleChange('shanghai', e.target.value)}
                  placeholder="+0.3%"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Currencies */}
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Currencies
            </h4>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  DXY
                </label>
                <input
                  type="text"
                  value={intlMarketData.dxy || ''}
                  onChange={(e) => handleChange('dxy', e.target.value)}
                  placeholder="103.4"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  EUR/USD
                </label>
                <input
                  type="text"
                  value={intlMarketData.eurUsd || ''}
                  onChange={(e) => handleChange('eurUsd', e.target.value)}
                  placeholder="1.0850"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  USD/JPY
                </label>
                <input
                  type="text"
                  value={intlMarketData.usdJpy || ''}
                  onChange={(e) => handleChange('usdJpy', e.target.value)}
                  placeholder="156.20"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  USD/CNY
                </label>
                <input
                  type="text"
                  value={intlMarketData.usdCny || ''}
                  onChange={(e) => handleChange('usdCny', e.target.value)}
                  placeholder="7.25"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Notable Movers */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Notable Movers (sector/stock moves)
            </label>
            <textarea
              value={intlMarketData.notableMovers || ''}
              onChange={(e) => handleChange('notableMovers', e.target.value)}
              placeholder="LVMH -4.7%, VW -2.8%, Rheinmetall +1%, Autos -3%, Luxury -4%..."
              rows={2}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            />
          </div>

          {/* International Events */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              International Events
            </label>
            <textarea
              value={intlMarketData.intlEvents || ''}
              onChange={(e) => handleChange('intlEvents', e.target.value)}
              placeholder="BOJ meeting Wed-Thu, EU emergency summit on tariffs, ECB rate decision Thursday..."
              rows={2}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {intlMarketData.lastUpdated && (
                <>Last updated: {new Date(intlMarketData.lastUpdated).toLocaleString()}</>
              )}
            </div>
            <button
              onClick={clearIntlMarketData}
              className="flex items-center gap-1 rounded px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              <RefreshCw size={14} />
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
