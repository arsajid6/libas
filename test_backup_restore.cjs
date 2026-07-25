const fs = require('fs');
const path = require('path');
const AdmZip = require('./server/node_modules/adm-zip');
const { getDb } = require('./server/db.js');
const { DB_PATH, UPLOADS_DIR, BACKUPS_DIR, BACKUPS_TEMP_DIR, DATA_DIR } = require('./server/utils/paths.js');

async function getStats(db) {
  const productsCount = await db.get('SELECT COUNT(*) as c FROM products').then(r => r.c);
  const categoriesCount = await db.get('SELECT COUNT(DISTINCT category) as c FROM products').then(r => r.c);
  const customersCount = await db.get('SELECT COUNT(*) as c FROM users').then(r => r.c);
  const ordersCount = await db.get('SELECT COUNT(*) as c FROM orders').then(r => r.c);
  const heroSliderCount = await db.get('SELECT COUNT(*) as c FROM hero_slides').then(r => r ? r.c : 0);
  
  const shippingSettings = await db.get('SELECT * FROM shipping_settings WHERE id = 1');
  const paymentSettings = await db.get('SELECT * FROM payment_settings WHERE id = 1');
  const adminUser = await db.get('SELECT username FROM admin_users ORDER BY id ASC LIMIT 1').then(r => r ? r.username : null);
  
  const sampleProductImage = await db.get('SELECT image_url FROM product_images LIMIT 1').then(r => r ? r.image_url : null);
  
  return {
    productsCount,
    categoriesCount,
    customersCount,
    ordersCount,
    heroSliderCount,
    shippingSettings: shippingSettings ? JSON.stringify(shippingSettings) : null,
    paymentSettings: paymentSettings ? JSON.stringify(paymentSettings) : null,
    adminUser,
    sampleProductImage
  };
}

async function runTest() {
  console.log("=== STARTING BACKUP RESTORE INTEGRITY TEST ===");
  try {
    const db = await getDb();
    
    // 1. Gather initial stats
    console.log("Gathering initial stats...");
    const initialStats = await getStats(db);
    console.log("Initial Stats:", initialStats);

    // 2. Create Backup
    console.log("Creating Backup...");
    const zip = new AdmZip();
    if (fs.existsSync(DB_PATH)) {
      zip.addLocalFile(DB_PATH);
    }
    if (fs.existsSync(UPLOADS_DIR)) {
      zip.addLocalFolder(UPLOADS_DIR, 'uploads');
    }
    const backupFilename = `test-backup-${Date.now()}.zip`;
    const backupFilePath = path.join(BACKUPS_DIR, backupFilename);
    zip.writeZip(backupFilePath);
    console.log("Backup Created at:", backupFilePath);

    // 3. Mutate data to ensure restore works
    console.log("Mutating data to verify restore overrides...");
    await db.run("INSERT INTO products (name, base_price) VALUES ('Temp Test Product', 999)");
    const mutatedCount = await db.get('SELECT COUNT(*) as c FROM products').then(r => r.c);
    console.log(`Products mutated count: ${mutatedCount} (expected ${initialStats.productsCount + 1})`);

    // 4. Restore Backup
    console.log("Restoring Backup...");
    const restoreZip = new AdmZip(backupFilePath);
    
    // Stop DB connections before restore? Since we are just testing, we'll try direct overwrite
    // We can't overwrite the DB file if it's locked by sqlite3, we may need to close it.
    await db.close();

    restoreZip.extractAllTo(DATA_DIR, true);
    console.log("Files extracted.");

    const sqlite3 = require('./server/node_modules/sqlite3');
    const { open } = require('./server/node_modules/sqlite');
    const newDb = await open({ filename: DB_PATH, driver: sqlite3.Database });
    console.log("Gathering post-restore stats...");
    const finalStats = await getStats(newDb);
    console.log("Final Stats:", finalStats);

    // 6. Compare
    let passed = true;
    for (const key in initialStats) {
      if (initialStats[key] !== finalStats[key]) {
        console.error(`MISMATCH on ${key}: Initial=${initialStats[key]}, Final=${finalStats[key]}`);
        passed = false;
      } else {
        console.log(`PASS: ${key} matches.`);
      }
    }

    if (passed) {
      console.log("\n>>> ALL TESTS PASSED! <<<");
    } else {
      console.error("\n>>> SOME TESTS FAILED! <<<");
    }

  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

runTest();
