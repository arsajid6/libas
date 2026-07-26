const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

async function exportSchema() {
  const dbPath = path.resolve(__dirname, 'database.sqlite');
  console.log('Connecting to', dbPath);
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  const tables = await db.all("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  console.log('Found tables:', tables.length);
  
  let schema = '';
  for (const table of tables) {
    schema += `-- Table: ${table.name}\n${table.sql};\n\n`;
  }
  
  fs.writeFileSync('schema.sql', schema);
  console.log('Schema exported to schema.sql');
}
exportSchema();
