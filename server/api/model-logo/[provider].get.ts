/**
 * GET /api/model-logo/:provider
 *
 * Proxies and caches provider logo SVGs from https://models.dev/logos/{provider}.svg.
 *
 *  - Allowlists the provider against `SUPPORTED_PROVIDER_IDS` to prevent open-redirect / SSRF.
 *  - In-memory LRU-style cache keyed by provider (entries expire after 24h).
 *  - Sends long cache headers so the browser & CDN serve subsequent requests for free.
 *
 * Used by `<img src="/api/model-logo/openai">` in the ModelSelector.
 *
 * Note: the URL has no extension because Nuxt's [param] file routing prefers a clean
 * path. The response is still served with `Content-Type: image/svg+xml`.
 */

import { SUPPORTED_PROVIDER_IDS } from '~/shared/models/providers';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  body: string;
  expiresAt: number;
}

// Module-scope cache (one entry per provider — at most 8 entries).
const cache = new Map<string, CacheEntry>();

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity="0.2"/><text x="12" y="16" text-anchor="middle" font-size="10" font-family="sans-serif">?</text></svg>`;

export default defineEventHandler(async event => {
  const provider = getRouterParam(event, 'provider') ?? '';

  setHeader(event, 'content-type', 'image/svg+xml; charset=utf-8');

  if (!SUPPORTED_PROVIDER_IDS.includes(provider as any)) {
    setResponseStatus(event, 404);
    setHeader(event, 'cache-control', 'public, max-age=60');
    return FALLBACK_SVG;
  }

  const now = Date.now();
  const cached = cache.get(provider);
  if (cached && cached.expiresAt > now) {
    setHeader(event, 'cache-control', 'public, max-age=86400, s-maxage=86400, immutable');
    return cached.body;
  }

  try {
    const res = await fetch(`https://models.dev/logos/${provider}.svg`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw new Error(`models.dev responded ${res.status}`);
    const body = await res.text();
    cache.set(provider, { body, expiresAt: now + CACHE_TTL_MS });
    setHeader(event, 'cache-control', 'public, max-age=86400, s-maxage=86400, immutable');
    return body;
  } catch (err) {
    console.error(`[model-logo] failed for ${provider}:`, err);
    // Don't poison cache on failure; let next request retry.
    setHeader(event, 'cache-control', 'public, max-age=60');
    return FALLBACK_SVG;
  }
});
