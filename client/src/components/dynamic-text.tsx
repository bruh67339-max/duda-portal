import type { ElementType, ComponentPropsWithoutRef } from 'react';
import { useContent } from './content-provider';
import { cn } from '@/lib/utils';

type DynamicTextProps<T extends ElementType = 'span'> = {
  /** The content key to look up in the portal text data */
  contentKey: string;
  /** Fallback text if the key doesn't exist */
  fallback?: string;
  /** HTML element to render (default: 'span') */
  as?: T;
  /** Additional CSS classes */
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'children'>;

/**
 * Renders text content from the portal.
 * Automatically looks up the text by key and renders it in the specified element.
 *
 * @example
 * // Basic usage
 * <DynamicText contentKey="hero_headline" />
 *
 * @example
 * // With custom element and styling
 * <DynamicText
 *   contentKey="hero_headline"
 *   as="h1"
 *   className="text-4xl font-bold"
 *   fallback="Welcome to our site"
 * />
 *
 * @example
 * // With additional HTML attributes
 * <DynamicText
 *   contentKey="about_us"
 *   as="p"
 *   id="about-section"
 *   data-testid="about-text"
 * />
 */
export function DynamicText<T extends ElementType = 'span'>({
  contentKey,
  fallback = '',
  as,
  className,
  ...props
}: DynamicTextProps<T>) {
  const { content } = useContent();
  const text = content.text[contentKey] ?? fallback;
  const Component = as || 'span';

  return (
    <Component className={cn(className)} {...props}>
      {text}
    </Component>
  );
}

/**
 * Hook to get raw text value from the portal.
 * Use this when you need the text as a string rather than a component.
 *
 * @param key - The text content key
 * @param fallback - Default value if key doesn't exist
 * @returns The text string
 *
 * @example
 * function MyComponent() {
 *   const buttonText = useText('cta_button_text', 'Click Here');
 *   const title = useText('page_title');
 *   return (
 *     <>
 *       <title>{title || 'Default Title'}</title>
 *       <button>{buttonText}</button>
 *     </>
 *   );
 * }
 */
export function useText(key: string, fallback: string = ''): string {
  const { content } = useContent();
  return content.text[key] ?? fallback;
}

/**
 * Hook to get multiple text values at once.
 * Useful when a component needs several text values.
 *
 * @param keys - Object mapping local names to content keys with optional fallbacks
 * @returns Object with the resolved text values
 *
 * @example
 * function HeroSection() {
 *   const text = useTexts({
 *     headline: ['hero_headline', 'Welcome'],
 *     subheadline: ['hero_subheadline', 'Discover more'],
 *     cta: ['cta_text', 'Get Started'],
 *   });
 *
 *   return (
 *     <div>
 *       <h1>{text.headline}</h1>
 *       <p>{text.subheadline}</p>
 *       <button>{text.cta}</button>
 *     </div>
 *   );
 * }
 */
export function useTexts<T extends Record<string, [string, string?]>>(
  keys: T
): { [K in keyof T]: string } {
  const { content } = useContent();

  return Object.fromEntries(
    Object.entries(keys).map(([name, [key, fallback = '']]) => [
      name,
      content.text[key] ?? fallback,
    ])
  ) as { [K in keyof T]: string };
}

/**
 * Renders text with HTML support (for rich text content).
 * Use with caution - only for trusted content from the portal.
 *
 * @example
 * <DynamicHtml
 *   contentKey="about_us_rich"
 *   as="div"
 *   className="prose"
 *   fallback="<p>About us content coming soon.</p>"
 * />
 */
export function DynamicHtml<T extends ElementType = 'div'>({
  contentKey,
  fallback = '',
  as,
  className,
  ...props
}: DynamicTextProps<T>) {
  const { content } = useContent();
  const html = content.text[contentKey] ?? fallback;
  const Component = as || 'div';

  return (
    <Component
      className={cn(className)}
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  );
}
