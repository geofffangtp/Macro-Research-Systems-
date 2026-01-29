'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  trend: 'up' | 'down' | 'flat';
}

// Placeholder data - in production, this would come from an API
const PLACEHOLDER_DATA: TickerItem[] = [
  { symbol: 'SPY', price: '697.86', change: '+4.12', changePercent: '+0.59%', trend: 'up' },
  { symbol: 'QQQ', price: '525.43', change: '+3.28', changePercent: '+0.63%', trend: 'up' },
  { symbol: 'DIA', price: '442.15', change: '-1.23', changePercent: '-0.28%', trend: 'down' },
  { symbol: 'VIX', price: '14.85', change: '-0.42', changePercent: '-2.75%', trend: 'down' },
  { symbol: 'TLT', price: '87.32', change: '+0.18', changePercent: '+0.21%', trend: 'up' },
  { symbol: 'GLD', price: '256.78', change: '+2.45', changePercent: '+0.96%', trend: 'up' },
  { symbol: 'DXY', price: '103.42', change: '-0.38', changePercent: '-0.37%', trend: 'down' },
  { symbol: 'EUR/USD', price: '1.0892', change: '+0.0024', changePercent: '+0.22%', trend: 'up' },
  { symbol: 'USD/JPY', price: '148.25', change: '-0.32', changePercent: '-0.22%', trend: 'down' },
  { symbol: 'BTC', price: '101,245', change: '+1,234', changePercent: '+1.23%', trend: 'up' },
  { symbol: '10Y', price: '4.285%', change: '+0.02', changePercent: '', trend: 'up' },
  { symbol: '2Y', price: '4.125%', change: '-0.01', changePercent: '', trend: 'down' },
];

export function MarketTicker() {
  const [tickerData, setTickerData] = useState<TickerItem[]>(PLACEHOLDER_DATA);
  const [isPaused, setIsPaused] = useState(false);

  // Double the items for seamless loop
  const displayItems = [...tickerData, ...tickerData];

  return (
    <div
      className={`relative rounded-lg bg-slate-900 ${
        isPaused ? 'overflow-x-auto scrollbar-thin' : 'overflow-hidden'
      }`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Gradient fade edges - hide when scrollable */}
      {!isPaused && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />
        </>
      )}

      {/* Scrolling content */}
      <div
        className="flex py-2"
        style={{
          animation: 'ticker 60s linear infinite',
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {displayItems.map((item, index) => (
          <TickerItemDisplay key={`${item.symbol}-${index}`} item={item} />
        ))}
      </div>

      {/* CSS for animation */}
      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

function TickerItemDisplay({ item }: { item: TickerItem }) {
  const TrendIcon = item.trend === 'up' ? TrendingUp : item.trend === 'down' ? TrendingDown : Minus;
  const trendColor = item.trend === 'up'
    ? 'text-emerald-400'
    : item.trend === 'down'
    ? 'text-red-400'
    : 'text-slate-400';
  const bgColor = item.trend === 'up'
    ? 'bg-emerald-500/10'
    : item.trend === 'down'
    ? 'bg-red-500/10'
    : 'bg-slate-500/10';

  return (
    <div className="flex items-center gap-3 px-4 border-r border-slate-700/50 whitespace-nowrap">
      <span className="text-xs font-bold text-slate-300">{item.symbol}</span>
      <span className="text-xs font-mono text-white">{item.price}</span>
      <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${bgColor}`}>
        <TrendIcon size={10} className={trendColor} />
        <span className={`text-[10px] font-medium ${trendColor}`}>
          {item.change} {item.changePercent && `(${item.changePercent})`}
        </span>
      </div>
    </div>
  );
}

// Compact version for the header
export function MarketTickerCompact() {
  const [isPaused, setIsPaused] = useState(false);
  const tickerData = PLACEHOLDER_DATA;
  // Only need one set when scrollable on hover
  const displayItems = [...tickerData, ...tickerData];

  return (
    <div
      className={`relative rounded-lg bg-slate-100 dark:bg-slate-800 ${
        isPaused ? 'overflow-x-auto scrollbar-thin' : 'overflow-hidden'
      }`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Gradient fades - hide when scrollable to show full content */}
      {!isPaused && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-100 dark:from-slate-800 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-100 dark:from-slate-800 to-transparent z-10 pointer-events-none" />
        </>
      )}

      <div
        className="flex py-1.5"
        style={{
          animation: 'ticker 45s linear infinite',
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {displayItems.map((item, index) => (
          <CompactTickerItem key={`${item.symbol}-${index}`} item={item} />
        ))}
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function CompactTickerItem({ item }: { item: TickerItem }) {
  const trendColor = item.trend === 'up'
    ? 'text-emerald-600 dark:text-emerald-400'
    : item.trend === 'down'
    ? 'text-red-600 dark:text-red-400'
    : 'text-slate-500';

  return (
    <div className="flex items-center gap-2 px-3 whitespace-nowrap">
      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{item.symbol}</span>
      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{item.price}</span>
      <span className={`text-[10px] font-medium ${trendColor}`}>
        {item.change}
      </span>
      <span className="text-slate-300 dark:text-slate-600">|</span>
    </div>
  );
}
