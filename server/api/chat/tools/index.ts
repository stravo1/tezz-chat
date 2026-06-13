import { type ModelType, doesSupportToolCalls } from '~/server/utils/model';
import { createWebSearchTool } from './web-search';
import { createNewsSearchTool } from './news-search';
import { createFetchUrlTool } from './fetch-url';

export interface ToolContext {
  userTimezone: string;
}

/**
 * Returns the tool set for a given model and context.
 * Automatically excludes tools for models that don't support tool calls.
 */
export const buildTools = (model: ModelType, ctx: ToolContext) => {
  if (!doesSupportToolCalls(model)) return undefined;

  return {
    web_search: createWebSearchTool(ctx.userTimezone),
    news_search: createNewsSearchTool(ctx.userTimezone),
    fetch_url: createFetchUrlTool(),
  };
};

export { createWebSearchTool, createNewsSearchTool, createFetchUrlTool };
