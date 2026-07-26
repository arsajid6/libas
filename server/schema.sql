-- Table: admin_users
CREATE TABLE admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , email TEXT, recovery_pin TEXT, security_question TEXT, facebook_link TEXT, security_question_text TEXT, token_version INTEGER DEFAULT 0);

-- Table: products
CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      base_price REAL NOT NULL,
      fabric TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , category TEXT DEFAULT 'home', sale_price REAL, sku TEXT, low_stock_threshold INTEGER DEFAULT NULL, updated_at DATETIME DEFAULT NULL);

-- Table: product_variants
CREATE TABLE product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      size TEXT NOT NULL,
      color TEXT NOT NULL,
      stock_quantity INTEGER DEFAULT 0, ever_stocked INTEGER DEFAULT 0, out_of_stock_date DATETIME,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

-- Table: product_images
CREATE TABLE product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      is_primary BOOLEAN DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

-- Table: orders
CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      zip_code TEXT,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , courier_name TEXT, tracking_number TEXT, tracking_url TEXT, email TEXT, area TEXT, payment_method TEXT DEFAULT 'Cash on Delivery', order_notes TEXT, cod_fee REAL DEFAULT 0, shipping_cost REAL DEFAULT 0, discount REAL DEFAULT 0, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, payment_status TEXT DEFAULT 'Pending', cod_courier_name TEXT, cod_amount REAL, cod_settlement_date DATETIME, cod_settlement_status TEXT DEFAULT 'Pending', api_sync_status TEXT DEFAULT 'Pending', api_sync_error TEXT, payment_proof_image TEXT, payment_gateway_ref TEXT, payment_verification_status TEXT DEFAULT 'Pending Verification', payment_verification_date DATETIME, payment_verified_by TEXT, shipment_status TEXT DEFAULT 'Pending', last_tracking_update DATETIME, tracking_token TEXT, transaction_reference TEXT, payment_submitted_at DATETIME, payment_verified_at DATETIME, payment_rejected_at DATETIME, payment_rejected_by TEXT);

-- Table: order_items
CREATE TABLE order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_variant_id INTEGER,
      product_name TEXT NOT NULL,
      size TEXT,
      color TEXT,
      quantity INTEGER NOT NULL,
      price_at_purchase REAL NOT NULL, product_image TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
    );

-- Table: settings
CREATE TABLE settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL
    );

-- Table: main_menu_items
CREATE TABLE main_menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      link TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

-- Table: hero_slides
CREATE TABLE hero_slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

-- Table: shipping_settings
CREATE TABLE shipping_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zone TEXT DEFAULT 'Pakistan',
      status TEXT DEFAULT 'Active',
      flat_rate REAL DEFAULT 250,
      free_shipping_enabled BOOLEAN DEFAULT 1,
      free_shipping_min REAL DEFAULT 5000,
      cod_enabled BOOLEAN DEFAULT 1,
      delivery_time TEXT DEFAULT '3 to 5 Working Days',
      order_tracking BOOLEAN DEFAULT 1
    , default_courier TEXT DEFAULT 'Leopards', cod_fee REAL DEFAULT 0, api_integration_enabled INTEGER DEFAULT 0);

-- Table: users
CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      phone TEXT,
      is_verified BOOLEAN DEFAULT 0,
      verification_token TEXT,
      google_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

-- Table: wishlist
CREATE TABLE wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    );

-- Table: product_reviews
CREATE TABLE product_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT,
      content TEXT,
      display_name TEXT NOT NULL,
      email TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

-- Table: store_settings
CREATE TABLE store_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT DEFAULT '+92 300 0000000',
      email TEXT DEFAULT 'info@yourstore.com',
      address TEXT DEFAULT 'Your Address, City, Country',
      facebook_link TEXT DEFAULT 'https://facebook.com',
      instagram_link TEXT DEFAULT 'https://instagram.com',
      timing_text TEXT DEFAULT 'Mon - Sun | Online 24/7'
    , tiktok_link TEXT);

-- Table: shipping_providers
CREATE TABLE shipping_providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_name TEXT,
      api_key TEXT,
      secret_key TEXT,
      account_id TEXT,
      shipper_id TEXT,
      base_url TEXT,
      environment TEXT DEFAULT 'Sandbox',
      status TEXT DEFAULT 'Inactive',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , last_tested_at DATETIME, last_test_result TEXT);

-- Table: shipment_tracking
CREATE TABLE shipment_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      provider_id INTEGER,
      tracking_number TEXT,
      shipment_status TEXT,
      tracking_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (provider_id) REFERENCES shipping_providers(id) ON DELETE SET NULL
    );

-- Table: payment_settings
CREATE TABLE payment_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod_enabled BOOLEAN DEFAULT 1,
      bank_transfer_enabled BOOLEAN DEFAULT 1,
      bank_name TEXT DEFAULT '',
      account_title TEXT DEFAULT '',
      account_number TEXT DEFAULT '',
      iban TEXT DEFAULT '',
      branch_name TEXT DEFAULT ''
    , bank_accounts TEXT DEFAULT '[]', jazzcash_enabled BOOLEAN DEFAULT 0, jazzcash_title TEXT DEFAULT '', jazzcash_number TEXT DEFAULT '', easypaisa_enabled BOOLEAN DEFAULT 0, easypaisa_title TEXT DEFAULT '', easypaisa_number TEXT DEFAULT '', sadapay_enabled BOOLEAN DEFAULT 0, sadapay_title TEXT DEFAULT '', sadapay_number TEXT DEFAULT '', nayapay_enabled BOOLEAN DEFAULT 0, nayapay_title TEXT DEFAULT '', nayapay_number TEXT DEFAULT '');

-- Table: payment_gateways
CREATE TABLE payment_gateways (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gateway_name TEXT,
      merchant_id TEXT,
      store_id TEXT,
      api_key TEXT,
      secret_key TEXT,
      integrity_salt TEXT,
      callback_url TEXT,
      environment TEXT DEFAULT 'Sandbox',
      status TEXT DEFAULT 'Inactive',
      last_tested_at DATETIME,
      last_test_result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

-- Table: payment_transactions
CREATE TABLE payment_transactions (
      transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      gateway TEXT,
      amount REAL,
      currency TEXT DEFAULT 'PKR',
      reference_number TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, payment_method TEXT, transaction_reference TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

-- Table: audit_logs
CREATE TABLE audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      action TEXT,
      admin_user TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

-- Table: admin_audit_logs
CREATE TABLE admin_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_username TEXT,
      action TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

-- Table: security_logs
CREATE TABLE security_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT,
      details TEXT,
      ip TEXT,
      user_identifier TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

-- Table: wishlists
CREATE TABLE wishlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

