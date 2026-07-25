const { Client } = require('pg');
const client = new Client('postgresql://postgres.vqzagnqoxmlffhjbnrxp:AuR6EHZxydxQjBIk@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres');
async function fixOrders() {
  await client.connect();
  try {
    const columns = [
      'area TEXT',
      'payment_method TEXT',
      'order_notes TEXT',
      'shipping_cost REAL',
      'cod_fee REAL',
      'discount REAL',
      'payment_status TEXT',
      'payment_proof_image TEXT',
      'tracking_token TEXT',
      'transaction_reference TEXT'
    ];
    for (let col of columns) {
      const query = `ALTER TABLE orders ADD COLUMN IF NOT EXISTS ${col}`;
      await client.query(query);
    }
    console.log('Added missing columns to orders');
  } catch(e) { console.log(e.message); }
  await client.end();
}
fixOrders();
