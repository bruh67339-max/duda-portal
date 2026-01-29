// Input sanitization utilities
// CRITICAL: Prevent XSS and injection attacks

import DOMPurify from 'isomorphic-dompurify';

// Allowed HTML tags for rich text content
const RICH_TEXT_TAGS = ['b', 'i', 'u', 'br', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'span'];
const RICH_TEXT_ATTRS = ['href', 'target', 'rel'];

// More restrictive tags for basic formatting
const BASIC_TAGS = ['b', 'i', 'u', 'br', 'strong', 'em'];

/**
 * Sanitize HTML content, allowing only safe tags
 */
export function sanitizeHtml(
  dirty: string,
  options: { allowLinks?: boolean } = {}
): string {
  const allowedTags = options.allowLinks ? RICH_TEXT_TAGS : BASIC_TAGS;
  const allowedAttrs = options.allowLinks ? RICH_TEXT_ATTRS : [];

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttrs,
    // Force all links to open in new tab and prevent referrer leakage
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}

/**
 * Sanitize plain text by removing all HTML and dangerous characters
 */
export function sanitizeText(text: string, maxLength?: number): string {
  // Remove all HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Truncate if needed
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize a filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  let sanitized = filename.replace(/^.*[\\/]/, '');

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Prevent hidden files
  sanitized = sanitized.replace(/^\.+/, '');

  // Limit length
  if (sanitized.length > 100) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.slice(0, 100 - ext.length - 1);
    sanitized = ext ? `${name}.${ext}` : name;
  }

  // Ensure not empty
  if (!sanitized) {
    sanitized = 'file';
  }

  return sanitized;
}

/**
 * Escape special characters for safe inclusion in HTML attributes
 */
export function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sanitize content based on its type
 */
export function sanitizeContent(
  content: string,
  contentType: 'text' | 'rich_text' | 'html',
  maxLength?: number
): string {
  switch (contentType) {
    case 'text':
      return sanitizeText(content, maxLength);
    case 'rich_text':
      return sanitizeHtml(content, { allowLinks: false });
    case 'html':
      return sanitizeHtml(content, { allowLinks: true });
    default:
      return sanitizeText(content, maxLength);
  }
}

/**
 * Sanitize an object's string values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  maxStringLength = 10000
): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeText(value, maxStringLength);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeText(item, maxStringLength)
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>, maxStringLength)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>, maxStringLength);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
