const { Client } = require('pg');
const client = new Client('postgresql://postgres.vqzagnqoxmlffhjbnrxp:AuR6EHZxydxQjBIk@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres');
async function run() {
  await client.connect();
  try {
    await client.query("UPDATE shipping_settings SET delivery_time = '3-5 Working Days' WHERE id = 1");
    console.log('Updated delivery_time');
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
run();
