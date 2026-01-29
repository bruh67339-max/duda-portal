/**
 * Portal Content Types and Fetch Utilities
 *
 * This module provides TypeScript types matching the portal API response
 * and a fetch function to retrieve site content.
 */

// Types matching the API response
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

/**
 * Error thrown when portal configuration is missing
 */
export class PortalConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortalConfigError';
  }
}

/**
 * Error thrown when API returns an error response
 */
export class PortalApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'PortalApiError';
    this.status = status;
  }
}

/**
 * Fetches site content from the portal API.
 *
 * Requires the following environment variables:
 * - VITE_PORTAL_API_URL: Base URL of the portal API
 * - VITE_SITE_SLUG: The site's slug identifier
 * - VITE_PORTAL_API_KEY: API key for authentication
 *
 * @returns Promise<SiteContent> The site content from the portal
 * @throws PortalConfigError if environment variables are missing
 * @throws PortalApiError if the API returns an error response
 */
export async function fetchPortalContent(): Promise<SiteContent> {
  const apiUrl = import.meta.env.VITE_PORTAL_API_URL;
  const siteSlug = import.meta.env.VITE_SITE_SLUG;
  const apiKey = import.meta.env.VITE_PORTAL_API_KEY;

  if (!apiUrl || !siteSlug || !apiKey) {
    const missing: string[] = [];
    if (!apiUrl) missing.push('VITE_PORTAL_API_URL');
    if (!siteSlug) missing.push('VITE_SITE_SLUG');
    if (!apiKey) missing.push('VITE_PORTAL_API_KEY');
    throw new PortalConfigError(
      `Portal configuration missing: ${missing.join(', ')}. Check environment variables.`
    );
  }

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
      throw new PortalApiError('Invalid API key', 401);
    }
    if (response.status === 404) {
      throw new PortalApiError('Site not found', 404);
    }
    throw new PortalApiError(
      `Failed to fetch content: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}

/**
 * Get the configured portal API URL (for debugging/display purposes)
 */
export function getPortalConfig() {
  return {
    apiUrl: import.meta.env.VITE_PORTAL_API_URL || '',
    siteSlug: import.meta.env.VITE_SITE_SLUG || '',
    hasApiKey: !!import.meta.env.VITE_PORTAL_API_KEY,
  };
}
