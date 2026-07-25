const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const menus = [
  { label: 'HOME', link: '/' },
  { label: 'BEST SELLING', link: '/shop' },
  { label: 'NEW ARRIVAL', link: '/shop' },
  { label: 'SUMMER COLLECTION', link: '/shop' },
  { label: 'READY TO WEAR', link: '/shop' },
  { label: 'UNSTITCHED', link: '/shop' }
];

db.serialize(() => {
  let count = 0;
  for (let i = 0; i < menus.length; i++) {
    db.run(
      'INSERT INTO main_menu_items (label, link, sort_order) VALUES (?, ?, ?)',
      [menus[i].label, menus[i].link, i + 1],
      function(err) {
        if (err) console.error(err);
        else count++;
        
        if (i === menus.length - 1) {
          console.log(`Successfully seeded ${count} menus`);
          db.close();
        }
      }
    );
  }
});
