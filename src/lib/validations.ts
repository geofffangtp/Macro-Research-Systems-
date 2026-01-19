import { z } from 'zod';

// URL validation helper - prevents SSRF attacks
const safeUrlSchema = z.string().url().refine(
  (url) => {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }
      // Block private/internal IP ranges
      const hostname = parsed.hostname.toLowerCase();
      const privatePatterns = [
        /^localhost$/,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^0\./,
        /^169\.254\./,  // Link-local
        /^::1$/,
        /^fc00:/,
        /^fe80:/,
      ];
      return !privatePatterns.some((pattern) => pattern.test(hostname));
    } catch {
      return false;
    }
  },
  { message: 'Invalid or disallowed URL' }
);

// RSS endpoint schema
export const rssRequestSchema = z.object({
  url: safeUrlSchema,
});

// Chat endpoint schema
export const chatRequestSchema = z.object({
  item: z.object({
    title: z.string().max(1000),
    content: z.string().max(50000),
    source: z.string().max(500).optional(),
  }).optional(),
  message: z.string().min(1).max(10000),
  previousMessages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().max(50000),
    })
  ).max(50).optional(),
  thesis: z.object({
    name: z.string().max(500).optional(),
    summary: z.string().max(5000),
  }).nullish(),
});

// Digest generation schema
export const digestRequestSchema = z.object({
  items: z.array(
    z.object({
      source: z.string().max(500),
      content: z.string().max(50000),
      url: z.string().max(2000).optional(),
    })
  ).max(100).default([]),
  dataReleases: z.array(
    z.object({
      name: z.string().max(500),
      value: z.string().max(100).optional(),
      trend: z.string().max(50).optional(),
    })
  ).max(50).default([]),
  thesis: z.object({
    summary: z.string().max(5000),
    keyMonitors: z.array(z.string().max(500)).max(20).default([]),
  }).nullable().default(null),
});

// Knowledge analysis schema
export const knowledgeAnalyzeSchema = z.object({
  content: z.string().min(1).max(100000),
  existingTopics: z.array(z.string().max(200)).max(100).optional(),
});

// Reset endpoint schema - with valid reset types
export const resetRequestSchema = z.object({
  resetType: z.enum(['all', 'sources', 'data_releases', 'knowledge', 'predictions', 'digests', 'chat', 'thesis']),
  // Confirmation token to prevent accidental deletions
  confirmToken: z.string().min(1),
});

// FRED endpoint schema
export const fredRefreshSchema = z.object({
  seriesIds: z.array(z.string().max(50)).max(20).optional(),
});

// Helper to validate and parse request body
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: `Validation failed: ${errors}` };
    }

    return { success: true, data: result.data };
  } catch {
    return { success: false, error: 'Invalid JSON body' };
  }
}
