const { Client } = require('pg');
const client = new Client('postgresql://postgres.vqzagnqoxmlffhjbnrxp:AuR6EHZxydxQjBIk@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres');
async function fix() {
  await client.connect();
  
  try {
    await client.query('ALTER TABLE main_menu_items RENAME COLUMN display_order TO sort_order;');
    console.log('Renamed main_menu_items');
  } catch(e) { console.log(e.message); }

  try {
    await client.query('ALTER TABLE hero_slides RENAME COLUMN display_order TO sort_order;');
    console.log('Renamed hero_slides');
  } catch(e) { console.log(e.message); }
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        id SERIAL PRIMARY KEY,
        store_name TEXT NOT NULL,
        currency TEXT DEFAULT 'PKR',
        tax_rate REAL DEFAULT 0,
        contact_email TEXT,
        contact_phone TEXT,
        address TEXT
      );
    `);
    
    // Check if store_settings has row id=1
    const res = await client.query('SELECT id FROM store_settings WHERE id = 1');
    if (res.rowCount === 0) {
      await client.query("INSERT INTO store_settings (id, store_name) VALUES (1, 'Libas')");
    }

    console.log('Created store_settings');
  } catch(e) { console.log(e.message); }

  await client.end();
}
fix();
