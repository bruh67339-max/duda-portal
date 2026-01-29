import { createContext, useContext, type ReactNode } from 'react';
import { usePortalContent } from '@/hooks/use-portal-content';
import type { SiteContent } from '@/lib/portal-content';
import { ContentError } from './content-error';
import { LoadingSkeleton } from './loading-skeleton';

interface ContentContextValue {
  content: SiteContent;
  isLoading: boolean;
  refetch: () => void;
}

const ContentContext = createContext<ContentContextValue | null>(null);

/**
 * Hook to access the content context.
 * Must be used within a ContentProvider.
 *
 * @example
 * function MyComponent() {
 *   const { content, isLoading } = useContent();
 *   return <h1>{content.text.hero_headline}</h1>;
 * }
 */
export function useContent() {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error(
      'useContent must be used within a ContentProvider. ' +
        'Wrap your component tree with <ContentProvider>.'
    );
  }
  return context;
}

interface ContentProviderProps {
  children: ReactNode;
  /** Custom loading fallback component */
  loadingFallback?: ReactNode;
  /** Custom error fallback component */
  errorFallback?: ReactNode | ((error: Error | null, retry: () => void) => ReactNode);
  /**
   * If true, renders children with fallback values instead of blocking on load.
   * Useful for pages where partial content is acceptable.
   */
  suspenseless?: boolean;
}

/**
 * Provides portal content to child components via React context.
 * Handles loading and error states automatically.
 *
 * @example
 * // Basic usage - blocks until content loads
 * function App() {
 *   return (
 *     <ContentProvider>
 *       <HomePage />
 *     </ContentProvider>
 *   );
 * }
 *
 * @example
 * // With custom loading/error states
 * <ContentProvider
 *   loadingFallback={<MyCustomLoader />}
 *   errorFallback={(error, retry) => <MyError error={error} onRetry={retry} />}
 * >
 *   <HomePage />
 * </ContentProvider>
 *
 * @example
 * // Suspenseless mode - shows fallback content immediately
 * <ContentProvider suspenseless>
 *   <HomePage /> {/* Will render with fallback text until content loads *\/}
 * </ContentProvider>
 */
export function ContentProvider({
  children,
  loadingFallback,
  errorFallback,
  suspenseless = false,
}: ContentProviderProps) {
  const { data, isLoading, isError, error, refetch } = usePortalContent();

  // Suspenseless mode: render children immediately with empty/fallback content
  if (suspenseless) {
    const emptyContent: SiteContent = {
      site: { name: '', slug: '' },
      business: null,
      text: {},
      collections: {},
      images: {},
    };

    return (
      <ContentContext.Provider
        value={{
          content: data ?? emptyContent,
          isLoading,
          refetch,
        }}
      >
        {children}
      </ContentContext.Provider>
    );
  }

  // Standard mode: show loading state
  if (isLoading) {
    return <>{loadingFallback ?? <LoadingSkeleton />}</>;
  }

  // Show error state
  if (isError || !data) {
    if (typeof errorFallback === 'function') {
      return <>{errorFallback(error, refetch)}</>;
    }
    return (
      <>
        {errorFallback ?? <ContentError error={error} onRetry={refetch} />}
      </>
    );
  }

  return (
    <ContentContext.Provider value={{ content: data, isLoading, refetch }}>
      {children}
    </ContentContext.Provider>
  );
}

/**
 * HOC to wrap a component with ContentProvider.
 * Useful for page-level components.
 *
 * @example
 * const HomePage = withContent(function HomePage() {
 *   const { content } = useContent();
 *   return <h1>{content.text.hero_headline}</h1>;
 * });
 */
export function withContent<P extends object>(
  Component: React.ComponentType<P>,
  providerProps?: Omit<ContentProviderProps, 'children'>
) {
  return function WithContentWrapper(props: P) {
    return (
      <ContentProvider {...providerProps}>
        <Component {...props} />
      </ContentProvider>
    );
  };
}
