/**
 * Portal Content Components
 *
 * This barrel file exports all portal-related components and hooks
 * for easy importing throughout your application.
 *
 * @example
 * import {
 *   ContentProvider,
 *   useContent,
 *   DynamicText,
 *   useText,
 *   DynamicImage,
 *   CollectionList,
 *   BusinessPhone,
 * } from '@/components/portal';
 */

// Content Provider
export {
  ContentProvider,
  useContent,
  withContent,
} from '../content-provider';

// Text Components
export {
  DynamicText,
  DynamicHtml,
  useText,
  useTexts,
} from '../dynamic-text';

// Image Components
export {
  DynamicImage,
  DynamicBackgroundImage,
  BusinessLogo,
  useImage,
} from '../dynamic-image';

// Collection Components
export {
  CollectionList,
  GroupedCollectionList,
  useCollection,
  useCollectionGrouped,
} from '../collection-list';

// Business Info Components
export {
  useBusinessInfo,
  BusinessName,
  BusinessPhone,
  BusinessEmail,
  BusinessAddress,
  BusinessHours,
  SocialLinks,
  BusinessContactCard,
  BusinessFooter,
} from '../business-info';

// Loading States
export {
  Skeleton,
  LoadingSkeleton,
  TextSkeleton,
  ImageSkeleton,
  CardSkeleton,
  ListSkeleton,
} from '../loading-skeleton';

// Error Components
export { ContentError, InlineError } from '../content-error';

// Types
export type {
  SiteContent,
  BusinessInfo,
  Address,
  CollectionItem,
  ImageData,
} from '@/lib/portal-content';

// Hooks from use-portal-content (for use outside ContentProvider)
export {
  usePortalContent,
  useBusinessInfo as useBusinessInfoQuery,
  useText as useTextQuery,
  useCollection as useCollectionQuery,
  useImage as useImageQuery,
  useAllText,
  useAllImages,
  useSiteInfo,
} from '@/hooks/use-portal-content';
