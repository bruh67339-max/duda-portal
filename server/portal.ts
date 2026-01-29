/**
 * Server-side Portal Content Fetching
 *
 * This module provides server-side content fetching for SSR or API routes.
 * Use this when you need to:
 * - Prefetch content for SSR/hydration
 * - Create an API proxy to hide API keys from the client
 * - Cache content on the server
 */

// Types (duplicated here to avoid import issues between client/server)
export interface SiteContent {
  site: {
    name: string;
    slug: string;
  };
  business: BusinessInfo | null;
  text: Record<string, string>;
  collections: Record<string, CollectionItem[]>;
  images: Record<string, ImageData>;
}

export interface BusinessInfo {
  business_name: string | null;
  phone: string | null;
  email: string | null;
  address: Address | null;
  hours: Record<string, string> | null;
  social: Record<string, string> | null;
  logo_url: string | null;
}

export interface Address {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
}

export interface CollectionItem {
  id: string;
  [key: string]: unknown;
}

export interface ImageData {
  url: string | null;
  alt: string | null;
}

// Configuration from environment variables
function getConfig() {
  const apiUrl = process.env.PORTAL_API_URL;
  const siteSlug = process.env.SITE_SLUG;
  const apiKey = process.env.PORTAL_API_KEY;

  if (!apiUrl || !siteSlug || !apiKey) {
    const missing: string[] = [];
    if (!apiUrl) missing.push('PORTAL_API_URL');
    if (!siteSlug) missing.push('SITE_SLUG');
    if (!apiKey) missing.push('PORTAL_API_KEY');
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  return { apiUrl, siteSlug, apiKey };
}

// Simple in-memory cache
interface CacheEntry {
  data: SiteContent;
  timestamp: number;
}

const cache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches site content from the portal API.
 * Includes simple in-memory caching with TTL.
 *
 * @param options.bypassCache - Skip cache and fetch fresh content
 * @returns Promise<SiteContent>
 *
 * @example
 * // In an Express route
 * app.get('/api/content', async (req, res) => {
 *   const content = await fetchPortalContentServer();
 *   res.json(content);
 * });
 *
 * @example
 * // Bypass cache for fresh content
 * const content = await fetchPortalContentServer({ bypassCache: true });
 */
export async function fetchPortalContentServer(
  options: { bypassCache?: boolean } = {}
): Promise<SiteContent> {
  const { apiUrl, siteSlug, apiKey } = getConfig();
  const cacheKey = `${apiUrl}:${siteSlug}`;

  // Check cache first (unless bypassing)
  if (!options.bypassCache) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  // Fetch from API
  const response = await fetch(
    `${apiUrl}/api/public/sites/${siteSlug}/content`,
    {
      headers: {
        'x-api-key': apiKey,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API key');
    }
    if (response.status === 404) {
      throw new Error('Site not found');
    }
    throw new Error(`Failed to fetch content: ${response.status}`);
  }

  const data: SiteContent = await response.json();

  // Update cache
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
}

/**
 * Clears the content cache.
 * Useful when content is updated and you need to force a refresh.
 *
 * @example
 * // Clear cache after receiving a webhook that content was updated
 * app.post('/webhooks/content-updated', (req, res) => {
 *   clearPortalCache();
 *   res.sendStatus(200);
 * });
 */
export function clearPortalCache(): void {
  cache.clear();
}

/**
 * Gets specific text content from the portal.
 * Convenience function for server-side rendering.
 *
 * @example
 * const headline = await getTextContent('hero_headline', 'Welcome');
 */
export async function getTextContent(
  key: string,
  fallback: string = ''
): Promise<string> {
  const content = await fetchPortalContentServer();
  return content.text[key] ?? fallback;
}

/**
 * Gets a collection from the portal.
 * Convenience function for server-side rendering.
 *
 * @example
 * const menuItems = await getCollection<MenuItem>('menu_items');
 */
export async function getCollection<T extends CollectionItem>(
  key: string
): Promise<T[]> {
  const content = await fetchPortalContentServer();
  return (content.collections[key] ?? []) as T[];
}

/**
 * Express middleware to inject content into res.locals.
 * Makes content available to all routes.
 *
 * @example
 * import { portalContentMiddleware } from './portal';
 *
 * app.use(portalContentMiddleware);
 *
 * app.get('/', (req, res) => {
 *   const { content } = res.locals;
 *   res.render('home', { content });
 * });
 */
export async function portalContentMiddleware(
  req: any,
  res: any,
  next: () => void
): Promise<void> {
  try {
    res.locals.portalContent = await fetchPortalContentServer();
    next();
  } catch (error) {
    console.error('Failed to fetch portal content:', error);
    res.locals.portalContent = null;
    next();
  }
}

/**
 * Creates an Express router with content API endpoints.
 * Useful for proxying content to the client without exposing API keys.
 *
 * @example
 * import { createPortalRouter } from './portal';
 * import express from 'express';
 *
 * const app = express();
 * app.use('/api/portal', createPortalRouter());
 */
export function createPortalRouter() {
  // Note: This returns a function that can be used with Express Router
  // We're avoiding importing express directly to keep this file framework-agnostic

  return {
    // Handler for GET /content
    getContent: async (req: any, res: any) => {
      try {
        const content = await fetchPortalContentServer();
        res.json(content);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
      }
    },

    // Handler for POST /refresh (clear cache and return fresh content)
    refreshContent: async (req: any, res: any) => {
      try {
        clearPortalCache();
        const content = await fetchPortalContentServer();
        res.json(content);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
      }
    },
  };
}
