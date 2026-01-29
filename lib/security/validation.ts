// Input validation schemas with Zod
// CRITICAL: Validate ALL user input to prevent injection attacks

import { z } from 'zod';

// ============================================
// COMMON VALIDATORS
// ============================================

// Safe string that strips dangerous characters
const safeString = z.string().transform((val) => val.trim());

// UUID validation
const uuid = z.string().uuid('Invalid ID format');

// Email validation
const email = z.string().email('Invalid email format').max(255).toLowerCase();

// Slug validation (lowercase alphanumeric with hyphens)
const slug = z
  .string()
  .min(2, 'Slug must be at least 2 characters')
  .max(100, 'Slug must be at most 100 characters')
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
    'Slug must be lowercase alphanumeric with hyphens, starting and ending with alphanumeric'
  );

// Content key validation (lowercase with underscores)
const contentKey = z
  .string()
  .min(1, 'Key is required')
  .max(100, 'Key must be at most 100 characters')
  .regex(
    /^[a-z][a-z0-9_]*$/,
    'Key must be lowercase alphanumeric with underscores, starting with a letter'
  );

// Phone number (flexible format)
const phone = z
  .string()
  .max(50)
  .regex(/^[\d\s\-\+\(\)\.]+$/, 'Invalid phone format')
  .optional()
  .nullable();

// URL validation
const url = z.string().url('Invalid URL format').max(500).optional().nullable();

// Replit URL validation
const replitUrl = z
  .string()
  .url('Invalid URL format')
  .max(500)
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.hostname.endsWith('.replit.app') ||
               parsed.hostname.endsWith('.replit.dev') ||
               parsed.hostname.endsWith('.repl.co');
      } catch {
        return false;
      }
    },
    'Must be a valid Replit URL'
  )
  .optional()
  .nullable();

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: email,
  password: z.string().min(1, 'Password is required'),
  user_type: z.enum(['admin', 'client']),
});

export const passwordChangeSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

