const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client('postgresql://postgres.vqzagnqoxmlffhjbnrxp:AuR6EHZxydxQjBIk@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules')) results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js')) results.push(file);
    }
  });
  return results;
}

async function deepAudit() {
  await client.connect();
  try {
    // 1. Get live schema
    const res = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
    `);
    
    const dbSchema = {};
    res.rows.forEach(row => {
      if (!dbSchema[row.table_name]) dbSchema[row.table_name] = new Set();
      dbSchema[row.table_name].add(row.column_name.toLowerCase());
    });

    console.log("Live DB Tables:", Object.keys(dbSchema).join(", "));

    // 2. Extract queries from backend
    const files = walk('./server');
    let allCode = '';
    files.forEach(f => { allCode += fs.readFileSync(f, 'utf8') + '\n'; });

    // Try to find INSERT columns
    const insertRegex = /INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)/gi;
    let match;
    const missing = [];
    
    while ((match = insertRegex.exec(allCode)) !== null) {
      const table = match[1].toLowerCase();
      const cols = match[2].split(',').map(c => c.trim().toLowerCase());
      
      if (!dbSchema[table]) {
         missing.push(`Table missing for INSERT: ${table}`);
         continue;
      }
      
      cols.forEach(c => {
         // handle cases like "is_verified", "full_name"
         const cleanCol = c.replace(/[^a-z0-9_]/g, '');
         if (cleanCol && !dbSchema[table].has(cleanCol)) {
            missing.push(`Missing column in ${table}: ${cleanCol} (from INSERT)`);
         }
      });
    }

    // Try to find UPDATE columns
    const updateRegex = /UPDATE\s+(\w+)\s+SET\s+([\s\S]+?)\s+WHERE/gi;
    while ((match = updateRegex.exec(allCode)) !== null) {
      const table = match[1].toLowerCase();
      const setClause = match[2];
      
      if (!dbSchema[table]) {
         missing.push(`Table missing for UPDATE: ${table}`);
         continue;
      }
      
      // Basic split by comma for set clause (not perfect but gets most like col = val)
      const parts = setClause.split(',');
      parts.forEach(p => {
         const colMatch = p.trim().match(/^([a-z0-9_]+)\s*=/i);
         if (colMatch) {
            const cleanCol = colMatch[1].toLowerCase();
            if (cleanCol && !dbSchema[table].has(cleanCol)) {
               missing.push(`Missing column in ${table}: ${cleanCol} (from UPDATE)`);
            }
         }
      });
    }

    console.log("\n--- Audit Results ---");
    if (missing.length === 0) {
      console.log("No missing columns found in INSERT/UPDATE queries!");
    } else {
      console.log(missing.join('\n'));
    }

  } catch(e) { console.error("Error:", e); }
  await client.end();
}

deepAudit();
