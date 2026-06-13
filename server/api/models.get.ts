/**
 * GET /api/models
 *
 * Returns the curated catalog (only models from the providers declared in
 * `shared/models/providers.ts`) — sourced from https://models.dev/api.json,
 * cached in-memory for 24h on the server.
 *
 * Response shape:
 *   {
 *     providers: [{ id, name, modelCount }],
 *     models:    [{ id, provider, modelId, name, tool_call, attachment, reasoning, modalities, ... }],
 *     generatedAt: number
 *   }
 *
 * Used by `components/chat/ModelSelector.vue`.
 */

import { getCatalog } from '~/server/utils/modelsRegistry';
import { PROVIDERS } from '~/shared/models/providers';

export default defineEventHandler(async event => {
  try {
    const catalog = await getCatalog();
    // Edge-cacheable; the client also caches via useFetch / TanStack Query.
    setHeader(event, 'cache-control', 'public, max-age=300, s-maxage=3600');
    return {
      ...catalog,
      // Expose static provider config so the UI can know BYOK header names + storage keys.
      providerConfigs: PROVIDERS.map(p => ({
        id: p.id,
        sdk: p.sdk,
        byokStorageKey: p.byokStorageKey,
        byokHeader: p.byokHeader,
        fallbackName: p.fallbackName,
      })),
    };
  } catch (err) {
    console.error('[api/models] failed:', err);
    setResponseStatus(event, 502);
    return { error: 'Failed to load model catalog from models.dev' };
  }
});
