import { tool } from 'ai';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import { getDomain, getFaviconUrl } from './shared';

export interface FetchUrlResultItem {
  url: string;
  title: string;
  domain: string;
  favicon: string;
  content: string;
}

export interface FetchUrlToolOutput {
  success: boolean;
  data?: {
    results: FetchUrlResultItem[];
    failed: string[];
  };
  error?: string;
}

// Cap extracted content to keep token usage reasonable
const MAX_CONTENT_CHARS = 12000;

export const createFetchUrlTool = () => {
  const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY as string });

  return tool<
    {
      urls: string[];
    },
    FetchUrlToolOutput
  >({
    description:
      'Read the full content of one or more specific web pages by URL. Use this when the user shares a link, or to deep-read a promising result from web_search instead of relying on a short snippet.',
    inputSchema: z.object({
      urls: z
        .array(z.string().url())
        .min(1)
        .max(5)
        .describe('The list of page URLs to fetch and read (max 5).'),
    }),
    execute: async ({ urls }) => {
      try {
        const response = await tvly.extract(urls, {
          format: 'markdown',
          extractDepth: 'basic',
          includeFavicon: true,
        });

        const results: FetchUrlResultItem[] = response.results.map(r => ({
          url: r.url,
          title: r.title || getDomain(r.url),
          domain: getDomain(r.url),
          favicon: r.favicon || getFaviconUrl(r.url),
          content: (r.rawContent || '').slice(0, MAX_CONTENT_CHARS),
        }));

        return {
          success: true,
          data: {
            results,
            failed: (response.failedResults ?? []).map(f => f.url),
          },
        };
      } catch (error) {
        console.error('Tavily extract error:', error);
        return {
          success: false,
          error: 'Failed to fetch the requested URL(s)',
        };
      }
    },
  });
};
