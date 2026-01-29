// POST /api/auth/logout - Logout and revoke tokens

import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { revokeAllUserTokens } from '@/lib/auth/session';
import { logSecurityEvent, getRequestContext } from '@/lib/security/logging';
import { messageResponse, errorResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);

  try {
    // Verify authentication
    const { user, supabase } = await verifyAuth(request);

    // Revoke all refresh tokens for this user
    await revokeAllUserTokens(user.id, user.type);

    // Sign out from Supabase Auth
    await supabase.auth.signOut();

    // Log logout event
    await logSecurityEvent({
      event_type: 'logout',
      user_id: user.id,
      user_type: user.type,
      ...context,
    });

    return messageResponse('Logged out successfully');
  } catch (error) {
    return errorResponse(error, request);
  }
}
