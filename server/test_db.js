const { getDb } = require('./db.js');
getDb().then(db => db.all('SELECT * FROM users')).then(console.log).catch(console.error).finally(()=>process.exit());
