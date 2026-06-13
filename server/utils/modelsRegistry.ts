/**
 * Models.dev registry loader.
 *
 * Fetches https://models.dev/api.json lazily on first access, caches it in
 * module-scope memory for `CACHE_TTL_MS`, and exposes typed helpers used by:
 *   - `server/utils/model.ts`            — looks up tool_call capability + routing
 *   - `server/api/models.get.ts`          — exposes the curated catalog to the UI
 *   - `server/api/chat/index.post.ts`     — validates the requested model ID
 *
 * Only the providers listed in `shared/models/providers.ts` are exposed.
 */

import {
  PROVIDERS,
  SUPPORTED_PROVIDER_IDS,
  type SupportedProviderId,
} from '../../shared/models/providers';

const REGISTRY_URL = 'https://models.dev/api.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const FETCH_TIMEOUT_MS = 10_000;

// ── Raw shape returned by models.dev ────────────────────────────────────────

interface RawCost {
  input?: number;
  output?: number;
  cache_read?: number;
  cache_write?: number;
  reasoning?: number;
}

interface RawLimit {
  context?: number;
  output?: number;
  input?: number;
}

interface RawModalities {
  input?: string[];
  output?: string[];
}

interface RawModel {
  id: string;
  name: string;
  attachment?: boolean;
  reasoning?: boolean;
  tool_call?: boolean;
  structured_output?: boolean;
  temperature?: boolean;
  knowledge?: string;
  release_date?: string;
  last_updated?: string;
  open_weights?: boolean;
  modalities?: RawModalities;
  limit?: RawLimit;
  cost?: RawCost;
}

interface RawProvider {
  id?: string;
  name: string;
  npm?: string;
  api?: string;
  env?: string[];
  doc?: string;
  models: Record<string, RawModel>;
}

type RawRegistry = Record<string, RawProvider>;

// ── Catalog shape consumed by the rest of the app ───────────────────────────

export interface CatalogModel {
  /** `<providerId>/<modelId>` — globally unique. */
  id: string;
  /** Provider key (subset of models.dev keys we support). */
  provider: SupportedProviderId;
  /** Upstream model ID as accepted by the AI SDK. */
  modelId: string;
  name: string;
  attachment: boolean;
  reasoning: boolean;
  tool_call: boolean;
  modalities: { input: string[]; output: string[] };
  limit?: RawLimit;
  cost?: RawCost;
  release_date?: string;
  knowledge?: string;
}

export interface CatalogProvider {
  id: SupportedProviderId;
  name: string;
  modelCount: number;
}

export interface Catalog {
  providers: CatalogProvider[];
  models: CatalogModel[];
  generatedAt: number;
}

// ── Cache state ─────────────────────────────────────────────────────────────

let cache: Catalog | null = null;
let cacheExpiresAt = 0;
let inflight: Promise<Catalog> | null = null;

// ── Public API ──────────────────────────────────────────────────────────────

export async function getCatalog(force = false): Promise<Catalog> {
  if (!force && cache && Date.now() < cacheExpiresAt) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const raw = await fetchRegistry();
      const catalog = buildCatalog(raw);
      cache = catalog;
      cacheExpiresAt = Date.now() + CACHE_TTL_MS;
      return catalog;
    } catch (err) {
      console.error('[modelsRegistry] failed to fetch models.dev:', err);
      // Serve stale cache rather than crashing the request path.
      if (cache) return cache;
      throw err;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export async function getCatalogModel(id: string): Promise<CatalogModel | undefined> {
  const catalog = await getCatalog();
  return catalog.models.find(m => m.id === id);
}

/**
 * Synchronous accessor — returns the in-memory catalog if one has been loaded.
 * Returns `null` before the first `getCatalog()` call completes.
 */
export function getCachedCatalog(): Catalog | null {
  return cache;
}

// ── Internals ───────────────────────────────────────────────────────────────

async function fetchRegistry(): Promise<RawRegistry> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(REGISTRY_URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`models.dev responded ${res.status}`);
    return (await res.json()) as RawRegistry;
  } finally {
    clearTimeout(timer);
  }
}

function buildCatalog(raw: RawRegistry): Catalog {
  const providers: CatalogProvider[] = [];
  const models: CatalogModel[] = [];

  for (const providerId of SUPPORTED_PROVIDER_IDS) {
    const rawProvider = raw[providerId];
    const config = PROVIDERS.find(p => p.id === providerId)!;

    if (!rawProvider) {
      console.warn(`[modelsRegistry] provider "${providerId}" not present on models.dev`);
      providers.push({ id: providerId, name: config.fallbackName, modelCount: 0 });
      continue;
    }

    let count = 0;
    for (const [modelKey, model] of Object.entries(rawProvider.models)) {
      models.push({
        id: `${providerId}/${modelKey}`,
        provider: providerId,
        modelId: modelKey,
        name: model.name || modelKey,
        attachment: !!model.attachment,
        reasoning: !!model.reasoning,
        tool_call: !!model.tool_call,
        modalities: {
          input: model.modalities?.input ?? ['text'],
          output: model.modalities?.output ?? ['text'],
        },
        limit: model.limit,
        cost: model.cost,
        release_date: model.release_date,
        knowledge: model.knowledge,
      });
      count++;
    }

    providers.push({
      id: providerId,
      name: rawProvider.name || config.fallbackName,
      modelCount: count,
    });
  }

  // Stable sort: newest first (release_date desc), then by name.
  models.sort((a, b) => {
    const ra = a.release_date ?? '';
    const rb = b.release_date ?? '';
    if (ra !== rb) return rb.localeCompare(ra);
    return a.name.localeCompare(b.name);
  });

  return { providers, models, generatedAt: Date.now() };
}
