import { useContent } from './content-provider';
import { cn } from '@/lib/utils';
import type { BusinessInfo as BusinessInfoType, Address } from '@/lib/portal-content';

/**
 * Hook to access business information from the portal.
 *
 * @example
 * function ContactSection() {
 *   const business = useBusinessInfo();
 *   if (!business) return null;
 *
 *   return (
 *     <div>
 *       <h2>{business.business_name}</h2>
 *       <p>{business.phone}</p>
 *     </div>
 *   );
 * }
 */
export function useBusinessInfo(): BusinessInfoType | null {
  const { content } = useContent();
  return content.business;
}

// ============================================================================
// Individual Business Info Components
// ============================================================================

interface ComponentProps {
  className?: string;
}

/**
 * Displays the business name.
 *
 * @example
 * <BusinessName className="text-2xl font-bold" />
 */
export function BusinessName({ className }: ComponentProps) {
  const business = useBusinessInfo();
  if (!business?.business_name) return null;
  return <span className={className}>{business.business_name}</span>;
}

/**
 * Displays the business phone number with optional link.
 *
 * @example
 * <BusinessPhone className="text-lg" asLink />
 */
export function BusinessPhone({
  className,
  asLink = false,
}: ComponentProps & { asLink?: boolean }) {
  const business = useBusinessInfo();
  if (!business?.phone) return null;

  if (asLink) {
    return (
      <a
        href={`tel:${business.phone.replace(/\D/g, '')}`}
        className={cn('hover:underline', className)}
      >
        {business.phone}
      </a>
    );
  }

  return <span className={className}>{business.phone}</span>;
}

/**
 * Displays the business email with optional mailto link.
 *
 * @example
 * <BusinessEmail className="text-blue-600" asLink />
 */
export function BusinessEmail({
  className,
  asLink = true,
}: ComponentProps & { asLink?: boolean }) {
  const business = useBusinessInfo();
  if (!business?.email) return null;

  if (asLink) {
    return (
      <a href={`mailto:${business.email}`} className={cn('hover:underline', className)}>
        {business.email}
      </a>
    );
  }

  return <span className={className}>{business.email}</span>;
}

/**
 * Displays the business address.
 *
 * @example
 * // Single line
 * <BusinessAddress className="text-sm" />
 *
 * @example
 * // Multi-line format
 * <BusinessAddress multiLine className="text-sm leading-relaxed" />
 */
export function BusinessAddress({
  className,
  multiLine = false,
}: ComponentProps & { multiLine?: boolean }) {
  const business = useBusinessInfo();
  if (!business?.address) return null;

  const { street, city, state, zip, country } = business.address;

  if (multiLine) {
    return (
      <address className={cn('not-italic', className)}>
        {street && <div>{street}</div>}
        {(city || state || zip) && (
          <div>
            {city}
            {city && state && ', '}
            {state} {zip}
          </div>
        )}
        {country && <div>{country}</div>}
      </address>
    );
  }

  const parts = [street, city, state, zip].filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <address className={cn('not-italic', className)}>{parts.join(', ')}</address>
  );
}

/**
 * Displays business hours in a formatted list.
 *
 * @example
 * <BusinessHours className="text-sm space-y-1" />
 */
export function BusinessHours({ className }: ComponentProps) {
  const business = useBusinessInfo();
  if (!business?.hours || Object.keys(business.hours).length === 0) return null;

  // Order days of the week properly
  const dayOrder = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  const sortedHours = Object.entries(business.hours).sort(([a], [b]) => {
    const aIndex = dayOrder.indexOf(a.toLowerCase());
    const bIndex = dayOrder.indexOf(b.toLowerCase());
    return aIndex - bIndex;
  });

  return (
    <div className={cn('space-y-1', className)}>
      {sortedHours.map(([day, hours]) => (
        <div key={day} className="flex justify-between gap-4">
          <span className="capitalize font-medium">{day}</span>
          <span>{hours}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Displays social media links.
 *
 * @example
 * <SocialLinks className="flex gap-4" />
 */
export function SocialLinks({
  className,
  iconSize = 20,
  showLabels = false,
}: ComponentProps & { iconSize?: number; showLabels?: boolean }) {
  const business = useBusinessInfo();
  if (!business?.social || Object.keys(business.social).length === 0) return null;

  return (
    <div className={cn('flex gap-4', className)}>
      {Object.entries(business.social).map(([platform, url]) => (
        <a
          key={platform}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
          aria-label={`Visit our ${platform} page`}
        >
          <SocialIcon platform={platform} size={iconSize} />
          {showLabels && <span className="ml-2 capitalize">{platform}</span>}
        </a>
      ))}
    </div>
  );
}

/**
 * Simple social media icon component.
 * Uses basic SVG icons for common platforms.
 */
function SocialIcon({ platform, size = 20 }: { platform: string; size?: number }) {
  const iconProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true,
  };

  switch (platform.toLowerCase()) {
    case 'facebook':
      return (
        <svg {...iconProps}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg {...iconProps}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    case 'twitter':
    case 'x':
      return (
        <svg {...iconProps}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg {...iconProps}>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...iconProps}>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg {...iconProps}>
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
    default:
      // Generic link icon for unknown platforms
      return (
        <svg {...iconProps}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
  }
}

// ============================================================================
// Combined Components
// ============================================================================

/**
 * Displays complete business contact information.
 *
 * @example
 * <BusinessContactCard className="bg-white p-6 rounded-lg shadow" />
 */
export function BusinessContactCard({ className }: ComponentProps) {
  const business = useBusinessInfo();
  if (!business) return null;

  return (
    <div className={cn('space-y-4', className)}>
      {business.business_name && (
        <h3 className="text-xl font-bold">{business.business_name}</h3>
      )}
      <div className="space-y-2">
        <BusinessAddress multiLine />
        <BusinessPhone asLink />
        <BusinessEmail />
      </div>
      <SocialLinks className="pt-2" />
    </div>
  );
}

/**
 * Displays business footer with all relevant info.
 *
 * @example
 * <BusinessFooter className="bg-gray-900 text-white py-12" />
 */
export function BusinessFooter({ className }: ComponentProps) {
  const business = useBusinessInfo();
  if (!business) return null;

  return (
    <footer className={cn('py-8', className)}>
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          {business.business_name && (
            <h4 className="font-bold mb-4">{business.business_name}</h4>
          )}
          <BusinessAddress multiLine className="text-sm opacity-80" />
        </div>
        <div>
          <h4 className="font-bold mb-4">Contact</h4>
          <div className="space-y-2 text-sm opacity-80">
            <div>
              <BusinessPhone asLink />
            </div>
            <div>
              <BusinessEmail />
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-4">Hours</h4>
          <BusinessHours className="text-sm opacity-80" />
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-8 border-t border-current/20 flex flex-col md:flex-row justify-between items-center gap-4">
        <SocialLinks />
        <p className="text-sm opacity-60">
          {new Date().getFullYear()} {business.business_name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
