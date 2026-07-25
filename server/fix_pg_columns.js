const { Client } = require('pg');
const client = new Client('postgresql://postgres.vqzagnqoxmlffhjbnrxp:AuR6EHZxydxQjBIk@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres');
async function fixMissingColumns() {
  await client.connect();
  try {
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5');
    console.log('Added low_stock_threshold to products');

    await client.query('ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS out_of_stock_date TIMESTAMP');
    await client.query('ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS ever_stocked BOOLEAN DEFAULT FALSE');
    console.log('Added columns to product_variants');
    
    // Also add to product_reviews just in case it's not perfectly matching
    await client.query('ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS title TEXT');
    await client.query('ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS content TEXT');
    await client.query('ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS display_name TEXT');
    await client.query('ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS email TEXT');
    await client.query('ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'pending\'');
    
  } catch(e) { console.log(e.message); }
  await client.end();
}
fixMissingColumns();
