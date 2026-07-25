const { Client } = require('pg');
const client = new Client('postgresql://postgres.vqzagnqoxmlffhjbnrxp:AuR6EHZxydxQjBIk@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres');
async function run() {
  await client.connect();
  try {
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status'");
    console.log(res.rows);
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
run();
