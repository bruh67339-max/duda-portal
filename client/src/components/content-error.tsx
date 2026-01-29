import { AlertCircle, RefreshCw, WifiOff, KeyRound, FileX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PortalApiError, PortalConfigError } from '@/lib/portal-content';

interface ContentErrorProps {
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * Displays an error state when content fails to load.
 * Provides specific messaging based on error type and an optional retry button.
 *
 * @example
 * <ContentError error={error} onRetry={() => refetch()} />
 */
export function ContentError({ error, onRetry, className }: ContentErrorProps) {
  const { icon: Icon, title, message } = getErrorDetails(error);

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center bg-background',
        className
      )}
      role="alert"
    >
      <div className="text-center space-y-4 p-8 max-w-md">
        <Icon className="h-12 w-12 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center px-4 py-2 border rounded-md hover:bg-accent transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        )}
        <p className="text-sm text-muted-foreground">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}

/**
 * Inline error component for smaller error displays.
 *
 * @example
 * <InlineError message="Failed to load menu items" />
 */
export function InlineError({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive',
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm underline hover:no-underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Get error details based on error type for display purposes.
 */
function getErrorDetails(error?: Error | null): {
  icon: typeof AlertCircle;
  title: string;
  message: string;
} {
  if (!error) {
    return {
      icon: AlertCircle,
      title: 'Unable to Load Content',
      message: 'An unexpected error occurred while loading content.',
    };
  }

  if (error instanceof PortalConfigError) {
    return {
      icon: KeyRound,
      title: 'Configuration Error',
      message: error.message,
    };
  }

  if (error instanceof PortalApiError) {
    switch (error.status) {
      case 401:
        return {
          icon: KeyRound,
          title: 'Authentication Failed',
          message:
            'The API key is invalid or expired. Please check your configuration.',
        };
      case 404:
        return {
          icon: FileX,
          title: 'Site Not Found',
          message:
            'This site could not be found. Please verify the site slug is correct.',
        };
      case 500:
      case 502:
      case 503:
        return {
          icon: WifiOff,
          title: 'Server Unavailable',
          message:
            'The content server is temporarily unavailable. Please try again later.',
        };
      default:
        return {
          icon: AlertCircle,
          title: 'Request Failed',
          message: error.message,
        };
    }
  }

  // Network errors
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return {
      icon: WifiOff,
      title: 'Connection Error',
      message:
        'Unable to connect to the content server. Please check your internet connection.',
    };
  }

  return {
    icon: AlertCircle,
    title: 'Unable to Load Content',
    message: error.message || 'An unexpected error occurred.',
  };
}
