const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('DELETE FROM main_menu_items', function(err) {
    if (err) console.error(err);
    else console.log(`Deleted all ${this.changes} menus from main_menu_items table.`);
    db.close();
  });
});
