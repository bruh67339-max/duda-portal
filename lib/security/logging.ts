// Security event logging
// CRITICAL: Log all security-relevant events for audit trail

import { getAdminClient } from '@/lib/supabase/admin';

export type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'token_refresh'
  | 'token_revoked'
  | 'permission_denied'
  | 'rate_limit_exceeded'
  | 'invalid_token'
  | 'invalid_api_key'
  | 'suspicious_activity'
  | 'admin_action'
  | 'account_locked'
  | 'account_unlocked';

export type SecuritySeverity = 'info' | 'warning' | 'critical';

export interface SecurityLogEvent {
  event_type: SecurityEventType;
  user_id?: string;
  user_type?: 'admin' | 'client';
  ip_address?: string;
  user_agent?: string;
  endpoint?: string;
  details?: Record<string, unknown>;
  severity?: SecuritySeverity;
}

// Determine severity based on event type
function getDefaultSeverity(eventType: SecurityEventType): SecuritySeverity {
  switch (eventType) {
    case 'login_failure':
    case 'invalid_token':
    case 'invalid_api_key':
    case 'permission_denied':
      return 'warning';
    case 'rate_limit_exceeded':
    case 'suspicious_activity':
    case 'account_locked':
      return 'critical';
    default:
      return 'info';
  }
}

/**
 * Log a security event to the database
 * Uses service role client to bypass RLS
 */
export async function logSecurityEvent(
  event: SecurityLogEvent
): Promise<void> {
  try {
    const supabase = getAdminClient();

    const logEntry = {
      event_type: event.event_type,
      user_id: event.user_id || null,
      user_type: event.user_type || null,
      ip_address: event.ip_address || null,
      user_agent: event.user_agent
        ? event.user_agent.slice(0, 500) // Truncate long user agents
        : null,
      endpoint: event.endpoint || null,
      details: event.details || null,
      severity: event.severity || getDefaultSeverity(event.event_type),
    };

    const { error } = await supabase.from('security_logs').insert(logEntry);

    if (error) {
      // Don't throw - logging failures shouldn't break the application
      console.error('Failed to log security event:', error);
    }

    // For critical events, also log to console for immediate visibility
    if (logEntry.severity === 'critical') {
      console.warn('CRITICAL SECURITY EVENT:', {
        type: event.event_type,
        user_id: event.user_id,
        ip: event.ip_address,
        endpoint: event.endpoint,
      });
    }
  } catch (error) {
    // Never let logging failures propagate
    console.error('Security logging error:', error);
  }
}

/**
 * Extract logging context from a request
 */
export function getRequestContext(request: Request): {
  ip_address: string;
  user_agent: string;
  endpoint: string;
} {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip_address = forwardedFor
    ? forwardedFor.split(',')[0]?.trim() || 'unknown'
    : request.headers.get('x-real-ip') || 'unknown';

  return {
    ip_address,
    user_agent: request.headers.get('user-agent') || 'unknown',
    endpoint: new URL(request.url).pathname,
  };
}

/**
 * Log an admin action
 */
export async function logAdminAction(
  userId: string,
  action: string,
  details: Record<string, unknown>,
  request: Request
): Promise<void> {
  const context = getRequestContext(request);

  await logSecurityEvent({
    event_type: 'admin_action',
    user_id: userId,
    user_type: 'admin',
    ...context,
    details: {
      action,
      ...details,
    },
  });
}
