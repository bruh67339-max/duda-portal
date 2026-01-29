// GET /api/admin/clients/[id] - Get client details
// PUT /api/admin/clients/[id] - Update client
// DELETE /api/admin/clients/[id] - Deactivate client

import { NextRequest } from 'next/server';
import { verifyAdmin } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { logAdminAction } from '@/lib/security/logging';
import { validateInput, updateClientSchema } from '@/lib/security/validation';
import { successResponse, messageResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError } from '@/lib/utils/errors';
import { getClientById, getClientWithSiteCount, updateClient, deactivateClient } from '@/lib/db/clients';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin authentication
    await verifyAdmin(request);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Get client with site count
    const client = await getClientWithSiteCount(id);

    return successResponse(client);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin authentication
    const { user } = await verifyAdmin(request);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Get current client for comparison
    const currentClient = await getClientById(id);

    // Parse and validate input
    const body = await request.json();
    const input = validateInput(updateClientSchema, body);

    // Update client
    const updatedClient = await updateClient(id, input);

    // Log admin action with changes
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined && currentClient[key as keyof typeof currentClient] !== value) {
        changes[key] = {
          old: currentClient[key as keyof typeof currentClient],
          new: value,
        };
      }
    }

    await logAdminAction(
      user.id,
      'update_client',
      { client_id: id, changes },
      request
    );

    return successResponse(updatedClient);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin authentication
    const { user } = await verifyAdmin(request);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Get client for logging
    const client = await getClientById(id);

    // Deactivate client (soft delete)
    await deactivateClient(id);

    // Log admin action
    await logAdminAction(
      user.id,
      'deactivate_client',
      { client_id: id, client_email: client.email },
      request
    );

    return messageResponse('Client deactivated successfully');
  } catch (error) {
    return errorResponse(error, request);
  }
}
