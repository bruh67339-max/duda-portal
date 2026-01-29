// GET /api/admin/clients - List all clients
// POST /api/admin/clients - Create a new client

import { NextRequest } from 'next/server';
import { verifyAdmin } from '@/lib/auth/middleware';
import { getAdminClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { logAdminAction } from '@/lib/security/logging';
import { validateInput, createClientSchema } from '@/lib/security/validation';
import { validatePassword, generateSecurePassword } from '@/lib/auth/password';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError, ValidationError } from '@/lib/utils/errors';
import { getAllClients, createClient } from '@/lib/db/clients';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdmin(request);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Get all clients
    const clients = await getAllClients();

    return successResponse(clients);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const { user } = await verifyAdmin(request);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Parse and validate input
    const body = await request.json();
    const input = validateInput(createClientSchema, body);

    // Generate password if not provided
    const password = input.password || generateSecurePassword();

    // Validate password if provided
    if (input.password) {
      const passwordValidation = validatePassword(input.password, input.email);
      if (!passwordValidation.valid) {
        throw new ValidationError(passwordValidation.errors.join('. '));
      }
    }

    // Create user in Supabase Auth
    const supabase = getAdminClient();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: input.email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        throw new ValidationError('A user with this email already exists');
      }
      throw new Error('Failed to create user account');
    }

    // Create client record
    const client = await createClient(
      {
        email: input.email,
        name: input.name,
        company: input.company,
        phone: input.phone,
      },
      authData.user.id
    );

    // Log admin action
    await logAdminAction(
      user.id,
      'create_client',
      { client_id: client.id, client_email: client.email },
      request
    );

    // In development, log the password
    if (process.env.NODE_ENV !== 'production' && !input.password) {
      console.log(`
========================================
NEW CLIENT CREATED (DEV MODE)
========================================
Email: ${input.email}
Generated Password: ${password}
========================================
      `);
    }

    return successResponse(
      {
        ...client,
        // Only include password in response if it was generated
        ...(input.password ? {} : { generated_password: password }),
      },
      201
    );
  } catch (error) {
    return errorResponse(error, request);
  }
}
