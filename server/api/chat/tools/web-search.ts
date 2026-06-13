import { tool } from 'ai';
import { z } from 'zod';
import { tavily } from '@tavily/core';

// Timezone to country code mapping
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Asia/Kolkata': 'in',
  'Asia/Dubai': 'ae',
  'Asia/Singapore': 'sg',
  'Asia/Tokyo': 'jp',
  'Asia/Shanghai': 'cn',
  'Europe/London': 'uk',
  'Europe/Paris': 'fr',
  'Europe/Berlin': 'de',
  'America/New_York': 'us',
  'America/Los_Angeles': 'us',
  'America/Chicago': 'us',
  'Australia/Sydney': 'au',
  'Pacific/Auckland': 'nz',
};

export interface WebSearchToolOutput {
  success: boolean;
  data?: {
    summary: string;
    results: string;
    totalResults: number;
  };
  error?: string;
}

export const createWebSearchTool = (userTimezone: string) => {
  const countryCode = TIMEZONE_TO_COUNTRY[userTimezone] ?? 'us';

  const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY as string });

  return tool<
    {
      query: string;
      num?: number;
      includeAnswer?: boolean;
    },
    WebSearchToolOutput
  >({
    description:
      'Search the web for up-to-date information using Tavily. Use this when you need current events, facts, or anything that may have changed recently.',
    inputSchema: z.object({
      query: z.string().describe('The search query to look up on the web.'),
      num: z.number().optional().describe('Max number of results to return (default: 5, max: 10).'),
      includeAnswer: z
        .boolean()
        .optional()
        .describe('Whether to include a short AI-generated answer summary (default: true).'),
    }),
    execute: async ({ query, num = 5, includeAnswer = true }) => {
      try {
        const response = await tvly.search(query, {
          maxResults: Math.min(num, 10),
          includeAnswer,
          country: countryCode,
        });

        const results = response.results
          .map(
            r =>
              `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.content}${r.publishedDate ? `\nDate: ${r.publishedDate}` : ''}`
          )
          .join('\n\n');

        return {
          success: true,
          data: {
            summary: typeof response.answer === 'string' ? response.answer : '',
            results,
            totalResults: response.results.length,
          },
        };
      } catch (error) {
        console.error('Tavily search error:', error);
        return {
          success: false,
          error: 'Failed to perform web search',
        };
      }
    },
  });
};
