'use client';

import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Target,
  Brain,
  HelpCircle,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface WeeklySynthesisProps {
  content: string;
}

// Parse the markdown content into sections
function parseSections(content: string) {
  const sections: Record<string, string> = {};
  const sectionRegex = /## ([^\n]+)\n([\s\S]*?)(?=\n## |$)/g;
  let match;

  while ((match = sectionRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const body = match[2].trim();
    sections[title] = body;
  }

  return sections;
}

// Parse bullet points from text
function parseBullets(text: string): string[] {
  return text
    .split('\n')
    .filter((line) => line.trim().startsWith('-'))
    .map((line) => line.replace(/^-\s*/, '').trim());
}

export function WeeklySynthesisContent({ content }: WeeklySynthesisProps) {
  const sections = parseSections(content);

  return (
    <div className="space-y-6">
      {/* Week in Review - Hero Section */}
      {sections['Week in Review'] && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-6 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMC0yaDF2NGgtMXYtNHptMi0yaDF2MWgtMXYtMXptLTIgMGgxdjFoLTF2LTF6bS0yIDJoMXY0aC0xdi00em0wLTJoMXYxaC0xdi0xeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                <Sparkles size={16} className="text-amber-400" />
              </div>
              <h2 className="text-lg font-bold">Week in Review</h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-slate-200">
              {sections['Week in Review'].split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Key Themes - Cards Grid */}
      {sections['Key Themes'] && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
              <Target size={14} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Key Themes</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {parseBullets(sections['Key Themes']).map((theme, i) => {
              // Extract bold title if present
              const boldMatch = theme.match(/\*\*([^*]+)\*\*:?\s*(.*)/);
              const title = boldMatch ? boldMatch[1] : null;
              const description = boldMatch ? boldMatch[2] : theme;

              const colors = [
                'from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800',
                'from-violet-500/10 to-purple-500/10 border-violet-200 dark:border-violet-800',
                'from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800',
                'from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800',
                'from-rose-500/10 to-pink-500/10 border-rose-200 dark:border-rose-800',
              ];

              return (
                <div
                  key={i}
                  className={`rounded-xl border bg-gradient-to-br p-4 ${colors[i % colors.length]}`}
                >
                  {title && (
                    <h4 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {title}
                    </h4>
                  )}
                  <p className="text-xs text-slate-600 dark:text-slate-400">{description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Thesis Evolution - Split View */}
      {sections['Thesis Evolution'] && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
              <TrendingUp size={14} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Thesis Evolution</h3>
          </div>

          {/* Main narrative */}
          <div className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {sections['Thesis Evolution']
              .split('\n\n')
              .filter((p) => !p.startsWith('**Strengthening') && !p.startsWith('**Challenging'))
              .map((para, i) => (
                <p key={i} className="mb-2">{para}</p>
              ))}
          </div>

          {/* Strengthening vs Challenging */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-500/10">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle size={12} />
                Strengthening Signals
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-300">
                {sections['Thesis Evolution'].match(/\*\*Strengthening[^*]*\*\*:?\s*([^\n]*)/)?.[1] || 'Tech concentration stress, supply chain consolidation, gold persistence'}
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-500/10">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle size={12} />
                Challenging Elements
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-300">
                {sections['Thesis Evolution'].match(/\*\*Challenging[^*]*\*\*:?\s*([^\n]*)/)?.[1] || 'Labor market resilience, consumer demand robust'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Gained */}
      {sections['Knowledge Gained'] && (
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 dark:border-slate-700 dark:from-violet-500/10 dark:to-indigo-500/10">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/20">
              <Brain size={14} className="text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Knowledge Gained</h3>
          </div>
          <div className="space-y-2">
            {parseBullets(sections['Knowledge Gained']).length > 0 ? (
              parseBullets(sections['Knowledge Gained']).map((item, i) => {
                const boldMatch = item.match(/\*\*([^*]+)\*\*:?\s*(.*)/);
                return (
                  <div key={i} className="flex gap-2 text-sm">
                    <Lightbulb size={14} className="mt-0.5 flex-shrink-0 text-violet-500" />
                    <div>
                      {boldMatch ? (
                        <>
                          <span className="font-medium text-slate-900 dark:text-white">{boldMatch[1]}: </span>
                          <span className="text-slate-600 dark:text-slate-400">{boldMatch[2]}</span>
                        </>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400">{item}</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {sections['Knowledge Gained']}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Open Questions */}
      {sections['Open Questions'] && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20">
              <HelpCircle size={14} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Open Questions</h3>
          </div>
          <div className="space-y-2">
            {parseBullets(sections['Open Questions']).map((question, i) => {
              const boldMatch = question.match(/\*\*([^*]+)\*\*\s*(.*)/);
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                    ?
                  </span>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {boldMatch ? (
                      <>
                        <span className="font-medium text-slate-900 dark:text-white">{boldMatch[1]}</span>
                        {boldMatch[2]}
                      </>
                    ) : (
                      question
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Looking Ahead */}
      {sections['Looking Ahead'] && (
        <div className="relative overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-5 dark:border-indigo-800 dark:from-indigo-500/10 dark:via-slate-800 dark:to-violet-500/10">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
              <ArrowRight size={14} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Looking Ahead</h3>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {sections['Looking Ahead'].split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
