const fs = require('fs');
const init = fs.readFileSync('init_pg.js', 'utf8');
const index = fs.readFileSync('index.js', 'utf8');
const admin = fs.readFileSync('routes/admin.js', 'utf8');
const user = fs.readFileSync('routes/user.js', 'utf8');
const auth = fs.readFileSync('routes/auth.js', 'utf8');

const allCode = index + admin + user + auth;
const tables = ['users', 'products', 'product_variants', 'categories', 'orders', 'order_items', 'wishlists', 'product_reviews', 'couriers', 'settings'];

tables.forEach(table => {
  console.log('--- ' + table + ' ---');
  const insertRegex = new RegExp(`INSERT INTO ${table}\\s*\\(([^)]+)\\)`, 'gi');
  let match;
  while ((match = insertRegex.exec(allCode)) !== null) {
    console.log('Insert uses:', match[1].replace(/\s+/g, ' '));
  }
});
