const { getDb } = require('./db');

async function fix() {
  try {
    const db = await getDb();
    const menus = await db.all('SELECT * FROM main_menu_items');
    for (let m of menus) {
      if (m.label !== 'HOME' && m.label !== 'SHOP ALL') {
        const cat = m.label.toLowerCase().replace(/\s+/g, '-');
        const link = `/shop?category=${cat}`;
        await db.run('UPDATE main_menu_items SET link = ? WHERE id = ?', [link, m.id]);
      } else if (m.label === 'SHOP ALL') {
        await db.run('UPDATE main_menu_items SET link = ? WHERE id = ?', ['/shop', m.id]);
      }
    }
    console.log('Menus fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
