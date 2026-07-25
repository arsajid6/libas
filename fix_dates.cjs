const fs = require('fs');
const files = [
  'src/components/CustomerReviews.jsx',
  'src/pages/admin/AdminPayments.jsx',
  'src/pages/admin/AdminShipping.jsx',
  'src/pages/admin/AuditLogs.jsx',
  'src/pages/admin/Backups.jsx',
  'src/pages/admin/OrderTracker.jsx',
  'src/pages/admin/SecurityLogs.jsx',
  'src/pages/admin/StockAlerts.jsx',
  'src/pages/GuestOrderTracking.jsx',
  'src/pages/Profile.jsx',
  'src/pages/Shop.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    content = content.replace(/ \+ 'Z'/g, '');
    content = content.replace(/\+ 'Z'/g, '');
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed:', file);
    }
  }
});
