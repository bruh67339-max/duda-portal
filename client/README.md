# Portal Content Template for Replit Sites

This template provides React components and hooks for fetching and displaying dynamic content from the portal API.

## Quick Start

### 1. Set Up Environment Variables

In Replit, go to the Secrets tab (lock icon) and add:

```
VITE_PORTAL_API_URL = https://your-portal.vercel.app
VITE_SITE_SLUG = your-site-slug
VITE_PORTAL_API_KEY = your-api-key
```

### 2. Wrap Your App with QueryClientProvider

Ensure TanStack Query is set up at your app's root:

```tsx
// App.tsx
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your routes */}
    </QueryClientProvider>
  );
}
```

### 3. Use ContentProvider in Your Pages

```tsx
// pages/home.tsx
import { ContentProvider, DynamicText } from '@/components/portal';

function HomeContent() {
  return (
    <div>
      <DynamicText contentKey="hero_headline" as="h1" />
    </div>
  );
}

export default function HomePage() {
  return (
    <ContentProvider>
      <HomeContent />
    </ContentProvider>
  );
}
```

## Components

### ContentProvider

Wraps your page and provides content context. Handles loading and error states.

```tsx
<ContentProvider
  loadingFallback={<CustomLoader />}
  errorFallback={<CustomError />}
>
  <YourPage />
</ContentProvider>
```

### DynamicText

Renders text content from the portal.

```tsx
<DynamicText
  contentKey="hero_headline"
  as="h1"
  className="text-4xl font-bold"
  fallback="Welcome"
/>
```

### useText Hook

Get raw text value for use in JSX.

```tsx
const buttonText = useText('cta_button', 'Click Here');
return <button>{buttonText}</button>;
```

### DynamicImage

Renders an image from the portal.

```tsx
<DynamicImage
  imageKey="hero_background"
  className="w-full h-64 object-cover"
  fallbackSrc="/default-hero.jpg"
/>
```

### CollectionList

Renders a list of items from a collection.

```tsx
interface MenuItem {
  id: string;
  name: string;
  price: string;
}

<CollectionList<MenuItem>
  collectionKey="menu_items"
  className="grid grid-cols-3 gap-4"
  renderItem={(item) => (
    <div key={item.id}>
      <h3>{item.name}</h3>
      <span>{item.price}</span>
    </div>
  )}
/>
```

### Business Info Components

Pre-built components for common business information:

```tsx
<BusinessPhone asLink />
<BusinessEmail />
<BusinessAddress multiLine />
<BusinessHours />
<SocialLinks />
<BusinessFooter className="bg-gray-900 text-white" />
```

## File Structure

```
client/
├── src/
│   ├── lib/
│   │   ├── portal-content.ts   # Types and fetch function
│   │   └── utils.ts            # Utilities (cn function)
│   ├── hooks/
│   │   └── use-portal-content.ts  # TanStack Query hooks
│   ├── components/
│   │   ├── content-provider.tsx   # Context provider
│   │   ├── dynamic-text.tsx       # Text components
│   │   ├── dynamic-image.tsx      # Image components
│   │   ├── collection-list.tsx    # Collection components
│   │   ├── business-info.tsx      # Business info components
│   │   ├── loading-skeleton.tsx   # Loading states
│   │   ├── content-error.tsx      # Error display
│   │   └── portal/
│   │       └── index.ts           # Barrel exports
│   └── pages/
│       └── home-example.tsx       # Example page
└── .env.example
```

## Dependencies

This template requires:
- `@tanstack/react-query` - Data fetching and caching
- `clsx` and `tailwind-merge` - Class name utilities
- `lucide-react` - Icons (for error states)

Install if needed:
```bash
npm install @tanstack/react-query clsx tailwind-merge lucide-react
```

## Converting Existing Pages

1. Import ContentProvider and components
2. Wrap page content with ContentProvider
3. Replace hardcoded text with DynamicText
4. Replace hardcoded images with DynamicImage
5. Replace hardcoded lists with CollectionList

See `pages/home-example.tsx` for a complete example.
