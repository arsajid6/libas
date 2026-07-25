const dbReq = require('./server/db.js');
dbReq.getDb().then(db => {
  db.run(`UPDATE payment_settings SET bank_name = '', account_title = '', account_number = '', iban = '', branch_name = '', bank_accounts = '[]' WHERE id = 1`)
    .then(() => console.log('Fixed DB'));
});
