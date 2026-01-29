'use client';

import { useMemo } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Newspaper,
  Target,
  Eye,
  Scale,
  Calendar,
  Lightbulb,
} from 'lucide-react';

interface DigestContentProps {
  content: string;
}

interface ParsedSection {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

// Parse markdown table into structured data
function parseTable(tableText: string): { headers: string[]; rows: string[][] } | null {
  const lines = tableText.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return null;

  // Find header row (first row with |)
  const headerLine = lines.find(line => line.includes('|') && !line.match(/^\|?\s*[-:]+\s*\|/));
  if (!headerLine) return null;

  const headers = headerLine
    .split('|')
    .map(cell => cell.trim())
    .filter(cell => cell.length > 0);

  // Find data rows (skip separator line)
  const dataRows = lines
    .filter(line => line.includes('|') && !line.match(/^\|?\s*[-:]+\s*\|/) && line !== headerLine)
    .map(line =>
      line
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0)
    );

  return { headers, rows: dataRows };
}

// Extract section content between headers
function extractSections(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];

  const sectionConfigs: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
    'BOTTOM LINE': {
      icon: <AlertTriangle size={18} />,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    },
    'MARKET SNAPSHOT': {
      icon: <TrendingUp size={18} />,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    },
    'WHAT HAPPENED': {
      icon: <Newspaper size={18} />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    },
    'THESIS SCORECARD': {
      icon: <Target size={18} />,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
    },
    "WHAT I'M WATCHING": {
      icon: <Eye size={18} />,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
    },
    "DEVIL'S ADVOCATE": {
      icon: <Scale size={18} />,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    },
    'DEEP DIVE': {
      icon: <Lightbulb size={18} />,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800',
    },
  };

  // Match section headers
  const sectionRegex = /^##\s+([A-Z][A-Z\s']+)$/gm;
  const matches = [...content.matchAll(sectionRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const title = match[1].trim();
    const startIndex = match.index! + match[0].length;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;
    const sectionContent = content.slice(startIndex, endIndex).trim();

    const config = sectionConfigs[title] || {
      icon: <Newspaper size={18} />,
      color: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-700',
    };

    sections.push({
      id: title.toLowerCase().replace(/\s+/g, '-').replace(/'/g, ''),
      title,
      content: sectionContent,
      ...config,
    });
  }

  return sections;
}

// Render a table with proper styling
function StyledTable({ tableText }: { tableText: string }) {
  const parsed = parseTable(tableText);
  if (!parsed) return <pre className="text-xs text-slate-500">{tableText}</pre>;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 dark:bg-slate-800">
          <tr>
            {parsed.headers.map((header, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {parsed.rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-3 py-2 text-slate-600 dark:text-slate-400"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Render section content with proper formatting
function SectionContent({ content }: { content: string }) {
  // Split content into blocks (paragraphs, tables, lists, subsections)
  const blocks: { type: string; content: string }[] = [];
  const lines = content.split('\n');
  let currentBlock = { type: 'paragraph', content: '' };
  let inTable = false;

  for (const line of lines) {
    // Detect table start
    if (line.includes('|') && !inTable) {
      if (currentBlock.content.trim()) {
        blocks.push({ ...currentBlock });
      }
      inTable = true;
      currentBlock = { type: 'table', content: line + '\n' };
      continue;
    }

    // Continue table
    if (inTable && (line.includes('|') || line.match(/^\s*[-:]+\s*$/))) {
      currentBlock.content += line + '\n';
      continue;
    }

    // End table
    if (inTable && !line.includes('|')) {
      blocks.push({ ...currentBlock });
      inTable = false;
      currentBlock = { type: 'paragraph', content: '' };
    }

    // Subsection header (###)
    if (line.startsWith('### ')) {
      if (currentBlock.content.trim()) {
        blocks.push({ ...currentBlock });
      }
      blocks.push({ type: 'subsection', content: line.replace('### ', '') });
      currentBlock = { type: 'paragraph', content: '' };
      continue;
    }

    // Bold text line (standalone **text**)
    if (line.match(/^\*\*[^*]+\*\*:?\s*$/)) {
      if (currentBlock.content.trim()) {
        blocks.push({ ...currentBlock });
      }
      blocks.push({ type: 'label', content: line.replace(/\*\*/g, '').replace(/:$/, '') });
      currentBlock = { type: 'paragraph', content: '' };
      continue;
    }

    // List item
    if (line.match(/^[-•]\s+/) || line.match(/^\d+\.\s+/)) {
      if (currentBlock.type !== 'list') {
        if (currentBlock.content.trim()) {
          blocks.push({ ...currentBlock });
        }
        currentBlock = { type: 'list', content: '' };
      }
      currentBlock.content += line + '\n';
      continue;
    }

    // Regular paragraph line
    if (currentBlock.type === 'list' && currentBlock.content.trim()) {
      blocks.push({ ...currentBlock });
      currentBlock = { type: 'paragraph', content: '' };
    }
    currentBlock.content += line + '\n';
  }

  // Push final block
  if (currentBlock.content.trim()) {
    blocks.push({ ...currentBlock });
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.type === 'table') {
          return <StyledTable key={i} tableText={block.content} />;
        }

        if (block.type === 'subsection') {
          return (
            <h4
              key={i}
              className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1"
            >
              {block.content}
            </h4>
          );
        }

        if (block.type === 'label') {
          return (
            <p key={i} className="font-semibold text-slate-700 dark:text-slate-300 mt-3">
              {block.content}
            </p>
          );
        }

        if (block.type === 'list') {
          const items = block.content.trim().split('\n');
          return (
            <ul key={i} className="space-y-1.5 ml-1">
              {items.map((item, j) => {
                const cleaned = item.replace(/^[-•]\s+/, '').replace(/^\d+\.\s+/, '');
                // Check for bold prefix like "**Title** - content"
                const boldMatch = cleaned.match(/^\*\*([^*]+)\*\*\s*[-–—]\s*(.+)$/);
                if (boldMatch) {
                  return (
                    <li key={j} className="flex gap-2 text-sm">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span>
                        <strong className="text-slate-800 dark:text-slate-200">{boldMatch[1]}</strong>
                        <span className="text-slate-600 dark:text-slate-400"> — {boldMatch[2]}</span>
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={j} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-indigo-500 mt-1">•</span>
                    <span>{cleaned}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Paragraph - handle inline bold
        const text = block.content.trim();
        if (!text) return null;

        return (
          <p key={i} className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {text.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={j} className="text-slate-800 dark:text-slate-200">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

export function DigestContent({ content }: DigestContentProps) {
  const sections = useMemo(() => extractSections(content), [content]);

  if (sections.length === 0) {
    // Fallback: render as plain text if no sections found
    return (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <pre className="whitespace-pre-wrap text-sm">{content}</pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div
          key={section.id}
          className={`rounded-xl border p-5 ${section.bgColor}`}
        >
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center justify-center w-9 h-9 rounded-lg bg-white dark:bg-slate-800 shadow-sm ${section.color}`}>
              {section.icon}
            </div>
            <h3 className={`text-lg font-bold ${section.color}`}>
              {section.title}
            </h3>
          </div>

          {/* Section Content */}
          <SectionContent content={section.content} />
        </div>
      ))}
    </div>
  );
}
