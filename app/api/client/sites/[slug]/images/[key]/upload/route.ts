// POST /api/client/sites/[slug]/images/[key]/upload - Upload image

import { NextRequest } from 'next/server';
import { verifyClientSiteAccess } from '@/lib/auth/middleware';
import { getAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/security/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError, ForbiddenError, ValidationError } from '@/lib/utils/errors';
import { getSitePermissions } from '@/lib/db/sites';
import { getImageByKey, updateImageContent } from '@/lib/db/content';
import { logActivity } from '@/lib/db/activity';

// Allowed MIME types and their extensions
const ALLOWED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string }> }
) {
  try {
    const { slug, key } = await params;

    // Verify client authentication and site access
    const { user, siteId } = await verifyClientSiteAccess(request, slug);

    // Rate limiting for uploads (stricter, per user)
    const rateLimitResult = await rateLimit('upload', user.id);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Check permissions
    const permissions = await getSitePermissions(siteId);
    if (!permissions.can_edit_images) {
      throw new ForbiddenError('You do not have permission to upload images');
    }

    // Get image slot info
    const imageSlot = await getImageByKey(siteId, key);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const altText = formData.get('alt_text') as string | null;

    if (!file) {
      throw new ValidationError('No file provided');
    }

    // Validate file type
    if (!ALLOWED_TYPES[file.type]) {
      throw new ValidationError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
    }

    // Validate file size
    const maxSizeBytes = (imageSlot.max_file_size_kb || 2048) * 1024;
    if (file.size > maxSizeBytes) {
      throw new ValidationError(`File too large. Maximum size: ${imageSlot.max_file_size_kb || 2048}KB`);
    }

    // Validate extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_TYPES[file.type]?.includes(extension)) {
      throw new ValidationError('File extension does not match file type');
    }

    // Generate safe filename
    const timestamp = Date.now();
    const random = crypto.randomUUID().slice(0, 8);
    const safeFilename = `${siteId}/${key}/${timestamp}-${random}.${extension}`;

    // Upload to Supabase Storage
    const supabase = getAdminClient();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(safeFilename, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload image');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(uploadData.path);

    const publicUrl = urlData.publicUrl;

    // Delete old image if exists
    if (imageSlot.url) {
      try {
        const oldPath = imageSlot.url.split('/images/')[1];
        if (oldPath) {
          await supabase.storage.from('images').remove([oldPath]);
        }
      } catch {
        // Ignore errors deleting old file
      }
    }

    // Update image record
    const updatedImage = await updateImageContent(
      siteId,
      key,
      publicUrl,
      altText || undefined
    );

    // Log activity
    await logActivity({
      siteId,
      userId: user.id,
      userType: user.type,
      action: 'upload_image',
      entityType: 'image',
      entityId: updatedImage.id,
      changes: {
        url: { old: imageSlot.url, new: publicUrl },
        ...(altText && { alt_text: { old: imageSlot.alt_text, new: altText } }),
      },
      request,
    });

    return successResponse({
      ...updatedImage,
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    return errorResponse(error, request);
  }
}
