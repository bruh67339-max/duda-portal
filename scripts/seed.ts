// Seed script for creating initial test data
// Run with: npm run seed (or npx tsx scripts/seed.ts)

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nMake sure to set these in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // ========================================
    // 1. CREATE ADMIN USER
    // ========================================
    console.log('Creating admin user...');

    const adminEmail = 'admin@example.com';
    const adminPassword = 'SecureP@ssw0rd123!';

    // Create auth user
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (adminAuthError) {
      if (adminAuthError.message.includes('already been registered')) {
        console.log('  Admin user already exists, skipping...');
        // Get existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingAdmin = existingUsers.users.find((u) => u.email === adminEmail);
        if (existingAdmin) {
          // Check if admin record exists
          const { data: existingRecord } = await supabase
            .from('admin_users')
            .select('id')
            .eq('id', existingAdmin.id)
            .single();

          if (!existingRecord) {
            await supabase.from('admin_users').insert({
              id: existingAdmin.id,
              email: adminEmail,
              name: 'Admin User',
              role: 'super_admin',
            });
          }
        }
      } else {
        throw adminAuthError;
      }
    } else if (adminAuth.user) {
      // Create admin record
      await supabase.from('admin_users').insert({
        id: adminAuth.user.id,
        email: adminEmail,
        name: 'Admin User',
        role: 'super_admin',
      });
      console.log('  ✓ Admin user created');
    }

    // ========================================
    // 2. CREATE TEST CLIENT
    // ========================================
    console.log('\nCreating test client...');

    const clientEmail = 'client@example.com';
    const clientPassword = 'ClientP@ssw0rd123!';

    const { data: clientAuth, error: clientAuthError } = await supabase.auth.admin.createUser({
      email: clientEmail,
      password: clientPassword,
      email_confirm: true,
    });

    let clientId: string | undefined;

    if (clientAuthError) {
      if (clientAuthError.message.includes('already been registered')) {
        console.log('  Client user already exists, skipping...');
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingClient = existingUsers.users.find((u) => u.email === clientEmail);
        clientId = existingClient?.id;

        if (clientId) {
          const { data: existingRecord } = await supabase
            .from('clients')
            .select('id')
            .eq('id', clientId)
            .single();

          if (!existingRecord) {
            await supabase.from('clients').insert({
              id: clientId,
              email: clientEmail,
              name: 'Joe Martinez',
              company: "Joe's Pizza",
            });
          }
        }
      } else {
        throw clientAuthError;
      }
    } else if (clientAuth.user) {
      clientId = clientAuth.user.id;

      await supabase.from('clients').insert({
        id: clientId,
        email: clientEmail,
        name: 'Joe Martinez',
        company: "Joe's Pizza",
      });
      console.log('  ✓ Client user created');
    }

    if (!clientId) {
      throw new Error('Failed to get client ID');
    }

    // ========================================
    // 3. CREATE TEST SITE
    // ========================================
    console.log('\nCreating test site...');

    // Check if site already exists
    const { data: existingSite } = await supabase
      .from('sites')
      .select('id, api_key')
      .eq('slug', 'joes-pizza')
      .single();

    let siteId: string;
    let apiKey: string;

    if (existingSite) {
      console.log('  Site already exists, using existing...');
      siteId = existingSite.id;
      apiKey = existingSite.api_key;
    } else {
      const { data: newSite, error: siteError } = await supabase
        .from('sites')
        .insert({
          name: "Joe's Pizza",
          slug: 'joes-pizza',
          replit_url: 'https://joes-pizza.replit.app',
          client_id: clientId,
          status: 'published',
        })
        .select()
        .single();

      if (siteError) {
        throw siteError;
      }

      siteId = newSite.id;
      apiKey = newSite.api_key;
      console.log('  ✓ Site created');
    }

    // ========================================
    // 4. ADD BUSINESS INFO
    // ========================================
    console.log('\nAdding business info...');

    const { error: bizError } = await supabase.from('business_info').upsert(
      {
        site_id: siteId,
        business_name: "Joe's Pizza",
        phone: '(555) 123-4567',
        email: 'info@joespizza.com',
        address_street: '123 Main St',
        address_city: 'Brooklyn',
        address_state: 'NY',
        address_zip: '11201',
        address_country: 'USA',
        hours: {
          monday: '11:00 AM - 10:00 PM',
          tuesday: '11:00 AM - 10:00 PM',
          wednesday: '11:00 AM - 10:00 PM',
          thursday: '11:00 AM - 10:00 PM',
          friday: '11:00 AM - 11:00 PM',
          saturday: '11:00 AM - 11:00 PM',
          sunday: '12:00 PM - 9:00 PM',
        },
        social_links: {
          facebook: 'https://facebook.com/joespizza',
          instagram: 'https://instagram.com/joespizza',
        },
      },
      { onConflict: 'site_id' }
    );

    if (bizError) {
      console.log('  Business info error:', bizError.message);
    } else {
      console.log('  ✓ Business info added');
    }

    // ========================================
    // 5. ADD TEXT CONTENT
    // ========================================
    console.log('\nAdding text content...');

    const textFields = [
      {
        site_id: siteId,
        content_key: 'hero_headline',
        label: 'Hero Headline',
        content: "New York's Finest Pizza Since 1985",
        max_length: 100,
        sort_order: 1,
      },
      {
        site_id: siteId,
        content_key: 'hero_subheadline',
        label: 'Hero Subheadline',
        content: 'Hand-tossed dough, fresh ingredients, authentic recipes',
        max_length: 200,
        sort_order: 2,
      },
      {
        site_id: siteId,
        content_key: 'about_us',
        label: 'About Us',
        content:
          "For over 35 years, Joe's Pizza has been serving the Brooklyn community with authentic New York-style pizza. Our secret? Fresh ingredients, a family recipe passed down through generations, and a whole lot of love.",
        content_type: 'rich_text',
        sort_order: 3,
      },
    ];

    for (const field of textFields) {
      const { error } = await supabase
        .from('text_content')
        .upsert(field, { onConflict: 'site_id,content_key' });

      if (error) {
        console.log(`  Text field "${field.content_key}" error:`, error.message);
      }
    }
    console.log('  ✓ Text content added');

    // ========================================
    // 6. ADD MENU COLLECTION
    // ========================================
    console.log('\nAdding menu collection...');

    // Check if collection exists
    const { data: existingCollection } = await supabase
      .from('collections')
      .select('id')
      .eq('site_id', siteId)
      .eq('collection_key', 'menu_items')
      .single();

    let collectionId: string;

    if (existingCollection) {
      collectionId = existingCollection.id;
      console.log('  Collection already exists, using existing...');
    } else {
      const { data: newCollection, error: collError } = await supabase
        .from('collections')
        .insert({
          site_id: siteId,
          collection_key: 'menu_items',
          label: 'Menu Items',
          description: 'Your restaurant menu items',
          item_schema: {
            name: { type: 'text', label: 'Item Name', required: true, max_length: 100 },
            price: { type: 'text', label: 'Price', required: true, max_length: 20 },
            description: { type: 'textarea', label: 'Description', max_length: 300 },
            category: {
              type: 'select',
              label: 'Category',
              options: ['Pizzas', 'Sides', 'Drinks', 'Desserts'],
            },
          },
          can_add: true,
          can_delete: true,
          can_reorder: true,
        })
        .select()
        .single();

      if (collError) {
        throw collError;
      }

      collectionId = newCollection.id;
      console.log('  ✓ Collection created');
    }

    // ========================================
    // 7. ADD MENU ITEMS
    // ========================================
    console.log('\nAdding menu items...');

    const menuItems = [
      {
        collection_id: collectionId,
        data: {
          name: 'Margherita',
          price: '$18',
          description: 'Fresh mozzarella, tomato sauce, basil, extra virgin olive oil',
          category: 'Pizzas',
        },
        sort_order: 1,
      },
      {
        collection_id: collectionId,
        data: {
          name: 'Pepperoni',
          price: '$20',
          description: 'Classic pepperoni with mozzarella and our signature sauce',
          category: 'Pizzas',
        },
        sort_order: 2,
      },
      {
        collection_id: collectionId,
        data: {
          name: 'Supreme',
          price: '$24',
          description: 'Pepperoni, sausage, mushrooms, peppers, onions, olives',
          category: 'Pizzas',
        },
        sort_order: 3,
      },
      {
        collection_id: collectionId,
        data: {
          name: 'Garlic Knots',
          price: '$8',
          description: 'Fresh-baked knots with garlic butter and parmesan',
          category: 'Sides',
        },
        sort_order: 4,
      },
      {
        collection_id: collectionId,
        data: {
          name: 'Caesar Salad',
          price: '$12',
          description: 'Crisp romaine, parmesan, croutons, house caesar dressing',
          category: 'Sides',
        },
        sort_order: 5,
      },
    ];

    // Clear existing items and add new ones
    await supabase.from('collection_items').delete().eq('collection_id', collectionId);

    for (const item of menuItems) {
      await supabase.from('collection_items').insert(item);
    }
    console.log('  ✓ Menu items added');

    // ========================================
    // 8. ADD IMAGE SLOTS
    // ========================================
    console.log('\nAdding image slots...');

    const imageSlots = [
      {
        site_id: siteId,
        image_key: 'logo',
        label: 'Logo',
        description: 'Your business logo (recommended: 300x100px)',
        recommended_width: 300,
        recommended_height: 100,
        sort_order: 1,
      },
      {
        site_id: siteId,
        image_key: 'hero_background',
        label: 'Hero Background',
        description: 'Main hero section background image (recommended: 1920x1080px)',
        recommended_width: 1920,
        recommended_height: 1080,
        sort_order: 2,
      },
      {
        site_id: siteId,
        image_key: 'about_image',
        label: 'About Section Image',
        description: 'Image for the about us section (recommended: 800x600px)',
        recommended_width: 800,
        recommended_height: 600,
        sort_order: 3,
      },
    ];

    for (const slot of imageSlots) {
      await supabase.from('images').upsert(slot, { onConflict: 'site_id,image_key' });
    }
    console.log('  ✓ Image slots added');

    // ========================================
    // 9. SET PERMISSIONS
    // ========================================
    console.log('\nSetting permissions...');

    await supabase.from('site_permissions').upsert(
      {
        site_id: siteId,
        can_edit_business_info: true,
        can_edit_text: true,
        can_edit_images: true,
        can_edit_collections: true,
        can_add_collection_items: true,
        can_delete_collection_items: false, // Clients can't delete menu items
        can_reorder_collection_items: true,
        can_publish: true,
      },
      { onConflict: 'site_id' }
    );
    console.log('  ✓ Permissions set');

    // ========================================
    // DONE
    // ========================================
    console.log('\n========================================');
    console.log('✅ Seed complete!');
    console.log('========================================\n');
    console.log('Test credentials:');
    console.log('----------------------------------------');
    console.log(`Admin:  ${adminEmail}`);
    console.log(`        ${adminPassword}`);
    console.log('----------------------------------------');
    console.log(`Client: ${clientEmail}`);
    console.log(`        ${clientPassword}`);
    console.log('----------------------------------------');
    console.log(`\nTest site: joes-pizza`);
    console.log(`API Key:   ${apiKey}`);
    console.log('\nPublic API URL:');
    console.log(`GET /api/public/sites/joes-pizza/content`);
    console.log(`Header: x-api-key: ${apiKey}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run the seed
seed();
