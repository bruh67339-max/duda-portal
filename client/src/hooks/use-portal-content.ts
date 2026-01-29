import { useQuery } from '@tanstack/react-query';
import {
  fetchPortalContent,
  type SiteContent,
  type CollectionItem,
  type ImageData,
  type BusinessInfo,
} from '@/lib/portal-content';

/**
 * Main hook for fetching portal content with TanStack Query.
 *
 * Provides automatic caching, background refetching, and error handling.
 *
 * @example
 * function MyComponent() {
 *   const { data, isLoading, isError } = usePortalContent();
 *   if (isLoading) return <Skeleton />;
 *   if (isError) return <Error />;
 *   return <div>{data.business?.business_name}</div>;
 * }
 */
export function usePortalContent() {
  return useQuery<SiteContent>({
    queryKey: ['portal-content'],
    queryFn: fetchPortalContent,
    staleTime: 1000 * 60 * 5, // 5 minutes - content is fresh
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache (formerly cacheTime)
    retry: 2, // Retry failed requests twice
    refetchOnWindowFocus: false, // Don't refetch when tab gains focus
  });
}

/**
 * Hook to access business information.
 *
 * @example
 * const { business, isLoading } = useBusinessInfo();
 * if (business?.phone) {
 *   return <a href={`tel:${business.phone}`}>{business.phone}</a>;
 * }
 */
export function useBusinessInfo() {
  const { data, ...rest } = usePortalContent();
  return {
    business: data?.business ?? null,
    ...rest,
  } as { business: BusinessInfo | null } & Omit<
    ReturnType<typeof usePortalContent>,
    'data'
  >;
}

/**
 * Hook to get a specific text value by key.
 *
 * @param key - The text content key (e.g., 'hero_headline')
 * @param fallback - Default value if key doesn't exist
 *
 * @example
 * const { text, isLoading } = useText('hero_headline', 'Welcome');
 */
export function useText(key: string, fallback: string = '') {
  const { data, ...rest } = usePortalContent();
  return {
    text: data?.text?.[key] ?? fallback,
    ...rest,
  } as { text: string } & Omit<ReturnType<typeof usePortalContent>, 'data'>;
}

/**
 * Hook to get a collection by key.
 *
 * @param key - The collection key (e.g., 'menu_items')
 *
 * @example
 * interface MenuItem { id: string; name: string; price: string; }
 * const { items, isLoading } = useCollection<MenuItem>('menu_items');
 * items.map(item => <MenuItem key={item.id} {...item} />);
 */
export function useCollection<T extends CollectionItem>(key: string) {
  const { data, ...rest } = usePortalContent();
  return {
    items: (data?.collections?.[key] ?? []) as T[],
    ...rest,
  } as { items: T[] } & Omit<ReturnType<typeof usePortalContent>, 'data'>;
}

/**
 * Hook to get an image by key.
 *
 * @param key - The image key (e.g., 'hero_background')
 *
 * @example
 * const { image, isLoading } = useImage('hero_background');
 * if (image?.url) {
 *   return <img src={image.url} alt={image.alt || ''} />;
 * }
 */
export function useImage(key: string) {
  const { data, ...rest } = usePortalContent();
  return {
    image: data?.images?.[key] ?? null,
    ...rest,
  } as { image: ImageData | null } & Omit<
    ReturnType<typeof usePortalContent>,
    'data'
  >;
}

/**
 * Hook to get all text content as an object.
 *
 * @example
 * const { texts } = useAllText();
 * return <h1>{texts.hero_headline}</h1>;
 */
export function useAllText() {
  const { data, ...rest } = usePortalContent();
  return {
    texts: data?.text ?? {},
    ...rest,
  } as { texts: Record<string, string> } & Omit<
    ReturnType<typeof usePortalContent>,
    'data'
  >;
}

/**
 * Hook to get all images as an object.
 *
 * @example
 * const { images } = useAllImages();
 * return <img src={images.logo?.url} alt={images.logo?.alt} />;
 */
export function useAllImages() {
  const { data, ...rest } = usePortalContent();
  return {
    images: data?.images ?? {},
    ...rest,
  } as { images: Record<string, ImageData> } & Omit<
    ReturnType<typeof usePortalContent>,
    'data'
  >;
}

/**
 * Hook to get site metadata.
 *
 * @example
 * const { site } = useSiteInfo();
 * return <title>{site?.name}</title>;
 */
export function useSiteInfo() {
  const { data, ...rest } = usePortalContent();
  return {
    site: data?.site ?? null,
    ...rest,
  } as { site: { name: string; slug: string } | null } & Omit<
    ReturnType<typeof usePortalContent>,
    'data'
  >;
}