export const passwordResetRequestSchema = z.object({
  email: email,
  user_type: z.enum(['admin', 'client']),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

// ============================================
// SITE SCHEMAS
// ============================================

export const createSiteSchema = z.object({
  name: safeString
    .pipe(z.string().min(2, 'Name must be at least 2 characters'))
    .pipe(z.string().max(255, 'Name must be at most 255 characters')),
  slug: slug,
  replit_url: replitUrl,
  custom_domain: z.string().max(255).optional().nullable(),
  client_id: uuid.optional().nullable(),
});

export const updateSiteSchema = z.object({
  name: safeString
    .pipe(z.string().min(2, 'Name must be at least 2 characters'))
    .pipe(z.string().max(255, 'Name must be at most 255 characters'))
    .optional(),
  slug: slug.optional(),
  replit_url: replitUrl,
  custom_domain: z.string().max(255).optional().nullable(),
  client_id: uuid.optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

// ============================================
// CLIENT SCHEMAS
// ============================================

export const createClientSchema = z.object({
  email: email,
  name: safeString
    .pipe(z.string().min(1, 'Name is required'))
    .pipe(z.string().max(255, 'Name must be at most 255 characters')),
  company: safeString.pipe(z.string().max(255)).optional().nullable(),
  phone: phone,
  password: z
    .string()
    .min(12)
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/
    )
    .optional(),
});

export const updateClientSchema = z.object({
  name: safeString
    .pipe(z.string().min(1, 'Name is required'))
    .pipe(z.string().max(255, 'Name must be at most 255 characters'))
    .optional(),
  company: safeString.pipe(z.string().max(255)).optional().nullable(),
  phone: phone,
  is_active: z.boolean().optional(),
});

// ============================================
// CONTENT SCHEMAS
// ============================================

export const createTextFieldSchema = z.object({
  content_key: contentKey,
  label: safeString
    .pipe(z.string().min(1, 'Label is required'))
    .pipe(z.string().max(255)),
  content: z.string().max(50000).optional().default(''),
  content_type: z.enum(['text', 'rich_text', 'html']).optional().default('text'),
  max_length: z.number().int().positive().optional().nullable(),
  placeholder: z.string().max(500).optional().nullable(),
  sort_order: z.number().int().min(0).optional().default(0),
});

export const updateTextFieldSchema = z.object({
  label: safeString
    .pipe(z.string().min(1))
    .pipe(z.string().max(255))
    .optional(),
  content: z.string().max(50000).optional(),
  content_type: z.enum(['text', 'rich_text', 'html']).optional(),
  max_length: z.number().int().positive().optional().nullable(),
  placeholder: z.string().max(500).optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
});

export const updateTextContentSchema = z.object({
  content: z.string().max(50000),
});

// ============================================
// BUSINESS INFO SCHEMAS
// ============================================

export const updateBusinessInfoSchema = z.object({
  business_name: safeString.pipe(z.string().max(255)).optional().nullable(),
  phone: phone,
  email: z.string().email().max(255).optional().nullable(),
  address_street: safeString.pipe(z.string().max(255)).optional().nullable(),
  address_city: safeString.pipe(z.string().max(100)).optional().nullable(),
  address_state: safeString.pipe(z.string().max(50)).optional().nullable(),
  address_zip: safeString.pipe(z.string().max(20)).optional().nullable(),
  address_country: safeString.pipe(z.string().max(100)).optional().nullable(),
  hours: z.record(z.string(), z.string().max(100)).optional(),
  social_links: z.record(z.string(), z.string().url().max(500)).optional(),
});

// ============================================
// COLLECTION SCHEMAS
// ============================================

const collectionFieldSchema = z.object({
  type: z.enum(['text', 'textarea', 'number', 'select', 'image', 'boolean']),
  label: z.string().min(1).max(255),
  required: z.boolean().optional(),
  max_length: z.number().int().positive().optional(),
  options: z.array(z.string().max(255)).optional(),
  placeholder: z.string().max(255).optional(),
});

export const createCollectionSchema = z.object({
  collection_key: contentKey,
  label: safeString
    .pipe(z.string().min(1))
    .pipe(z.string().max(255)),
  description: z.string().max(1000).optional().nullable(),
  item_schema: z.record(z.string(), collectionFieldSchema),
  can_add: z.boolean().optional().default(true),
  can_delete: z.boolean().optional().default(true),
  can_reorder: z.boolean().optional().default(true),
  max_items: z.number().int().positive().optional().nullable(),
  sort_order: z.number().int().min(0).optional().default(0),
});

export const updateCollectionSchema = z.object({
  label: safeString
    .pipe(z.string().min(1))
    .pipe(z.string().max(255))
    .optional(),
  description: z.string().max(1000).optional().nullable(),
  item_schema: z.record(z.string(), collectionFieldSchema).optional(),
  can_add: z.boolean().optional(),
  can_delete: z.boolean().optional(),
  can_reorder: z.boolean().optional(),
  max_items: z.number().int().positive().optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
});

export const createCollectionItemSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  sort_order: z.number().int().min(0).optional(),
  is_visible: z.boolean().optional().default(true),
});

export const updateCollectionItemSchema = z.object({
  data: z.record(z.string(), z.unknown()).optional(),
  sort_order: z.number().int().min(0).optional(),
  is_visible: z.boolean().optional(),
});

export const reorderCollectionItemsSchema = z.object({
  item_ids: z.array(uuid).min(1),
});

// ============================================
// IMAGE SCHEMAS
// ============================================

export const createImageSlotSchema = z.object({
  image_key: contentKey,
  label: safeString
    .pipe(z.string().min(1))
    .pipe(z.string().max(255)),
  description: z.string().max(1000).optional().nullable(),
  recommended_width: z.number().int().positive().optional().nullable(),
  recommended_height: z.number().int().positive().optional().nullable(),
  max_file_size_kb: z.number().int().positive().max(10240).optional().default(2048),
  sort_order: z.number().int().min(0).optional().default(0),
});

export const updateImageSlotSchema = z.object({
  label: safeString
    .pipe(z.string().min(1))
    .pipe(z.string().max(255))
    .optional(),
  description: z.string().max(1000).optional().nullable(),
  url: url,
  alt_text: z.string().max(255).optional().nullable(),
  recommended_width: z.number().int().positive().optional().nullable(),
  recommended_height: z.number().int().positive().optional().nullable(),
  max_file_size_kb: z.number().int().positive().max(10240).optional(),
  sort_order: z.number().int().min(0).optional(),
});

// ============================================
// PERMISSIONS SCHEMAS
// ============================================

export const updatePermissionsSchema = z.object({
  can_edit_business_info: z.boolean().optional(),
  can_edit_text: z.boolean().optional(),
  can_edit_images: z.boolean().optional(),
  can_edit_collections: z.boolean().optional(),
  can_add_collection_items: z.boolean().optional(),
  can_delete_collection_items: z.boolean().optional(),
  can_reorder_collection_items: z.boolean().optional(),
  can_publish: z.boolean().optional(),
});

// ============================================
// PUBLISH SCHEMA
// ============================================

export const publishSchema = z.object({
  notes: z.string().max(1000).optional(),
});

// ============================================
// QUERY PARAM SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const activityLogFilterSchema = z.object({
  site_id: uuid.optional(),
  user_id: uuid.optional(),
  user_type: z.enum(['admin', 'client']).optional(),
  action: z.string().max(100).optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
});

export const securityLogFilterSchema = z.object({
  event_type: z.string().max(50).optional(),
  user_id: uuid.optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  ip_address: z.string().max(45).optional(),
});

// ============================================
// VALIDATION HELPER
// ============================================

/**
 * Validate input against a schema, throwing ValidationError on failure
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    // Get the first error message
    const firstError = result.error.errors[0];
    const message = firstError
      ? `${firstError.path.join('.')}: ${firstError.message}`.replace(/^:\s*/, '')
      : 'Invalid input';

    throw new Error(message);
  }

  return result.data;
}

// Re-export z for convenience
export { z };
