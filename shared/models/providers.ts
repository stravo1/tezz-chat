/**
 * Static configuration for the LLM providers supported by tezz.chat.
 *
 * This file is the single source of truth for:
 *  - which providers we expose in the UI (see https://models.dev)
 *  - the AI SDK package used to route requests for each provider
 *  - which env var to read for the server-side default API key
 *  - the BYOK header name forwarded from the browser to /api/chat
 *
 * Model metadata (display name, tool_call, modalities, etc.) is *not* declared
 * here — it is pulled at runtime from https://models.dev/api.json
 * (see `server/utils/modelsRegistry.ts`).
 */

export type SupportedProviderId =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openrouter'
  | 'vercel'
  | 'friendli'
  | 'chutes'
  | 'fastrouter';

export type ProviderSdkKind =
  /** Has its own first-party AI SDK package. */
  | 'native'
  /** Uses `@ai-sdk/openai-compatible` with a base URL. */
  | 'openai-compatible';

export interface ProviderConfig {
  /** Internal/UI slug AND the models.dev provider key. */
  id: SupportedProviderId;
  /** Display name (shown if models.dev lookup fails). */
  fallbackName: string;
  /** How to dispatch requests for this provider. */
  sdk: ProviderSdkKind;
  /** Env var consulted on the server when no BYOK key is forwarded. */
  serverEnvKey: string;
  /**
   * BYOK header forwarded from the browser. Generic format `x-byok-<id>`.
   * We also store the raw localStorage key under the same suffix for symmetry.
   */
  byokHeader: string;
  /** localStorage key used by the SettingsModal to persist a BYOK key. */
  byokStorageKey: string;
  /**
   * Base URL for openai-compatible providers. Ignored for native SDKs.
   * Source: https://models.dev/api.json
   */
  apiBase?: string;
}

export const PROVIDERS: readonly ProviderConfig[] = [
  {
    id: 'openai',
    fallbackName: 'OpenAI',
    sdk: 'native',
    serverEnvKey: 'OPENAI_API_KEY',
    byokHeader: 'x-byok-openai',
    byokStorageKey: 'byok-openai',
  },
  {
    id: 'anthropic',
    fallbackName: 'Anthropic',
    sdk: 'native',
    serverEnvKey: 'ANTHROPIC_API_KEY',
    byokHeader: 'x-byok-anthropic',
    byokStorageKey: 'byok-anthropic',
  },
  {
    id: 'google',
    fallbackName: 'Google',
    sdk: 'native',
    serverEnvKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    byokHeader: 'x-byok-google',
    byokStorageKey: 'byok-google',
  },
  {
    id: 'openrouter',
    fallbackName: 'OpenRouter',
    sdk: 'native',
    serverEnvKey: 'OPENROUTER_API_KEY',
    byokHeader: 'x-byok-openrouter',
    byokStorageKey: 'byok-openrouter',
  },
  {
    id: 'vercel',
    fallbackName: 'Vercel AI Gateway',
    sdk: 'native',
    serverEnvKey: 'AI_GATEWAY_API_KEY',
    byokHeader: 'x-byok-vercel',
    byokStorageKey: 'byok-vercel',
  },
  {
    id: 'friendli',
    fallbackName: 'Friendli',
    sdk: 'openai-compatible',
    serverEnvKey: 'FRIENDLI_TOKEN',
    byokHeader: 'x-byok-friendli',
    byokStorageKey: 'byok-friendli',
    apiBase: 'https://api.friendli.ai/serverless/v1',
  },
  {
    id: 'chutes',
    fallbackName: 'Chutes',
    sdk: 'openai-compatible',
    serverEnvKey: 'CHUTES_API_KEY',
    byokHeader: 'x-byok-chutes',
    byokStorageKey: 'byok-chutes',
    apiBase: 'https://llm.chutes.ai/v1',
  },
  {
    id: 'fastrouter',
    fallbackName: 'FastRouter',
    sdk: 'openai-compatible',
    serverEnvKey: 'FASTROUTER_API_KEY',
    byokHeader: 'x-byok-fastrouter',
    byokStorageKey: 'byok-fastrouter',
    apiBase: 'https://go.fastrouter.ai/api/v1',
  },
] as const;

export const SUPPORTED_PROVIDER_IDS: readonly SupportedProviderId[] = PROVIDERS.map(p => p.id);

export function getProviderConfig(id: string): ProviderConfig | undefined {
  return PROVIDERS.find(p => p.id === id);
}

/**
 * Catalog model IDs are always `<providerId>/<modelId>` so we can route purely
 * from the chosen ID. This avoids any need to keep a parallel allowlist.
 */
export function parseCatalogId(catalogId: string): {
  provider: SupportedProviderId;
  modelId: string;
} | null {
  const slash = catalogId.indexOf('/');
  if (slash < 0) return null;
  const provider = catalogId.slice(0, slash) as SupportedProviderId;
  const modelId = catalogId.slice(slash + 1);
  if (!SUPPORTED_PROVIDER_IDS.includes(provider) || !modelId) return null;
  return { provider, modelId };
}

export const DEFAULT_MODEL_ID = 'google/gemini-3-flash-preview';
