const pg = require('pg');
const { Pool } = pg;

// Force pg to parse timestamp without time zone as UTC
pg.types.setTypeParser(1114, function(stringValue) {
  return new Date(stringValue + 'Z');
});

const DATABASE_URL = 'postgresql://postgres.vqzagnqoxmlffhjbnrxp:AuR6EHZxydxQjBIk@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20, // max connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

// Helper function to convert SQLite ? to PG $1, $2, etc.
function convertSql(sql) {
  let i = 1;
  let pgSql = sql.replace(/\?/g, () => `$${i++}`);
  
  // Postgres boolean compatibility
  pgSql = pgSql.replace(/is_primary = 0/gi, 'is_primary = false');
  pgSql = pgSql.replace(/is_primary = 1/gi, 'is_primary = true');
  pgSql = pgSql.replace(/is_active = 0/gi, 'is_active = false');
  pgSql = pgSql.replace(/is_active = 1/gi, 'is_active = true');
  pgSql = pgSql.replace(/is_verified = 0/gi, 'is_verified = false');
  pgSql = pgSql.replace(/is_verified = 1/gi, 'is_verified = true');

  // sqlite date function polyfill where applicable
  pgSql = pgSql.replace(/datetime\('now'\)/gi, 'NOW()');
  pgSql = pgSql.replace(/date\('now'\)/gi, 'CURRENT_DATE');
  
  // sqlite COLLATE NOCASE -> postgres ILIKE
  pgSql = pgSql.replace(/LIKE\s+\$([0-9]+)\s+COLLATE\s+NOCASE/gi, 'ILIKE $$$1');
  pgSql = pgSql.replace(/LIKE\s+'([^']+)'\s+COLLATE\s+NOCASE/gi, "ILIKE '$1'");
  
  return pgSql;
}

module.exports = {
  getDb: async () => {
    return {
      all: async (sql, params) => {
        const client = await pool.connect();
        try {
          const res = await client.query(convertSql(sql, params), params);
          return res.rows;
        } catch (e) {
          console.error('DB ALL Error:', e.message, 'SQL:', convertSql(sql, params), 'Params:', params);
          throw e;
        } finally {
          client.release();
        }
      },
      get: async (sql, params) => {
        const client = await pool.connect();
        try {
          const res = await client.query(convertSql(sql, params), params);
          return res.rows[0];
        } catch (e) {
          console.error('DB GET Error:', e.message, 'SQL:', convertSql(sql, params), 'Params:', params);
          throw e;
        } finally {
          client.release();
        }
      },
      run: async (sql, params) => {
        const client = await pool.connect();
        try {
          // If insert, try to simulate lastID
          let pgSql = convertSql(sql, params);
          if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
             pgSql += ' RETURNING id';
          }
          const res = await client.query(pgSql, params);
          return {
            changes: res.rowCount,
            lastID: res.rows && res.rows[0] ? res.rows[0].id : null
          };
        } catch (e) {
          console.error('DB RUN Error:', e.message, 'SQL:', convertSql(sql, params), 'Params:', params);
          throw e;
        } finally {
          client.release();
        }
      },
      exec: async (sql) => {
        const client = await pool.connect();
        try {
          await client.query(sql);
        } catch (e) {
          console.error('DB EXEC Error:', e.message);
          throw e;
        } finally {
          client.release();
        }
      }
    };
  },

  fetchRelationsForProducts: async (db, products) => {
    if (!products || products.length === 0) return;
    const ids = products.map(p => p.id);
    const placeholders = ids.map(() => '?').join(',');
    
    const images = await db.all(`SELECT * FROM product_images WHERE product_id IN (${placeholders})`, ids);
    const variants = await db.all(`SELECT * FROM product_variants WHERE product_id IN (${placeholders})`, ids);
    
    const imgMap = {};
    const varMap = {};
    for (let img of images) {
      if (!imgMap[img.product_id]) imgMap[img.product_id] = [];
      imgMap[img.product_id].push(img);
    }
    for (let v of variants) {
      if (!varMap[v.product_id]) varMap[v.product_id] = [];
      varMap[v.product_id].push(v);
    }
    
    for (let p of products) {
      const pImages = imgMap[p.id] || [];
      const pVariants = varMap[p.id] || [];
      
      const sizesSet = new Set();
      const colorsSet = new Set();
      
      pVariants.forEach(v => {
        if (v.size && v.size.trim() !== '') sizesSet.add(v.size);
        if (v.color && v.color.trim() !== '') colorsSet.add(v.color);
      });
      
      p.images = pImages;
      p.variants = pVariants;
      p.sizes = Array.from(sizesSet);
      p.colors = Array.from(colorsSet);
    }
  }
};
