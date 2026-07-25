const { Client } = require('pg');
const client = new Client('postgresql://postgres.vqzagnqoxmlffhjbnrxp:AuR6EHZxydxQjBIk@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres');
async function run() {
  await client.connect();
  try {
    const res = await client.query("SELECT pv.* FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE p.name ILIKE '%Silk Jamawar Suit%'");
    console.log(res.rows);
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
run();
