const { Client } = require('pg');
const client = new Client('postgresql://postgres.vqzagnqoxmlffhjbnrxp:AuR6EHZxydxQjBIk@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres');

async function applyFinalFixes() {
  await client.connect();
  try {
    console.log("Applying final deep audit fixes...");

    // 1. Rename wishlist to wishlists
    try {
      await client.query('ALTER TABLE wishlist RENAME TO wishlists');
      console.log("Renamed wishlist to wishlists.");
    } catch(e) { console.log("Rename wishlist:", e.message); }

    // 2. hero_slides
    await client.query('ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS display_order INTEGER');

    // 3. audit_logs
    await client.query('ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS order_id INTEGER');
    await client.query('ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS admin_user TEXT');

    // 4. settings
    // First, let's see if setting_key exists, if not we might need to recreate settings table or just add it
    // Wait, the settings table might already have data that conflicts if we add UNIQUE without dropping old.
    // Let's just add the columns
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS setting_key TEXT UNIQUE');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS setting_value TEXT');

    // 5. shipping_providers
    const shippingCols = [
      'provider_name TEXT', 'secret_key TEXT', 'account_id TEXT',
      'shipper_id TEXT', 'base_url TEXT', 'environment TEXT',
      'status TEXT', 'last_tested_at TIMESTAMP', 'last_test_result TEXT'
    ];
    for (let c of shippingCols) {
      await client.query(`ALTER TABLE shipping_providers ADD COLUMN IF NOT EXISTS ${c}`);
    }

    // 6. payment_gateways
    const paymentCols = [
      'merchant_id TEXT', 'store_id TEXT', 'integrity_salt TEXT',
      'callback_url TEXT', 'environment TEXT', 'last_tested_at TIMESTAMP', 'last_test_result TEXT'
    ];
    for (let c of paymentCols) {
      await client.query(`ALTER TABLE payment_gateways ADD COLUMN IF NOT EXISTS ${c}`);
    }

    // 7. security_logs
    await client.query('ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS ip TEXT');
    await client.query('ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS user_identifier TEXT');

    console.log("All deep audit fixes applied successfully.");
  } catch(e) { console.error("Error applying fixes:", e.message); }
  await client.end();
}
applyFinalFixes();
