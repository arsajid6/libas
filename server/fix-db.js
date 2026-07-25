const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');
db.run("UPDATE products SET category = replace(category, 'summer-colletcion', 'summer-collection') WHERE category LIKE '%summer-colletcion%'", function(err) {
  if (err) console.error(err);
  else console.log('Fixed DB typos, rows affected:', this.changes);
});
