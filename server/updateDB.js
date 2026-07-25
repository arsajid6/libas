const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');
db.run('UPDATE products SET category = ? WHERE id IN (51, 52)', ['["new-arrival"]'], (err) => {
  if (err) console.error(err);
  else console.log('Updated');
});
