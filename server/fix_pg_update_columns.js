const { Client } = require('pg');
const client = new Client('postgresql://postgres.vqzagnqoxmlffhjbnrxp:AuR6EHZxydxQjBIk@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres');

async function fixMissingUpdateColumns() {
  await client.connect();
  try {
    // products
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP');

    // orders
    const orderCols = [
      'api_sync_status TEXT', 'api_sync_error TEXT', 'courier_name TEXT', 'tracking_url TEXT',
      'shipment_status TEXT', 'last_tracking_update TIMESTAMP', 'payment_verification_status TEXT',
      'payment_verification_date TIMESTAMP', 'payment_verified_by INTEGER', 'cod_settlement_status TEXT'
    ];
    for (const c of orderCols) await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ${c}`);

    // admin_users
    const adminCols = [
      'username TEXT', 'email TEXT', 'facebook_link TEXT', 'recovery_pin TEXT',
      'security_question TEXT', 'security_question_text TEXT', 'token_version INTEGER DEFAULT 1'
    ];
    for (const c of adminCols) await client.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS ${c}`);

    // shipping_settings
    const shipCols = [
      'status TEXT', 'free_shipping_enabled BOOLEAN', 'free_shipping_min REAL',
      'cod_enabled BOOLEAN', 'delivery_time TEXT', 'order_tracking BOOLEAN',
      'default_courier TEXT', 'cod_fee REAL', 'api_integration_enabled BOOLEAN'
    ];
    for (const c of shipCols) await client.query(`ALTER TABLE shipping_settings ADD COLUMN IF NOT EXISTS ${c}`);

    // store_settings (it might be named settings in init_pg.js)
    const storeCols = [
      'phone TEXT', 'email TEXT', 'address TEXT', 'facebook_link TEXT',
      'instagram_link TEXT', 'tiktok_link TEXT', 'timing_text TEXT'
    ];
    // try to add to settings first
    try {
        for (const c of storeCols) await client.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS ${c}`);
    } catch(e) { console.log(e.message); }

    try {
        for (const c of storeCols) await client.query(`ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS ${c}`);
    } catch(e) {}

    // payment_settings
    const payCols = [
      'bank_name TEXT', 'account_title TEXT', 'account_number TEXT',
      'iban TEXT', 'branch_name TEXT', 'bank_accounts TEXT'
    ];
    for (const c of payCols) await client.query(`ALTER TABLE payment_settings ADD COLUMN IF NOT EXISTS ${c}`);
    
    console.log('Successfully added all missing columns for UPDATE queries.');
  } catch(e) { console.log(e.message); }
  await client.end();
}
fixMissingUpdateColumns();
