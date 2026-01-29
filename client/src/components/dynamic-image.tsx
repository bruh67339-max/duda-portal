import { useState, type ImgHTMLAttributes } from 'react';
import { useContent } from './content-provider';
import { cn } from '@/lib/utils';
import { Skeleton } from './loading-skeleton';

interface DynamicImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  /** The image key to look up in the portal images data */
  imageKey: string;
  /** Fallback image URL if the key doesn't exist or URL is null */
  fallbackSrc?: string;
  /** Fallback alt text if not provided in portal data */
  fallbackAlt?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show skeleton while image loads */
  showLoadingSkeleton?: boolean;
  /** Skeleton className for loading state */
  skeletonClassName?: string;
}

/**
 * Renders an image from the portal.
 * Automatically looks up the image by key and uses portal-provided alt text.
 *
 * @example
 * // Basic usage
 * <DynamicImage imageKey="hero_background" />
 *
 * @example
 * // With styling and fallback
 * <DynamicImage
 *   imageKey="hero_background"
 *   className="w-full h-64 object-cover"
 *   fallbackSrc="/images/default-hero.jpg"
 *   fallbackAlt="Hero section"
 * />
 *
 * @example
 * // With loading skeleton
 * <DynamicImage
 *   imageKey="product_image"
 *   showLoadingSkeleton
 *   skeletonClassName="w-full aspect-square"
 * />
 */
export function DynamicImage({
  imageKey,
  fallbackSrc,
  fallbackAlt = '',
  className,
  showLoadingSkeleton = false,
  skeletonClassName,
  ...props
}: DynamicImageProps) {
  const { content } = useContent();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const image = content.images[imageKey];
  const src = image?.url ?? fallbackSrc;
  const alt = image?.alt ?? fallbackAlt;

  // Don't render if no source available
  if (!src) {
    return null;
  }

  // If error loading image and no fallback, don't render
  if (hasError && !fallbackSrc) {
    return null;
  }

  return (
    <>
      {showLoadingSkeleton && isLoading && (
        <Skeleton className={cn(className, skeletonClassName)} />
      )}
      <img
        src={hasError && fallbackSrc ? fallbackSrc : src}
        alt={alt}
        className={cn(
          className,
          showLoadingSkeleton && isLoading && 'hidden'
        )}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        {...props}
      />
    </>
  );
}

/**
 * Hook to get image data from the portal.
 * Use this when you need more control over rendering.
 *
 * @param key - The image key
 * @returns Image data with url and alt, or null if not found
 *
 * @example
 * function HeroSection() {
 *   const heroImage = useImage('hero_background');
 *
 *   return (
 *     <div
 *       style={{
 *         backgroundImage: heroImage?.url
 *           ? `url(${heroImage.url})`
 *           : 'none'
 *       }}
 *     >
 *       ...
 *     </div>
 *   );
 * }
 */
export function useImage(key: string) {
  const { content } = useContent();
  return content.images[key] ?? null;
}

/**
 * Renders a background image from the portal.
 * Useful for hero sections or decorative backgrounds.
 *
 * @example
 * <DynamicBackgroundImage
 *   imageKey="hero_background"
 *   className="min-h-screen bg-cover bg-center"
 *   fallbackSrc="/images/default-bg.jpg"
 * >
 *   <div className="container mx-auto py-16">
 *     <h1>Welcome</h1>
 *   </div>
 * </DynamicBackgroundImage>
 */
export function DynamicBackgroundImage({
  imageKey,
  fallbackSrc,
  className,
  style,
  children,
  ...props
}: {
  imageKey: string;
  fallbackSrc?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { content } = useContent();
  const image = content.images[imageKey];
  const src = image?.url ?? fallbackSrc;

  return (
    <div
      className={cn(className)}
      style={{
        ...style,
        backgroundImage: src ? `url(${src})` : undefined,
      }}
      role={image?.alt ? 'img' : undefined}
      aria-label={image?.alt || undefined}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Renders the business logo from the portal.
 * Convenience component that uses the business logo_url field.
 *
 * @example
 * <BusinessLogo className="h-12 w-auto" fallbackSrc="/logo.png" />
 */
export function BusinessLogo({
  className,
  fallbackSrc,
  fallbackAlt = 'Logo',
  ...props
}: Omit<DynamicImageProps, 'imageKey'>) {
  const { content } = useContent();
  const logoUrl = content.business?.logo_url;

  if (!logoUrl && !fallbackSrc) {
    return null;
  }

  return (
    <img
      src={logoUrl ?? fallbackSrc}
      alt={fallbackAlt}
      className={cn(className)}
      loading="lazy"
      {...props}
    />
  );
}
