const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.vqzagnqoxmlffhjbnrxp:AuR6EHZxydxQjBIk@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  phone TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  google_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT,
  facebook_link TEXT,
  recovery_pin TEXT,
  security_question TEXT,
  security_question_text TEXT,
  token_version INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_price REAL NOT NULL,
  sale_price REAL,
  fabric TEXT,
  sku TEXT,
  category TEXT DEFAULT 'home',
  low_stock_threshold INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  out_of_stock_date TIMESTAMP,
  ever_stocked BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  zip_code TEXT,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'Pending',
  tracking_number TEXT,
  courier_id INTEGER,
  shipped_at TIMESTAMP,
  area TEXT,
  payment_method TEXT,
  order_notes TEXT,
  shipping_cost REAL,
  cod_fee REAL,
  discount REAL,
  payment_status TEXT,
  payment_proof_image TEXT,
  tracking_token TEXT,
  transaction_reference TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL,
  price_at_purchase REAL NOT NULL,
  product_image TEXT
);

CREATE TABLE IF NOT EXISTS wishlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  about_text TEXT,
  phone1 TEXT,
  phone2 TEXT,
  email TEXT,
  address TEXT,
  logo_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  whatsapp_number TEXT,
  business_name TEXT,
  header_text TEXT,
  favicon_url TEXT
);

CREATE TABLE IF NOT EXISTS main_menu_items (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  parent_id INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hero_slides (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  merchant_id TEXT,
  store_id TEXT,
  integrity_salt TEXT,
  callback_url TEXT,
  environment TEXT DEFAULT 'production',
  last_tested_at TIMESTAMP,
  last_test_result TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipping_settings (
  id SERIAL PRIMARY KEY,
  zone TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  flat_rate REAL DEFAULT 0,
  free_shipping_enabled BOOLEAN DEFAULT FALSE,
  free_shipping_min REAL DEFAULT 0,
  cod_enabled BOOLEAN DEFAULT TRUE,
  delivery_time TEXT,
  order_tracking BOOLEAN DEFAULT FALSE,
  default_courier TEXT,
  cod_fee REAL DEFAULT 0,
  api_integration_enabled BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS shipping_providers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT,
  secret_key TEXT,
  account_id TEXT,
  shipper_id TEXT,
  base_url TEXT,
  environment TEXT DEFAULT 'production',
  status TEXT DEFAULT 'active',
  last_tested_at TIMESTAMP,
  last_test_result TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  account_number TEXT,
  tracking_url_format TEXT
);

CREATE TABLE IF NOT EXISTS shipment_tracking (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  provider_id INTEGER REFERENCES shipping_providers(id),
  tracking_number TEXT NOT NULL,
  status TEXT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_settings (
  id SERIAL PRIMARY KEY,
  cod_enabled BOOLEAN DEFAULT TRUE,
  bank_transfer_enabled BOOLEAN DEFAULT FALSE,
  bank_name TEXT,
  account_title TEXT,
  account_number TEXT,
  iban TEXT,
  branch_name TEXT,
  bank_accounts TEXT DEFAULT '[]',
  jazzcash_enabled BOOLEAN DEFAULT FALSE,
  jazzcash_title TEXT,
  jazzcash_number TEXT,
  easypaisa_enabled BOOLEAN DEFAULT FALSE,
  easypaisa_title TEXT,
  easypaisa_number TEXT,
  sadapay_enabled BOOLEAN DEFAULT FALSE,
  sadapay_title TEXT,
  sadapay_number TEXT,
  nayapay_enabled BOOLEAN DEFAULT FALSE,
  nayapay_title TEXT,
  nayapay_number TEXT
);

CREATE TABLE IF NOT EXISTS payment_gateways (
  id SERIAL PRIMARY KEY,
  gateway_name TEXT NOT NULL,
  api_key TEXT,
  secret_key TEXT,
  mode TEXT DEFAULT 'test',
  status TEXT DEFAULT 'Inactive'
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  reference_id TEXT,
  status TEXT DEFAULT 'Pending',
  raw_response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id SERIAL PRIMARY KEY,
  admin_username TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  action TEXT NOT NULL,
  details TEXT,
  order_id INTEGER,
  admin_user TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  display_name TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending',
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function initPg() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    console.log("Executing schema...");
    await client.query(schema);
    
    // Insert default admin if not exists
    const adminRes = await client.query("SELECT id FROM admin_users WHERE username = 'admin'");
    if (adminRes.rowCount === 0) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('password123', 10);
      await client.query("INSERT INTO admin_users (username, password) VALUES ('admin', $1)", [hash]);
      console.log("Default admin created.");
    }

    // Insert default payment settings
    const payRes = await client.query("SELECT id FROM payment_settings WHERE id = 1");
    if (payRes.rowCount === 0) {
      await client.query("INSERT INTO payment_settings (id, cod_enabled, bank_transfer_enabled) VALUES (1, true, false)");
    }
    
    // Insert default shipping settings
    const shipRes = await client.query("SELECT id FROM shipping_settings WHERE id = 1");
    if (shipRes.rowCount === 0) {
      await client.query("INSERT INTO shipping_settings (id, zone, flat_rate) VALUES (1, 'Pakistan', 250)");
    }
    
    // Insert default settings
    const setRes = await client.query("SELECT id FROM settings WHERE id = 1");
    if (setRes.rowCount === 0) {
      await client.query("INSERT INTO settings (id, business_name) VALUES (1, 'Libas Store')");
    }
    
    console.log("Database initialized successfully!");
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

initPg();
