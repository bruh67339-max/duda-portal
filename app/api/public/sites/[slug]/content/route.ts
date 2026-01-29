// GET /api/public/sites/[slug]/content - Public content API for Replit sites
// CRITICAL: This is the main API endpoint that Replit websites consume

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIp, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { logSecurityEvent, getRequestContext } from '@/lib/security/logging';
import { errorResponse } from '@/lib/utils/response';
import { UnauthorizedError, NotFoundError, RateLimitError, ValidationError } from '@/lib/utils/errors';
import type { PublicSiteContent } from '@/lib/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now();
  const context = getRequestContext(request);
  const ip = getClientIp(request);
  const { slug } = await params;

  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimit('public', ip);
    if (!rateLimitResult.success) {
      await logSecurityEvent({
        event_type: 'rate_limit_exceeded',
        ...context,
        details: { slug },
        severity: 'warning',
      });
      throw new RateLimitError();
    }

    // 2. Validate API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      throw new UnauthorizedError('API key required');
    }

    // 3. Validate slug format
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) || slug.length < 2) {
      throw new ValidationError('Invalid site identifier');
    }

    const supabase = getAdminClient();

    // 4. Verify API key and get site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name, slug, status')
      .eq('slug', slug)
      .eq('api_key', apiKey)
      .single();

    if (siteError || !site) {
      await logSecurityEvent({
        event_type: 'invalid_api_key',
        ...context,
        details: { slug },
        severity: 'warning',
      });
      // Don't reveal whether site exists - always return same error
      throw new NotFoundError('Site not found or invalid API key');
    }

    // 5. Check if site is published
    if (site.status !== 'published') {
      throw new NotFoundError('Site not found or invalid API key');
    }

    // 6. Fetch all content in parallel
    const [businessInfo, textContent, collections, images] = await Promise.all([
      supabase
        .from('business_info')
        .select('*')
        .eq('site_id', site.id)
        .single(),
      supabase
        .from('text_content')
        .select('content_key, content')
        .eq('site_id', site.id)
        .order('sort_order'),
      supabase
        .from('collections')
        .select(`
          collection_key,
          collection_items (
            id, data, sort_order, is_visible
          )
        `)
        .eq('site_id', site.id)
        .order('sort_order'),
      supabase
        .from('images')
        .select('image_key, url, alt_text')
        .eq('site_id', site.id),
    ]);

    // 7. Format response
    const response: PublicSiteContent = {
      site: {
        name: site.name,
        slug: site.slug,
      },
      business: businessInfo.data
        ? {
            business_name: businessInfo.data.business_name,
            phone: businessInfo.data.phone,
            email: businessInfo.data.email,
            address: {
              street: businessInfo.data.address_street,
              city: businessInfo.data.address_city,
              state: businessInfo.data.address_state,
              zip: businessInfo.data.address_zip,
              country: businessInfo.data.address_country,
            },
            hours: businessInfo.data.hours || {},
            social: businessInfo.data.social_links || {},
            logo_url: businessInfo.data.logo_url,
          }
        : null,
      text: Object.fromEntries(
        (textContent.data || []).map((t) => [t.content_key, t.content])
      ),
      collections: Object.fromEntries(
        (collections.data || []).map((c) => [
          c.collection_key,
          ((c.collection_items as Array<{ id: string; data: Record<string, unknown>; sort_order: number; is_visible: boolean }>) || [])
            .filter((item) => item.is_visible)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((item) => ({ id: item.id, ...item.data })),
        ])
      ),
      images: Object.fromEntries(
        (images.data || []).map((i) => [
          i.image_key,
          { url: i.url, alt: i.alt_text },
        ])
      ),
    };

    // 8. Return with cache headers and rate limit info
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Response-Time': `${Date.now() - startTime}ms`,
        ...getRateLimitHeaders(rateLimitResult),
      },
    });
  } catch (error) {
    return errorResponse(error, request);
  }
}

// Support OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      'Access-Control-Max-Age': '86400',
    },
  });
}
