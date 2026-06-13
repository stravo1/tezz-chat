/**
 * Generic provider routing.
 *
 * Replaces the previous hand-maintained switch-case. Routing rules:
 *   - Model ID is always `<provider>/<modelId>` (see `shared/models/providers.ts`).
 *   - Provider lookup gives us the AI SDK package + (for openai-compatible
 *     providers) the base URL.
 *   - The capability flag `tool_call` is sourced from models.dev via the cached
 *     `modelsRegistry`. No hardcoded allowlist.
 *
 * API keys: request-scoped BYOK key (forwarded as `x-byok-<provider>`) is
 * preferred, falling back to the matching server-side env var.
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createGateway } from '@ai-sdk/gateway';

import {
  getProviderConfig,
  parseCatalogId,
  type ProviderConfig,
  type SupportedProviderId,
} from '../../shared/models/providers';
import { getCatalogModel, getCachedCatalog } from './modelsRegistry';

// Re-exported so existing callers compile; semantics: any string the catalog accepts.
export type ModelType = string;

/**
 * Per-request BYOK keys forwarded from the browser. Keyed by provider ID.
 */
export type ByokKeys = Partial<Record<SupportedProviderId, string | undefined>>;

export interface ModelOptions {
  byok?: ByokKeys;
}

// ── Capability lookup ───────────────────────────────────────────────────────

/**
 * Returns `true` when the catalog reports `tool_call: true` for the model.
 * Returns `false` if the model is unknown or the registry has not loaded yet.
 */
export async function doesSupportToolCalls(modelId: string): Promise<boolean> {
  const m = await getCatalogModel(modelId);
  return !!m?.tool_call;
}

/**
 * Synchronous variant for code paths that must remain sync. Uses the in-memory
 * cache only — returns `false` if the catalog isn't loaded yet.
 */
export function doesSupportToolCallsSync(modelId: string): boolean {
  const cat = getCachedCatalog();
  if (!cat) return false;
  return !!cat.models.find(m => m.id === modelId)?.tool_call;
}

// ── Provider model factory ──────────────────────────────────────────────────

export async function getModel(modelId: string, options: ModelOptions = {}) {
  const parsed = parseCatalogId(modelId);
  if (!parsed) {
    throw new Error(`Unknown model id "${modelId}" — expected "<provider>/<model>"`);
  }

  const config = getProviderConfig(parsed.provider);
  if (!config) {
    throw new Error(`Provider "${parsed.provider}" is not supported`);
  }

  // Ensure the model exists in the catalog so we fail closed on typos.
  const catalogModel = await getCatalogModel(modelId);
  if (!catalogModel) {
    throw new Error(`Model "${modelId}" not found in models.dev catalog`);
  }

  const apiKey = resolveApiKey(config, options.byok);
  if (!apiKey) {
    throw new Error(
      `Missing API key for provider "${config.id}". Set ${config.serverEnvKey} on the server or provide a BYOK key.`
    );
  }

  return instantiate(config, parsed.modelId, apiKey);
}

function resolveApiKey(config: ProviderConfig, byok?: ByokKeys): string | undefined {
  const fromByok = byok?.[config.id];
  if (fromByok && fromByok.trim()) return fromByok.trim();
  return process.env[config.serverEnvKey] || undefined;
}

function instantiate(config: ProviderConfig, modelId: string, apiKey: string) {
  switch (config.id) {
    case 'openai':
      return createOpenAI({ apiKey })(modelId);

    case 'anthropic':
      return createAnthropic({ apiKey })(modelId);

    case 'google':
      return createGoogleGenerativeAI({ apiKey })(modelId);

    case 'openrouter':
      return createOpenRouter({ apiKey }).chat(modelId);

    case 'vercel':
      return createGateway({ apiKey })(modelId);

    case 'friendli':
    case 'chutes':
    case 'fastrouter':
      if (!config.apiBase) {
        throw new Error(`Provider "${config.id}" is openai-compatible but has no apiBase`);
      }
      return createOpenAICompatible({
        name: config.id,
        apiKey,
        baseURL: config.apiBase,
        includeUsage: true,
      })(modelId);

    default: {
      const _exhaustive: never = config.id;
      throw new Error(`Unhandled provider ${_exhaustive}`);
    }
  }
}

// ── Convenience helpers for callers that need to read BYOK headers ──────────

import type { H3Event } from 'h3';
import { PROVIDERS } from '../../shared/models/providers';

/** Reads `x-byok-<provider>` headers off the request into a typed ByokKeys map. */
export function readByokHeaders(event: H3Event): ByokKeys {
  const headers = getRequestHeaders(event);
  const out: ByokKeys = {};
  for (const p of PROVIDERS) {
    const v = headers[p.byokHeader];
    if (typeof v === 'string' && v.trim()) out[p.id] = v.trim();
  }
  return out;
}
