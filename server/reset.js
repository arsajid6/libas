const { getDb } = require('./db');
const bcrypt = require('bcryptjs');

async function reset() {
  const db = await getDb();
  const hash = await bcrypt.hash('123', 10);
  await db.run("UPDATE admin_users SET password = ? WHERE username = 'admin'", [hash]);
  
  // also add a dummy product 1 if it doesn't exist so wishlist works
  await db.run("INSERT OR IGNORE INTO products (id, title, description, price, slug, category_id) VALUES (1, 'Test Product', 'Desc', 10.0, 'test-product', 1)");
  console.log("Reset done");
}

reset();
