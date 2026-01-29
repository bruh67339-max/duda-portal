// Input sanitization utilities
// CRITICAL: Prevent XSS and injection attacks
// Uses lightweight regex-based sanitization (no JSDOM dependency)

// Allowed HTML tags for rich text content
const RICH_TEXT_TAGS = ['b', 'i', 'u', 'br', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'span'];
const RICH_TEXT_ATTRS = ['href', 'target', 'rel'];

// More restrictive tags for basic formatting
const BASIC_TAGS = ['b', 'i', 'u', 'br', 'strong', 'em'];

// Dangerous patterns to always remove
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /<iframe\b[^>]*>.*?<\/iframe>/gi,
  /<object\b[^>]*>.*?<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /<form\b[^>]*>.*?<\/form>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick=, onerror=, etc.
];

/**
 * Escape HTML entities
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Check if a tag is allowed
 */
function isTagAllowed(tag: string, allowedTags: string[]): boolean {
  return allowedTags.includes(tag.toLowerCase());
}

/**
 * Sanitize attributes, keeping only allowed ones
 */
function sanitizeAttributes(attrs: string, allowedAttrs: string[]): string {
  if (!attrs || allowedAttrs.length === 0) return '';

  const result: string[] = [];
  // Match attribute patterns: name="value" or name='value' or name=value
  const attrRegex = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let match;

  while ((match = attrRegex.exec(attrs)) !== null) {
    const attrName = match[1].toLowerCase();
    const attrValue = match[2] || match[3] || match[4] || '';

    if (allowedAttrs.includes(attrName)) {
      // Extra validation for href to prevent javascript: URLs
      if (attrName === 'href') {
        const lowerValue = attrValue.toLowerCase().trim();
        if (lowerValue.startsWith('javascript:') ||
            lowerValue.startsWith('vbscript:') ||
            lowerValue.startsWith('data:')) {
          continue;
        }
      }
      result.push(`${attrName}="${escapeHtml(attrValue)}"`);
    }
  }

  // For links, always add safe defaults
  if (result.some(attr => attr.startsWith('href='))) {
    if (!result.some(attr => attr.startsWith('target='))) {
      result.push('target="_blank"');
    }
    if (!result.some(attr => attr.startsWith('rel='))) {
      result.push('rel="noopener noreferrer"');
    }
  }

  return result.length > 0 ? ' ' + result.join(' ') : '';
}

/**
 * Sanitize HTML content, allowing only safe tags
 */
export function sanitizeHtml(
  dirty: string,
  options: { allowLinks?: boolean } = {}
): string {
  if (!dirty || typeof dirty !== 'string') return '';

  const allowedTags = options.allowLinks ? RICH_TEXT_TAGS : BASIC_TAGS;
  const allowedAttrs = options.allowLinks ? RICH_TEXT_ATTRS : [];

  let html = dirty;

  // Remove dangerous patterns first
  for (const pattern of DANGEROUS_PATTERNS) {
    html = html.replace(pattern, '');
  }

  // Process HTML tags
  // Match opening tags with attributes: <tag attrs>
  // Match closing tags: </tag>
  // Match self-closing tags: <tag />
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)\/?\s*>/g;

  html = html.replace(tagRegex, (match, tagName, attrs) => {
    const tag = tagName.toLowerCase();
    const isClosing = match.startsWith('</');

    if (!isTagAllowed(tag, allowedTags)) {
      return ''; // Remove disallowed tags entirely
    }

    if (isClosing) {
      return `</${tag}>`;
    }

    // Self-closing tags like <br>
    if (['br', 'hr', 'img'].includes(tag)) {
      return `<${tag}${sanitizeAttributes(attrs, allowedAttrs)} />`;
    }

    return `<${tag}${sanitizeAttributes(attrs, allowedAttrs)}>`;
  });

  return html.trim();
}

/**
 * Sanitize plain text by removing all HTML and dangerous characters
 */
export function sanitizeText(text: string, maxLength?: number): string {
  if (!text || typeof text !== 'string') return '';

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
  if (!filename || typeof filename !== 'string') return 'file';

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
  if (!value || typeof value !== 'string') return '';

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
  if (!content || typeof content !== 'string') return '';

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
  if (!obj || typeof obj !== 'object') return obj;

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
