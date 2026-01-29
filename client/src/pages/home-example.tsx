/**
 * EXAMPLE: Converting a Page to Use Dynamic Content
 *
 * This file demonstrates how to convert a typical hardcoded page
 * to use dynamic content from the portal.
 *
 * The pattern is:
 * 1. Wrap your page content with ContentProvider
 * 2. Replace hardcoded text with DynamicText or useText
 * 3. Replace hardcoded images with DynamicImage
 * 4. Replace hardcoded lists with CollectionList
 */

import { ContentProvider, useContent } from '@/components/content-provider';
import { DynamicText, useText } from '@/components/dynamic-text';
import { DynamicImage, DynamicBackgroundImage, BusinessLogo } from '@/components/dynamic-image';
import { CollectionList, useCollection } from '@/components/collection-list';
import {
  BusinessPhone,
  BusinessEmail,
  BusinessAddress,
  BusinessHours,
  SocialLinks,
  BusinessFooter,
} from '@/components/business-info';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ContentError } from '@/components/content-error';

// =============================================================================
// BEFORE: Hardcoded Page (DO NOT USE - For Reference Only)
// =============================================================================

/*
function OldHomePage() {
  return (
    <div>
      <header>
        <img src="/logo.png" alt="Joe's Pizza" />
        <nav>
          <a href="/">Home</a>
          <a href="/menu">Menu</a>
          <a href="/about">About</a>
        </nav>
        <span>(555) 123-4567</span>
      </header>

      <section className="hero">
        <h1>New York's Finest Pizza Since 1985</h1>
        <p>Hand-tossed dough, fresh ingredients, family recipes.</p>
        <button>Order Now</button>
      </section>

      <section className="menu">
        <h2>Our Menu</h2>
        <div className="menu-items">
          <div className="menu-item">
            <h3>Margherita</h3>
            <p>$18</p>
            <p>Fresh tomatoes, mozzarella, basil</p>
          </div>
          <div className="menu-item">
            <h3>Pepperoni</h3>
            <p>$20</p>
            <p>Classic pepperoni with mozzarella</p>
          </div>
        </div>
      </section>

      <section className="about">
        <h2>About Us</h2>
        <p>For over 35 years, Joe's Pizza has been serving Brooklyn...</p>
      </section>

      <footer>
        <p>123 Main St, Brooklyn, NY 11201</p>
        <p>(555) 123-4567</p>
        <p>info@joespizza.com</p>
        <p>© 2024 Joe's Pizza</p>
      </footer>
    </div>
  );
}
*/

// =============================================================================
// AFTER: Dynamic Page with Portal Content
// =============================================================================

// Define the shape of menu items from your portal
interface MenuItem {
  id: string;
  name: string;
  price: string;
  description: string;
  category: string;
  image_url?: string;
}

/**
 * The main page content - must be inside ContentProvider
 */
function HomePageContent() {
  // For button text and other inline uses, use the hook
  const ctaText = useText('cta_button_text', 'Order Now');
  const { content } = useContent();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <BusinessLogo className="h-12 w-auto" fallbackSrc="/logo.png" />
        <nav className="flex gap-6">
          <a href="/" className="hover:text-primary">
            Home
          </a>
          <a href="/menu" className="hover:text-primary">
            Menu
          </a>
          <a href="/about" className="hover:text-primary">
            About
          </a>
        </nav>
        <BusinessPhone asLink className="font-semibold" />
      </header>

      {/* Hero Section with Background Image */}
      <DynamicBackgroundImage
        imageKey="hero_background"
        fallbackSrc="/images/default-hero.jpg"
        className="relative py-24 px-6 bg-cover bg-center"
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative container mx-auto text-white text-center">
          {/* Dynamic headline */}
          <DynamicText
            contentKey="hero_headline"
            as="h1"
            className="text-5xl font-bold mb-4"
            fallback="Welcome to Our Restaurant"
          />

          {/* Dynamic subheadline */}
          <DynamicText
            contentKey="hero_subheadline"
            as="p"
            className="text-xl mb-8 opacity-90"
            fallback="Delicious food made with love"
          />

          <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
            {ctaText}
          </button>
        </div>
      </DynamicBackgroundImage>

      {/* Menu Section with Collection */}
      <section className="py-16 px-6 bg-muted/50">
        <div className="container mx-auto">
          <DynamicText
            contentKey="menu_section_title"
            as="h2"
            className="text-3xl font-bold text-center mb-12"
            fallback="Our Menu"
          />

          <CollectionList<MenuItem>
            collectionKey="menu_items"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            emptyMessage="Menu coming soon!"
            limit={6} // Show only 6 items on home page
            renderItem={(item) => (
              <div
                key={item.id}
                className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <span className="text-primary font-semibold">{item.price}</span>
                  </div>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                  <span className="inline-block mt-2 text-xs bg-muted px-2 py-1 rounded">
                    {item.category}
                  </span>
                </div>
              </div>
            )}
          />

          <div className="text-center mt-8">
            <a
              href="/menu"
              className="inline-flex items-center text-primary hover:underline font-semibold"
            >
              View Full Menu
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <DynamicText
              contentKey="about_section_title"
              as="h2"
              className="text-3xl font-bold mb-6"
              fallback="About Us"
            />
            <DynamicText
              contentKey="about_us"
              as="p"
              className="text-muted-foreground leading-relaxed"
              fallback="Welcome to our restaurant. We've been serving delicious food for years."
            />
          </div>
          <DynamicImage
            imageKey="about_image"
            fallbackSrc="/images/default-about.jpg"
            className="rounded-lg shadow-lg w-full"
          />
        </div>
      </section>

      {/* Hours & Contact Section */}
      <section className="py-16 px-6 bg-muted/50">
        <div className="container mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold mb-6">Hours</h2>
            <BusinessHours className="bg-card p-6 rounded-lg" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-6">Contact</h2>
            <div className="bg-card p-6 rounded-lg space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                  Address
                </h3>
                <BusinessAddress multiLine />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                  Phone
                </h3>
                <BusinessPhone asLink />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                  Email
                </h3>
                <BusinessEmail />
              </div>
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                  Follow Us
                </h3>
                <SocialLinks />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - uses the pre-built component */}
      <BusinessFooter className="bg-gray-900 text-white" />
    </div>
  );
}

/**
 * The exported page component with ContentProvider wrapper
 */
export default function HomePage() {
  return (
    <ContentProvider
      // Optional: Custom loading state
      loadingFallback={<LoadingSkeleton />}
      // Optional: Custom error handling with retry
      errorFallback={(error, retry) => (
        <ContentError error={error} onRetry={retry} />
      )}
    >
      <HomePageContent />
    </ContentProvider>
  );
}

// =============================================================================
// ALTERNATIVE: Using the HOC pattern
// =============================================================================

/*
import { withContent } from '@/components/content-provider';

const HomePageContent = withContent(function HomePageContent() {
  // ... same content as above
});

export default HomePageContent;
*/
