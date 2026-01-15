# Macro Research System - Comprehensive Audit Report

**Date:** January 15, 2026
**Auditor:** Claude
**Repository:** Macro-Research-Systems-
**Commit:** fb91a3e

---

## Executive Summary

This is a **well-architected Phase 1 MVP** of a personal macro research platform built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, and Claude AI integration. The codebase demonstrates professional practices but has several areas requiring attention before production deployment.

**Overall Assessment:** Good foundation, needs hardening for production use.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Critical Issues](#2-critical-issues)
3. [Security Vulnerabilities](#3-security-vulnerabilities)
4. [Code Quality Issues](#4-code-quality-issues)
5. [Type Safety Issues](#5-type-safety-issues)
6. [Performance Concerns](#6-performance-concerns)
7. [Missing Features](#7-missing-features)
8. [Component-Specific Issues](#8-component-specific-issues)
9. [API Route Issues](#9-api-route-issues)
10. [State Management Issues](#10-state-management-issues)
11. [UI/UX Issues](#11-uiux-issues)
12. [Testing & CI/CD](#12-testing--cicd)
13. [Documentation](#13-documentation)
14. [Recommendations Summary](#14-recommendations-summary)

---

## 1. Architecture Overview

### Tech Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.1.2 |
| UI | React | 19.2.3 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| State | Zustand | 5.0.10 |
| AI | @anthropic-ai/sdk | 0.71.2 |
| Database | Supabase (unused) | 2.90.1 |

### File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (4 endpoints)
│   ├── page.tsx           # Main page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── digest/            # Digest view (1 file, 472 lines)
│   ├── knowledge/         # Knowledge base (1 file, 454 lines)
│   ├── sources/           # Sources, Data, Predictions, Settings
│   ├── layout/            # Sidebar, Header
│   └── ui/                # ChatModal, ManualInputModal
├── lib/                   # Utilities
│   ├── claude.ts          # Claude API wrapper
│   ├── rss.ts             # RSS parsing
│   ├── supabase.ts        # Supabase client (unused)
│   └── initial-data.ts    # Default data
├── store/index.ts         # Zustand store (334 lines)
└── types/index.ts         # TypeScript types (193 lines)
```

---

## 2. Critical Issues

### 2.1 No Input Validation on API Routes

**Location:** All files in `src/app/api/*/route.ts`

**Problem:** API routes accept any JSON body without validation, enabling potential injection attacks and runtime errors.

**Files Affected:**
- `src/app/api/digest/generate/route.ts:6` - No validation on `items`, `dataReleases`, `thesis`
- `src/app/api/chat/route.ts:6` - No validation on `item`, `message`, `previousMessages`
- `src/app/api/knowledge/analyze/route.ts:6` - Only checks if `content` exists, no type validation
- `src/app/api/rss/route.ts:6` - Only checks if `url` exists, no URL format validation

**Fix:** Add Zod schemas for request validation:

```typescript
// src/lib/validations.ts
import { z } from 'zod';

export const DigestRequestSchema = z.object({
  items: z.array(z.object({
    source: z.string(),
    content: z.string(),
    url: z.string().url().optional(),
  })),
  dataReleases: z.array(z.object({
    name: z.string(),
    value: z.string().optional(),
    trend: z.string().optional(),
  })),
  thesis: z.object({
    summary: z.string(),
    keyMonitors: z.array(z.string()),
  }).nullable(),
});

export const ChatRequestSchema = z.object({
  item: z.object({
    title: z.string(),
    content: z.string(),
    source: z.string().optional(),
  }),
  message: z.string().min(1),
  previousMessages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  thesis: z.object({
    summary: z.string(),
  }).nullable().optional(),
});

export const RssRequestSchema = z.object({
  url: z.string().url(),
});

export const KnowledgeAnalyzeSchema = z.object({
  content: z.string().min(1),
  existingTopics: z.array(z.string()).optional(),
});
```

### 2.2 No Rate Limiting

**Problem:** No rate limiting on Claude API calls, which could lead to:
- Excessive API costs
- Denial of service
- API quota exhaustion

**Fix:** Implement rate limiting using `@upstash/ratelimit` or similar:

```typescript
// src/lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
});
```

### 2.3 API Key Exposure Risk

**Location:** `src/components/sources/SettingsView.tsx:9,51-63`

**Problem:** The Settings UI allows viewing/entering API key in a text field. While currently not persisted, this pattern is dangerous.

**Fix:**
1. Remove the API key input field entirely
2. Only show masked status (e.g., "API Key: ****...****")
3. Add environment variable validation on startup

### 2.4 No Error Boundaries

**Problem:** No React error boundaries exist. A single component error will crash the entire app.

**Fix:** Add error boundaries:

```typescript
// src/components/ErrorBoundary.tsx
'use client';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught:', error, info);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

---

## 3. Security Vulnerabilities

### 3.1 Server-Side Request Forgery (SSRF) Risk

**Location:** `src/app/api/rss/route.ts:16`

**Problem:** The RSS endpoint accepts any URL and fetches it server-side without validation. Attackers could:
- Scan internal network
- Access cloud metadata endpoints
- Exfiltrate data

**Current Code:**
```typescript
const items = await fetchRSSFeed(url); // url is user-provided, unvalidated
```

**Fix:**
```typescript
// src/lib/url-validator.ts
const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254', // AWS metadata
  'metadata.google.internal', // GCP metadata
];

export function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) return false;
    if (BLOCKED_HOSTS.some(host => url.hostname.includes(host))) return false;
    if (url.hostname.match(/^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^192\.168\./)) return false;
    return true;
  } catch {
    return false;
  }
}
```

### 3.2 XSS via RSS Content

**Location:** `src/lib/rss.ts:52-61`

**Problem:** The `stripHtml` function is basic and could miss malicious content.

**Current Code:**
```typescript
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    // ... basic replacements
}
```

**Fix:** Use a proper sanitization library:
```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeContent(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
```

### 3.3 Missing Content-Security-Policy

**Location:** `src/app/layout.tsx`

**Problem:** No CSP headers are set, making the app vulnerable to XSS.

**Fix:** Add to `next.config.ts`:
```typescript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
];
```

### 3.4 No CSRF Protection

**Problem:** API routes don't validate request origin, making them vulnerable to CSRF attacks.

**Fix:** Add origin validation middleware:
```typescript
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin) return true; // Same-origin requests don't send origin
  return origin === `https://${host}` || origin === `http://${host}`;
}
```

---

## 4. Code Quality Issues

### 4.1 Oversized Components

**Problem:** Several component files exceed 400 lines, making them hard to maintain.

| File | Lines | Recommendation |
|------|-------|----------------|
| `DigestView.tsx` | 472 | Split into 4-5 components |
| `SourcesView.tsx` | 454 | Split into 3-4 components |
| `KnowledgeView.tsx` | 454 | Split into 3-4 components |
| `PredictionsView.tsx` | 390 | Split into 2-3 components |
| `DataReleasesView.tsx` | 320 | Split into 2-3 components |
| `store/index.ts` | 334 | Split by domain (sources, knowledge, etc.) |

**Recommended DigestView.tsx Split:**
```
src/components/digest/
├── DigestView.tsx          # Main container (~100 lines)
├── DigestHeader.tsx        # Header with generate button
├── DigestContent.tsx       # Generated digest display
├── DigestSection.tsx       # Collapsible section wrapper
├── SourceItemCard.tsx      # Individual source item
├── DataReleaseCard.tsx     # Data release card
└── ThesisCheckIn.tsx       # Thesis section
```

### 4.2 Component Naming Issue

**Location:** `src/components/sources/DataReleasesView.tsx:118,155-157`

**Problem:** Function named `DataReleaseSectionProps` but used as a component:

```typescript
function DataReleaseSectionProps({ ... }: DataReleaseSectionProps) { // Wrong name
  return (...);
}

function DataReleaseSection(props: DataReleaseSectionProps) {
  return <DataReleaseSectionProps {...props} />; // Confusing
}
```

**Fix:** Rename to just `DataReleaseSection` and remove the wrapper.

### 4.3 Inconsistent Hook Usage

**Location:** `src/components/sources/DataReleasesView.tsx:186-188`

**Problem:** State initialization in `DataReleaseCard` uses props but doesn't sync when props change:

```typescript
function DataReleaseCard({ release, ... }) {
  const [lastValue, setLastValue] = useState(release.lastValue || '');
  // If release.lastValue changes, lastValue won't update
}
```

**Fix:** Use `useEffect` to sync or lift state up:
```typescript
useEffect(() => {
  setLastValue(release.lastValue || '');
}, [release.lastValue]);
```

### 4.4 Magic Strings Throughout

**Problem:** Tier names, status values, and other constants are hardcoded as strings.

**Examples:**
- `src/store/index.ts:69` - `activeView` uses string literals
- `src/types/index.ts` - Various status strings
- Multiple components use `'tier1'`, `'tier2'`, etc.

**Fix:** Create constants file:
```typescript
// src/lib/constants.ts
export const TIERS = {
  TIER1: 'tier1',
  TIER2: 'tier2',
  TIER3: 'tier3',
  TIER4: 'tier4',
} as const;

export const PREDICTION_STATUS = {
  PENDING: 'pending',
  CORRECT: 'correct',
  INCORRECT: 'incorrect',
  PARTIAL: 'partial',
} as const;

export const VIEWS = {
  DIGEST: 'digest',
  KNOWLEDGE: 'knowledge',
  SOURCES: 'sources',
  DATA: 'data',
  PREDICTIONS: 'predictions',
  SETTINGS: 'settings',
} as const;
```

### 4.5 Unused Imports

**Location:** Multiple files

| File | Unused Import |
|------|---------------|
| `SourcesView.tsx:11` | `Edit2` |
| `SourcesView.tsx:14` | `Star` |
| `KnowledgeView.tsx:10` | `Tag` |
| `KnowledgeView.tsx:12` | `Eye` |

**Fix:** Remove unused imports.

### 4.6 Console Logging in Production

**Location:** Multiple files

| File | Line |
|------|------|
| `DigestView.tsx` | 88 |
| `SourcesView.tsx` | 54 |
| `ChatModal.tsx` | 57 |
| `ManualInputModal.tsx` | 64 |
| All API routes | Error handlers |

**Fix:** Use a proper logging library with log levels:
```typescript
// src/lib/logger.ts
const LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'error' : 'debug';

export const logger = {
  debug: (...args: unknown[]) => LOG_LEVEL === 'debug' && console.log(...args),
  info: (...args: unknown[]) => ['debug', 'info'].includes(LOG_LEVEL) && console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};
```

---

## 5. Type Safety Issues

### 5.1 Type Assertions Without Validation

**Location:** `src/store/index.ts:230`

**Problem:** Unsafe type assertion:
```typescript
contextType: contextType as ChatSession['contextType'],
```

**Fix:** Validate the input or use a type guard.

### 5.2 Loose Types in Components

**Location:** Multiple component prop interfaces

**Examples:**
- `DataReleasesView.tsx:108` - `trend?: string` should be `trend?: 'up' | 'down' | 'flat'`
- `DataReleasesView.tsx:114` - `Record<string, unknown>` is too loose
- `PredictionsView.tsx:158` - `Record<string, unknown>` for updates

**Fix:** Use strict types from `src/types/index.ts`:
```typescript
// Instead of
onUpdate: (updates: Record<string, unknown>) => void;

// Use
onUpdate: (updates: Partial<DataRelease>) => void;
```

### 5.3 Missing Discriminated Unions

**Location:** `src/types/index.ts`

**Problem:** Types don't leverage discriminated unions for better type narrowing.

**Fix:** Example for Source type:
```typescript
interface BaseSource {
  id: string;
  name: string;
  tier: SourceTier;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

interface TwitterSource extends BaseSource {
  platform: 'twitter';
  handle: string;
}

interface SubstackSource extends BaseSource {
  platform: 'substack';
  rssUrl: string;
}

interface ManualSource extends BaseSource {
  platform: 'manual';
}

export type Source = TwitterSource | SubstackSource | ManualSource;
```

### 5.4 Optional Properties Should Have Defaults

**Location:** `src/types/index.ts`

**Problem:** Many optional properties lead to undefined checks throughout the codebase.

**Fix:** Consider using required properties with sensible defaults in the store actions.

---

## 6. Performance Concerns

### 6.1 No Memoization

**Location:** Multiple components

**Problem:** Components re-render unnecessarily because:
- No `useMemo` for expensive computations
- No `useCallback` for event handlers passed to children

**Examples:**
- `KnowledgeView.tsx:24` - `topics` array recreated on every render
- `KnowledgeView.tsx:30-38` - `filteredEntries` recomputed on every render

**Fix:**
```typescript
const topics = useMemo(
  () => Array.from(new Set(knowledgeEntries.map((e) => e.topic))),
  [knowledgeEntries]
);

const filteredEntries = useMemo(
  () => knowledgeEntries.filter((entry) => {
    // filter logic
  }),
  [knowledgeEntries, searchQuery, selectedTopic]
);
```

### 6.2 Large State Slices

**Location:** `src/store/index.ts`

**Problem:** Every component subscribing to the store re-renders when any state changes because selectors return new references.

**Fix:** Use shallow equality selectors:
```typescript
import { shallow } from 'zustand/shallow';

// In components
const { sources, addSource } = useAppStore(
  (state) => ({ sources: state.sources, addSource: state.addSource }),
  shallow
);
```

### 6.3 No Virtualization for Long Lists

**Location:** `DigestView.tsx:175`, `KnowledgeView.tsx:148`, etc.

**Problem:** Lists render all items, which could cause performance issues with large datasets.

**Fix:** Use `@tanstack/react-virtual` for list virtualization:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              height: virtualItem.size,
            }}
          >
            <ItemCard item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 6.4 No Debouncing on Search

**Location:** `KnowledgeView.tsx:49-54`

**Problem:** Search input triggers filtering on every keystroke.

**Fix:**
```typescript
import { useDebouncedValue } from '@/hooks/useDebounce';

const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebouncedValue(searchQuery, 300);

// Use debouncedSearch for filtering
```

### 6.5 Inefficient Initial Data Loading

**Location:** `src/store/index.ts:289-317`

**Problem:** `initializeData` generates new UUIDs for every item every time it's called, even though it checks for empty arrays.

**Fix:** Move UUID generation to initial-data.ts or use stable IDs.

---

## 7. Missing Features

### 7.1 No Authentication

**Priority:** High for production

**Recommendation:** Implement NextAuth.js or Supabase Auth:
```typescript
// src/lib/auth.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Or with NextAuth
import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
```

### 7.2 No Database Persistence

**Location:** `src/lib/supabase.ts` - defined but unused

**Problem:** Data is only stored in localStorage, which is:
- Lost when browser data is cleared
- Not synced across devices
- Limited to ~5MB

**Fix:** Implement Supabase integration using the existing schema in `supabase.ts:9-146`.

### 7.3 No Data Export

**Problem:** No way to export digests, knowledge entries, or predictions.

**Fix:** Add export functionality:
```typescript
// src/lib/export.ts
export function exportToJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToMarkdown(digest: Digest): string {
  // Convert digest to markdown
}
```

### 7.4 No Offline Support

**Problem:** App doesn't work offline.

**Fix:** Add PWA support with service worker:
```typescript
// next.config.ts
import withPWA from 'next-pwa';

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})({
  // existing config
});
```

### 7.5 No Twitter/X Integration

**Location:** `src/lib/initial-data.ts:1-106`

**Problem:** Twitter sources are pre-configured but there's no actual Twitter API integration.

**Options:**
1. Integrate with Twitter API v2 (requires paid access)
2. Use RSS feeds from Nitter instances
3. Use a third-party service like RapidAPI

### 7.6 No Automated Digest Scheduling

**Problem:** Digests must be manually generated.

**Fix:** Add cron job support:
```typescript
// src/app/api/cron/digest/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate and save digest
  return NextResponse.json({ success: true });
}
```

### 7.7 No Edit Functionality for Knowledge Entries

**Location:** `KnowledgeView.tsx:271-273`

**Problem:** Edit button exists but does nothing:
```typescript
<button className="...">
  <Edit2 size={12} />
  Edit
</button>
```

**Fix:** Implement edit modal or inline editing.

---

## 8. Component-Specific Issues

### 8.1 DigestView.tsx

| Line | Issue | Fix |
|------|-------|-----|
| 46 | `slice(0, 20)` is arbitrary | Make configurable or fetch by date range |
| 73-86 | Response not validated before use | Add response validation |
| 79-85 | Digest saved with empty sections | Parse generated content into sections |
| 127-157 | Manual markdown parsing is fragile | Use a markdown parser like `marked` |

### 8.2 SourcesView.tsx

| Line | Issue | Fix |
|------|-------|-----|
| 27 | `typeof sources[0]` is awkward | Define proper type |
| 38-50 | Fetches only 5 items, arbitrary limit | Make configurable |
| 51 | Updates `lastFetched` even on partial success | Only update on full success |

### 8.3 ChatModal.tsx

| Line | Issue | Fix |
|------|-------|-----|
| 18 | Messages state duplicates store | Use store's chat sessions |
| 32 | No message length limit | Add max length validation |
| 42 | No request cancellation on unmount | Add AbortController |

### 8.4 ManualInputModal.tsx

| Line | Issue | Fix |
|------|-------|-----|
| 29-44 | Creates mock source object | Should use or create actual source in store |
| 48 | `title` generation is inconsistent | Standardize title generation |

### 8.5 Sidebar.tsx

| Line | Issue | Fix |
|------|-------|-----|
| 72-76 | Hardcoded "Jan 2026" date | Use `thesis.lastUpdated` dynamically |

### 8.6 Header.tsx

| Line | Issue | Fix |
|------|-------|-----|
| 48-49 | Bell button has no functionality | Either implement or remove |

---

## 9. API Route Issues

### 9.1 Common Issues Across All Routes

| Issue | Files | Fix |
|-------|-------|-----|
| No request validation | All | Add Zod schemas |
| No rate limiting | All | Add rate limiter middleware |
| Generic error messages | All | Return specific, safe error messages |
| No request logging | All | Add logging middleware |
| No timeout handling | All | Add request timeouts |

### 9.2 Digest Generate Route

**Location:** `src/app/api/digest/generate/route.ts`

**Issues:**
- No limit on `items` array size (could cause OOM)
- No caching of similar requests
- No streaming for long-running generation

**Fix:**
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate
  const validated = DigestRequestSchema.parse(body);

  // Limit items
  if (validated.items.length > 50) {
    return NextResponse.json(
      { error: 'Too many items (max 50)' },
      { status: 400 }
    );
  }

  // Rate limit check
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // ... rest of implementation
}
```

### 9.3 RSS Route

**Location:** `src/app/api/rss/route.ts`

**Issues:**
- SSRF vulnerability (see Security section)
- No timeout for slow feeds
- No caching

**Fix:**
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url } = RssRequestSchema.parse(body);

  // Validate URL
  if (!isAllowedUrl(url)) {
    return NextResponse.json(
      { error: 'Invalid or blocked URL' },
      { status: 400 }
    );
  }

  // Add timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const items = await fetchRSSFeed(url, { signal: controller.signal });
    return NextResponse.json({ items });
  } finally {
    clearTimeout(timeout);
  }
}
```

---

## 10. State Management Issues

### 10.1 Store is Too Monolithic

**Location:** `src/store/index.ts`

**Problem:** Single 334-line store file handling all domains.

**Fix:** Split into domain-specific slices:
```typescript
// src/store/sources.ts
// src/store/knowledge.ts
// src/store/predictions.ts
// src/store/digests.ts
// src/store/chat.ts
// src/store/ui.ts
// src/store/index.ts (combines all)
```

### 10.2 No Optimistic Updates

**Problem:** UI waits for operations to complete before updating.

**Fix:** Implement optimistic updates with rollback:
```typescript
addSourceItem: (item) => {
  const tempId = `temp-${Date.now()}`;
  const optimisticItem = { ...item, id: tempId, createdAt: new Date().toISOString() };

  // Optimistically update
  set((state) => ({ sourceItems: [optimisticItem, ...state.sourceItems] }));

  // Sync with server (when implemented)
  // On failure, roll back
}
```

### 10.3 No Undo/Redo

**Problem:** Destructive actions (delete) have no undo.

**Fix:** Implement undo stack:
```typescript
interface UndoState {
  past: AppState[];
  future: AppState[];
}

// Or use zustand middleware
import { temporal } from 'zundo';

export const useAppStore = create<AppState>()(
  temporal(
    persist(
      (set, get) => ({
        // ... state
      })
    )
  )
);
```

### 10.4 localStorage Size Limits

**Problem:** localStorage is limited to ~5MB. With many source items and digests, this could be exceeded.

**Fix:**
1. Implement data pruning (remove old items)
2. Use IndexedDB for larger storage
3. Migrate to Supabase

```typescript
// Data pruning
const MAX_SOURCE_ITEMS = 1000;
const MAX_DIGESTS = 100;

// In store
addSourceItem: (item) => {
  set((state) => {
    const newItems = [newItem, ...state.sourceItems];
    // Prune if over limit
    return { sourceItems: newItems.slice(0, MAX_SOURCE_ITEMS) };
  });
}
```

---

## 11. UI/UX Issues

### 11.1 No Loading States

**Location:** Most components

**Problem:** No skeleton loaders or loading indicators during data fetching.

**Fix:** Add loading states:
```typescript
function DigestView() {
  const { isLoading, sourceItems } = useAppStore();

  if (isLoading) {
    return <DigestSkeleton />;
  }

  return (/* actual content */);
}
```

### 11.2 No Empty States

**Location:** `DigestView.tsx:169-172` has one, but others are inconsistent

**Problem:** Inconsistent empty state messaging and design.

**Fix:** Create reusable empty state component:
```typescript
// src/components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <Icon className="mx-auto mb-4 text-zinc-300" size={40} />
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-zinc-500">{description}</p>
      {action && (
        <button onClick={action.onClick} className="mt-4 text-blue-600">
          {action.label}
        </button>
      )}
    </div>
  );
}
```

### 11.3 No Keyboard Shortcuts

**Problem:** Power users can't navigate quickly.

**Fix:** Add keyboard shortcuts:
```typescript
// src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';

export function useKeyboardShortcuts() {
  const { setActiveView } = useAppStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case '1': setActiveView('digest'); break;
          case '2': setActiveView('knowledge'); break;
          case '3': setActiveView('sources'); break;
          case '4': setActiveView('data'); break;
          case '5': setActiveView('predictions'); break;
          case ',': setActiveView('settings'); break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveView]);
}
```

### 11.4 Modal Accessibility Issues

**Location:** All modal components

**Problems:**
- No focus trap
- No escape key to close
- No aria attributes

**Fix:**
```typescript
// Add to modals
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [onClose]);

// Use @headlessui/react or radix-ui for proper accessibility
import { Dialog } from '@headlessui/react';
```

### 11.5 No Toast Notifications

**Problem:** No feedback for successful/failed operations.

**Fix:** Add toast system:
```typescript
// Use react-hot-toast or sonner
import { toast } from 'sonner';

// In components
const handleSave = async () => {
  try {
    await save();
    toast.success('Saved successfully');
  } catch (error) {
    toast.error('Failed to save');
  }
};
```

### 11.6 Inconsistent Dark Mode

**Location:** Throughout components

**Problem:** Some components have hardcoded colors that don't respect dark mode.

**Fix:** Audit all color classes to ensure `dark:` variants exist.

---

## 12. Testing & CI/CD

### 12.1 No Tests

**Problem:** Zero test coverage.

**Required Tests:**

**Unit Tests (Vitest):**
```typescript
// src/lib/__tests__/rss.test.ts
import { describe, it, expect } from 'vitest';
import { stripHtml, truncateContent } from '../rss';

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello</p>')).toBe('Hello');
  });

  it('handles special entities', () => {
    expect(stripHtml('&amp;')).toBe('&');
  });
});
```

**Integration Tests (Playwright):**
```typescript
// e2e/digest.spec.ts
import { test, expect } from '@playwright/test';

test('can generate digest', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Generate Digest');
  await expect(page.locator('.digest-content')).toBeVisible();
});
```

**API Tests:**
```typescript
// src/app/api/__tests__/digest.test.ts
import { POST } from '../digest/generate/route';

describe('POST /api/digest/generate', () => {
  it('returns 400 for invalid input', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

### 12.2 No CI/CD Pipeline

**Problem:** No automated testing or deployment.

**Fix:** Add GitHub Actions:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run build

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

### 12.3 No Pre-commit Hooks

**Problem:** No automated checks before commit.

**Fix:** Add Husky + lint-staged:
```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## 13. Documentation

### 13.1 Missing Documentation

| Document | Purpose |
|----------|---------|
| API.md | Document all API endpoints |
| ARCHITECTURE.md | System architecture overview |
| CONTRIBUTING.md | Contribution guidelines |
| DEPLOYMENT.md | Deployment instructions |
| .env.example | Already exists but incomplete |

### 13.2 Code Documentation

**Problem:** No JSDoc comments on functions.

**Fix:** Add documentation:
```typescript
/**
 * Generates a daily digest from source items and data releases.
 *
 * @param items - Array of source items to include in digest
 * @param dataReleases - Array of recent data releases
 * @param thesis - Current investment thesis context
 * @returns Generated digest content as markdown string
 * @throws {AnthropicError} If Claude API call fails
 */
export async function generateDigest(
  items: DigestItem[],
  dataReleases: DataReleaseInput[],
  thesis: ThesisInput | null
): Promise<string> {
  // ...
}
```

---

## 14. Recommendations Summary

### Immediate (Before Production)

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Add input validation to all API routes | 2-4 hours |
| P0 | Add rate limiting | 1-2 hours |
| P0 | Fix SSRF vulnerability in RSS route | 1 hour |
| P0 | Add error boundaries | 1 hour |
| P0 | Remove API key input field | 30 minutes |

### Short-term (Next Sprint)

| Priority | Item | Effort |
|----------|------|--------|
| P1 | Add unit tests (minimum 50% coverage) | 2-3 days |
| P1 | Set up CI/CD pipeline | 2-4 hours |
| P1 | Split large components | 1-2 days |
| P1 | Add proper loading states | 4-8 hours |
| P1 | Fix type safety issues | 2-4 hours |

### Medium-term (Next Month)

| Priority | Item | Effort |
|----------|------|--------|
| P2 | Implement Supabase persistence | 2-3 days |
| P2 | Add authentication | 1-2 days |
| P2 | Add keyboard shortcuts | 4-8 hours |
| P2 | Add toast notifications | 2-4 hours |
| P2 | Implement data export | 4-8 hours |

### Long-term (Backlog)

| Priority | Item | Effort |
|----------|------|--------|
| P3 | Add PWA support | 1 day |
| P3 | Implement digest scheduling | 1-2 days |
| P3 | Add virtualization for long lists | 4-8 hours |
| P3 | Twitter/X API integration | 2-3 days |
| P3 | Add undo/redo functionality | 1-2 days |

---

## Appendix: Package.json Recommendations

### Add Missing Dependencies

```json
{
  "dependencies": {
    "zod": "^3.22.0",
    "isomorphic-dompurify": "^2.3.0",
    "@upstash/ratelimit": "^1.0.0",
    "@upstash/redis": "^1.25.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@playwright/test": "^1.40.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0",
    "@types/dompurify": "^3.0.0"
  }
}
```

### Add Missing Scripts

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "prepare": "husky install"
  }
}
```

---

**End of Audit Report**
