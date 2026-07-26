const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { Client } = require('pg');
const path = require('path');

const POSTGRES_URL = "postgres://postgres.vqzagnqoxmlffhjbnrxp:AuR6EHZxydxQjBIk@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

// Helper to convert SQLite type to Postgres type
function getPgType(sqliteType) {
  if (!sqliteType) return 'TEXT';
  const t = sqliteType.toUpperCase();
  if (t.includes('INTEGER PRIMARY KEY AUTOINCREMENT')) return 'SERIAL PRIMARY KEY';
  if (t.includes('INTEGER')) return 'INTEGER';
  if (t.includes('REAL')) return 'DOUBLE PRECISION';
  if (t.includes('BOOLEAN')) return 'BOOLEAN';
  if (t.includes('DATETIME')) return 'TIMESTAMP';
  return 'TEXT';
}

async function migrate() {
  console.log('Connecting to Postgres...');
  const pgClient = new Client({ connectionString: POSTGRES_URL });
  await pgClient.connect();
  console.log('Connected to Postgres.');

  const dbPath = path.resolve(__dirname, 'database.sqlite');
  console.log('Connecting to SQLite:', dbPath);
  const sqliteDb = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  let tables = await sqliteDb.all("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  
  // Sort tables to create base tables first to satisfy foreign keys
  tables.sort((a, b) => {
    const baseTables = ['users', 'products', 'shipping_providers'];
    const aIsBase = baseTables.includes(a.name);
    const bIsBase = baseTables.includes(b.name);
    
    if (aIsBase && !bIsBase) return -1;
    if (!aIsBase && bIsBase) return 1;
    if (a.name === 'orders') return -1;
    if (b.name === 'orders') return 1;
    return 0;
  });
  
  for (const table of tables) {
    console.log(`\nMigrating table: ${table.name}`);
    
    let pgSql = table.sql
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/ig, 'SERIAL PRIMARY KEY')
      .replace(/DATETIME/ig, 'TIMESTAMP')
      .replace(/BOOLEAN DEFAULT 0/ig, 'BOOLEAN DEFAULT false')
      .replace(/BOOLEAN DEFAULT 1/ig, 'BOOLEAN DEFAULT true')
      .replace(/BOOLEAN/ig, 'BOOLEAN')
      .replace(/REAL/ig, 'DOUBLE PRECISION');
      
    try {
      await pgClient.query(`DROP TABLE IF EXISTS ${table.name} CASCADE`);
      await pgClient.query(pgSql);
      console.log(`Created table ${table.name}`);
      
      const rows = await sqliteDb.all(`SELECT * FROM ${table.name}`);
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]);
        const colsStr = columns.map(c => `"${c}"`).join(', ');
        
        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          let valIndex = 1;
          const values = [];
          const placeholders = batch.map(row => {
            const rowPlaceholders = columns.map(() => `$${valIndex++}`).join(', ');
            columns.forEach(col => values.push(row[col]));
            return `(${rowPlaceholders})`;
          }).join(', ');
          
          await pgClient.query(`INSERT INTO ${table.name} (${colsStr}) VALUES ${placeholders}`, values);
        }
        console.log(`Inserted ${rows.length} rows into ${table.name}`);
        
        if (columns.includes('id')) {
          await pgClient.query(`SELECT setval(pg_get_serial_sequence('${table.name}', 'id'), COALESCE((SELECT MAX(id)+1 FROM ${table.name}), 1), false)`);
        }
      }
    } catch (e) {
      console.error(`Error migrating table ${table.name}:`, e.message);
    }
  }

  await sqliteDb.close();
  await pgClient.end();
  console.log('Migration complete!');
}

migrate().catch(console.error);
