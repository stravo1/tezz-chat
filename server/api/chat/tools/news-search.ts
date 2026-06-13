import { tool } from 'ai';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import { TIMEZONE_TO_COUNTRY, getDomain, getFaviconUrl } from './shared';
import type { SearchResultItem } from './web-search';

export interface NewsSearchToolOutput {
  success: boolean;
  data?: {
    query: string;
    answer: string;
    results: SearchResultItem[];
    totalResults: number;
  };
  error?: string;
}

const TIME_RANGE = ['day', 'week', 'month', 'year'] as const;

export const createNewsSearchTool = (userTimezone: string) => {
  const country = TIMEZONE_TO_COUNTRY[userTimezone] ?? 'united states';

  const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY as string });

  return tool<
    {
      query: string;
      num?: number;
      timeRange?: (typeof TIME_RANGE)[number];
      days?: number;
    },
    NewsSearchToolOutput
  >({
    description:
      'Search recent NEWS articles using Tavily. Use this for breaking news, current events, or anything time-sensitive where recency matters. Results are numbered — cite them inline as [1], [2], etc., matching the result order.',
    inputSchema: z.object({
      query: z.string().describe('The news topic or query to look up.'),
      num: z.number().optional().describe('Max number of results to return (default: 6, max: 10).'),
      timeRange: z
        .enum(TIME_RANGE)
        .optional()
        .describe('How far back to search for news (default: week).'),
      days: z
        .number()
        .optional()
        .describe('Alternatively, restrict to news from the last N days (overrides timeRange).'),
    }),
    execute: async ({ query, num = 6, timeRange = 'week', days }) => {
      try {
        const response = await tvly.search(query, {
          topic: 'news',
          maxResults: Math.min(num, 10),
          includeAnswer: true,
          includeFavicon: true,
          country,
          ...(days ? { days } : { timeRange }),
        });

        const results: SearchResultItem[] = response.results.map(r => ({
          title: r.title,
          url: r.url,
          content: r.content,
          domain: getDomain(r.url),
          favicon: r.favicon || getFaviconUrl(r.url),
          publishedDate: r.publishedDate,
        }));

        return {
          success: true,
          data: {
            query,
            answer: typeof response.answer === 'string' ? response.answer : '',
            results,
            totalResults: results.length,
          },
        };
      } catch (error) {
        console.error('Tavily news search error:', error);
        return {
          success: false,
          error: 'Failed to perform news search',
        };
      }
    },
  });
};
