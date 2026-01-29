// GET /api/client/sites/[slug]/content - Get all editable content for a site

import { NextRequest } from 'next/server';
import { verifyClientSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError } from '@/lib/utils/errors';
import { getSiteBySlug, getSitePermissions } from '@/lib/db/sites';
import { getBusinessInfo, getTextContent, getImages } from '@/lib/db/content';
import { getCollections, getCollectionItems } from '@/lib/db/collections';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Verify client authentication and site access
    const { user, siteId } = await verifyClientSiteAccess(request, slug);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('client', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Fetch all content in parallel
    const [site, permissions, businessInfo, textContent, collections, images] = await Promise.all([
      getSiteBySlug(slug),
      getSitePermissions(siteId, user.id),
      getBusinessInfo(siteId),
      getTextContent(siteId),
      getCollections(siteId),
      getImages(siteId),
    ]);

    // Fetch items for each collection
    const collectionsWithItems = await Promise.all(
      collections.map(async (collection) => {
        const items = await getCollectionItems(collection.id);
        return {
          ...collection,
          items,
        };
      })
    );

    return successResponse({
      site: {
        id: site.id,
        name: site.name,
        slug: site.slug,
        status: site.status,
      },
      permissions,
      business_info: businessInfo,
      text_content: textContent,
      collections: collectionsWithItems,
      images,
    });
  } catch (error) {
    return errorResponse(error, request);
  }
}
