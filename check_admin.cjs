const { getDb } = require('./server/db');
async function check() {
  const db = await getDb();
  const user = await db.get("SELECT * FROM admin_users WHERE username = 'admin'");
  console.log(user);
}
check();
