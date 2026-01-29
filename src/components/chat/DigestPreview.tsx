'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, TrendingUp, AlertTriangle, Eye } from 'lucide-react';
import { useAppStore } from '@/store';

interface DigestPreviewProps {
  onExpandDigest?: () => void;
}

export function DigestPreview({ onExpandDigest }: DigestPreviewProps) {
  const { currentDigest, thesis } = useAppStore();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Extract sections from the raw digest content
  const extractSection = (content: string, sectionName: string): string | null => {
    const patterns: Record<string, RegExp> = {
      'bottom-line': /## BOTTOM LINE\s*([\s\S]*?)(?=\n## |$)/i,
      'market-snapshot': /## MARKET SNAPSHOT\s*([\s\S]*?)(?=\n## |$)/i,
      'what-happened': /## WHAT HAPPENED\s*([\s\S]*?)(?=\n## |$)/i,
      'thesis-scorecard': /## THESIS SCORECARD\s*([\s\S]*?)(?=\n## |$)/i,
      'watching': /## WHAT I'M WATCHING\s*([\s\S]*?)(?=\n## |$)/i,
      'devils-advocate': /## DEVIL'S ADVOCATE\s*([\s\S]*?)(?=\n## |$)/i,
    };

    const pattern = patterns[sectionName];
    if (!pattern) return null;

    const match = content.match(pattern);
    return match ? match[1].trim() : null;
  };

  const digestContent = currentDigest?.rawContent || '';
  const bottomLine = extractSection(digestContent, 'bottom-line');
  const marketSnapshot = extractSection(digestContent, 'market-snapshot');
  const watching = extractSection(digestContent, 'watching');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Digest Reference</h3>
            <p className="text-xs text-slate-500">{today}</p>
          </div>
        </div>
        {onExpandDigest && (
          <button
            onClick={onExpandDigest}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
          >
            <Eye size={12} />
            Full View
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!currentDigest ? (
          <div className="p-4 text-center text-sm text-slate-500">
            No digest generated yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Bottom Line Section */}
            {bottomLine && (
              <CollapsibleSection
                title="Bottom Line"
                icon={<AlertTriangle size={14} className="text-amber-500" />}
                isExpanded={expandedSections.has('summary')}
                onToggle={() => toggleSection('summary')}
              >
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {bottomLine.slice(0, 500)}{bottomLine.length > 500 ? '...' : ''}
                </p>
              </CollapsibleSection>
            )}

            {/* Market Snapshot Section */}
            {marketSnapshot && (
              <CollapsibleSection
                title="Market Snapshot"
                icon={<TrendingUp size={14} className="text-emerald-500" />}
                isExpanded={expandedSections.has('market')}
                onToggle={() => toggleSection('market')}
              >
                <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap font-mono">
                  {marketSnapshot.slice(0, 800)}{marketSnapshot.length > 800 ? '...' : ''}
                </div>
              </CollapsibleSection>
            )}

            {/* What I'm Watching Section */}
            {watching && (
              <CollapsibleSection
                title="Watching"
                icon={<Eye size={14} className="text-indigo-500" />}
                isExpanded={expandedSections.has('watching')}
                onToggle={() => toggleSection('watching')}
              >
                <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {watching.slice(0, 500)}{watching.length > 500 ? '...' : ''}
                </div>
              </CollapsibleSection>
            )}

            {/* Thesis Quick Reference */}
            {thesis && (
              <CollapsibleSection
                title="Thesis"
                icon={<FileText size={14} className="text-violet-500" />}
                isExpanded={expandedSections.has('thesis')}
                onToggle={() => toggleSection('thesis')}
              >
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {thesis.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {thesis.summary.slice(0, 200)}{thesis.summary.length > 200 ? '...' : ''}
                  </p>
                  {thesis.scenarios && thesis.scenarios.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {thesis.scenarios.slice(0, 3).map((scenario, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          <span className="text-slate-600 dark:text-slate-400">
                            {scenario.name}: {scenario.probability}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            )}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="border-t border-slate-200 px-4 py-2 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <p className="text-[10px] text-slate-400 text-center">
          Click sections to expand • Use chat to ask questions
        </p>
      </div>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon, isExpanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="px-3 py-2">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 py-1 text-left"
      >
        {isExpanded ? (
          <ChevronDown size={14} className="text-slate-400" />
        ) : (
          <ChevronRight size={14} className="text-slate-400" />
        )}
        {icon}
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{title}</span>
      </button>
      {isExpanded && (
        <div className="pl-6 pt-1 pb-1">
          {children}
        </div>
      )}
    </div>
  );
}
