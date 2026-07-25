const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { getDb } = require('./db'); // PG driver

const { DB_PATH, UPLOADS_DIR } = require('./utils/paths');

const supabase = createClient(
  'https://vqzagnqoxmlffhjbnrxp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxemFnbnFveG1sZmZoamJucnhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc1MjIyNCwiZXhwIjoyMTAwMzI4MjI0fQ.xKOCwj1hzivN8EYpJhl0zJB515FCU-HH-JKUUpwSBAw'
);

async function migrate() {
  console.log('Starting Migration from SQLite to Supabase...');
  
  // 1. Connect to SQLite
  const sqliteDb = await open({ filename: DB_PATH, driver: sqlite3.Database });
  
  // 2. Connect to PG
  const pgDb = await getDb();

  // 3. Migrate Users
  const users = await sqliteDb.all('SELECT * FROM users');
  for (const u of users) {
    try {
      await pgDb.run('INSERT INTO users (id, full_name, email, password, phone, is_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [u.id, u.full_name, u.email, u.password, u.phone, u.is_verified, u.created_at]);
    } catch (e) { if(!e.message.includes('duplicate key')) console.error(e.message); }
  }
  console.log(`Migrated ${users.length} users.`);

  // 4. Migrate Admin Users
  const admins = await sqliteDb.all('SELECT * FROM admin_users');
  for (const a of admins) {
    try {
      await pgDb.run('INSERT INTO admin_users (id, username, password, email, created_at) VALUES (?, ?, ?, ?, ?)', 
        [a.id, a.username, a.password, a.email, a.created_at]);
    } catch (e) { if(!e.message.includes('duplicate key')) console.error(e.message); }
  }
  console.log(`Migrated ${admins.length} admins.`);

  // 5. Migrate Products & Variants
  const products = await sqliteDb.all('SELECT * FROM products');
  for (const p of products) {
    try {
      await pgDb.run('INSERT INTO products (id, name, description, base_price, sale_price, fabric, sku, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [p.id, p.name, p.description, p.base_price, p.sale_price, p.fabric, p.sku, p.category, p.created_at]);
    } catch (e) { if(!e.message.includes('duplicate key')) console.error(e.message); }
  }
  console.log(`Migrated ${products.length} products.`);

  const variants = await sqliteDb.all('SELECT * FROM product_variants');
  for (const v of variants) {
    try {
      await pgDb.run('INSERT INTO product_variants (id, product_id, size, color, stock_quantity) VALUES (?, ?, ?, ?, ?)', 
        [v.id, v.product_id, v.size, v.color, v.stock_quantity]);
    } catch (e) { if(!e.message.includes('duplicate key')) console.error(e.message); }
  }
  console.log(`Migrated ${variants.length} variants.`);

  // 6. Migrate Files to Supabase Storage & Update URLs
  let imageUploads = 0;
  if (fs.existsSync(UPLOADS_DIR)) {
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const file of files) {
      const filePath = path.join(UPLOADS_DIR, file);
      const buffer = fs.readFileSync(filePath);
      
      const { data, error } = await supabase.storage.from('images').upload(file, buffer, { upsert: true });
      if (!error) imageUploads++;
    }
  }
  console.log(`Uploaded ${imageUploads} images to Supabase Storage.`);

  const getPublicUrl = (filename) => {
    const { data } = supabase.storage.from('images').getPublicUrl(filename);
    return data.publicUrl;
  };

  // 7. Migrate Product Images
  const pImages = await sqliteDb.all('SELECT * FROM product_images');
  for (const pi of pImages) {
    let newUrl = pi.image_url;
    if (newUrl.startsWith('/uploads/')) {
      newUrl = getPublicUrl(newUrl.replace('/uploads/', ''));
    }
    try {
      await pgDb.run('INSERT INTO product_images (id, product_id, image_url, is_primary) VALUES (?, ?, ?, ?)', 
        [pi.id, pi.product_id, newUrl, pi.is_primary]);
    } catch (e) { if(!e.message.includes('duplicate key')) console.error(e.message); }
  }
  console.log(`Migrated ${pImages.length} product images.`);

  // 8. Migrate Orders & Items
  const orders = await sqliteDb.all('SELECT * FROM orders');
  for (const o of orders) {
    try {
      await pgDb.run('INSERT INTO orders (id, user_id, email, customer_name, phone, address, city, zip_code, total_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [o.id, o.user_id, o.email, o.customer_name, o.phone, o.address, o.city, o.zip_code, o.total_amount, o.status, o.created_at]);
    } catch (e) { if(!e.message.includes('duplicate key')) console.error(e.message); }
  }
  console.log(`Migrated ${orders.length} orders.`);

  const orderItems = await sqliteDb.all('SELECT * FROM order_items');
  for (const oi of orderItems) {
    try {
      await pgDb.run('INSERT INTO order_items (id, order_id, product_variant_id, product_name, size, color, quantity, price_at_purchase) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
        [oi.id, oi.order_id, oi.product_variant_id, oi.product_name, oi.size, oi.color, oi.quantity, oi.price_at_purchase]);
    } catch (e) { if(!e.message.includes('duplicate key')) console.error(e.message); }
  }
  console.log(`Migrated ${orderItems.length} order items.`);

  // 9. Migrate Hero Slides
  const slides = await sqliteDb.all('SELECT * FROM hero_slides');
  for (const s of slides) {
    let newUrl = s.image_url;
    if (newUrl.startsWith('/uploads/')) {
      newUrl = getPublicUrl(newUrl.replace('/uploads/', ''));
    }
    try {
      await pgDb.run('INSERT INTO hero_slides (id, image_url, title, subtitle, link_url, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [s.id, newUrl, s.title, s.subtitle, s.link_url, s.display_order, s.is_active]);
    } catch (e) { if(!e.message.includes('duplicate key')) console.error(e.message); }
  }
  console.log(`Migrated ${slides.length} hero slides.`);

  // Reset PostgreSQL sequence counters so new inserts don't fail
  console.log('Resetting sequences...');
  await pgDb.exec(`
    SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
    SELECT setval('admin_users_id_seq', (SELECT MAX(id) FROM admin_users));
    SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
    SELECT setval('product_variants_id_seq', (SELECT MAX(id) FROM product_variants));
    SELECT setval('product_images_id_seq', (SELECT MAX(id) FROM product_images));
    SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));
    SELECT setval('order_items_id_seq', (SELECT MAX(id) FROM order_items));
    SELECT setval('hero_slides_id_seq', (SELECT MAX(id) FROM hero_slides));
  `).catch(e => console.log('Sequence reset:', e.message));

  console.log('--- MIGRATION COMPLETE! ---');
  process.exit(0);
}

migrate();
