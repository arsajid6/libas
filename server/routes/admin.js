const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getDb, fetchRelationsForProducts } = require('../db');
const { DATA_DIR, DB_PATH, UPLOADS_DIR, BACKUPS_DIR, BACKUPS_TEMP_DIR } = require('../utils/paths');
const CourierEngine = require('../couriers/index');
const PaymentEngine = require('../payments/index');
const { sendShipmentUpdateEmail } = require('../utils/email');

router.post('/logout', async (req, res) => {
  try {
    const db = await getDb();
    // Increment token_version to invalidate existing tokens
    await db.run('UPDATE admin_users SET token_version = token_version + 1 WHERE id = ?', [req.user.id]);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // Must be 256 bits (32 characters)
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return text;
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return text;
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const SupabaseStorage = require('../utils/supabaseStorage');
const storage = new SupabaseStorage({ bucket: 'images' });
const upload = multer({ storage: storage });

router.get('/verify-token', (req, res) => {
  res.json({ valid: true });
});

router.get('/stats', async (req, res) => {
  try {
    const db = await getDb();
    const productCount = await db.get('SELECT COUNT(*) as count FROM products');
    const orderCount = await db.get('SELECT COUNT(*) as count FROM orders');
    const revenue = await db.get("SELECT SUM(total_amount) as total FROM orders WHERE status != 'Cancelled'");
    const recentOrders = await db.all("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5");

    res.json({
      totalProducts: productCount.count || 0,
      totalOrders: orderCount.count || 0,
      revenue: revenue.total || 0,
      recentOrders: recentOrders || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/products', async (req, res) => {
  try {
    const db = await getDb();
    const category = req.query.category;
    let products;
    if (category && category.toLowerCase() !== 'all' && category.toLowerCase() !== 'shop-all') {
      products = await db.all('SELECT * FROM products WHERE category LIKE ? COLLATE NOCASE ORDER BY created_at DESC', [`%${category.toLowerCase()}%`]);
    } else {
      products = await db.all('SELECT * FROM products ORDER BY created_at DESC');
    }
    
    await fetchRelationsForProducts(db, products);
    
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/products', upload.array('images', 5), async (req, res) => {
  try {
    const db = await getDb();
    await db.run('BEGIN TRANSACTION');

    const { name, description, base_price, sale_price, fabric, sku, categories, low_stock_threshold, variants } = req.body;
    
    const productResult = await db.run(
      'INSERT INTO products (name, description, base_price, sale_price, fabric, sku, category, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, base_price, sale_price || null, fabric, sku, categories || '["home"]', low_stock_threshold || null]
    );
    const productId = productResult.lastID;

    if (variants) {
      const parsedVariants = JSON.parse(variants);
      for (const variant of parsedVariants) {
        const stockQty = Number(variant.stock_quantity || variant.stock || 0);
        await db.run(
          'INSERT INTO product_variants (product_id, size, color, stock_quantity, out_of_stock_date, ever_stocked) VALUES (?, ?, ?, ?, ?, ?)',
          [productId, variant.size, variant.color, stockQty, stockQty === 0 ? new Date().toISOString() : null, stockQty > 0 ? 1 : 0]
        );
      }
    }

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = file.filename; // Now holds absolute Supabase URL
        const isPrimary = i === 0 ? 1 : 0;
        await db.run(
          'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
          [productId, imageUrl, isPrimary]
        );
      }
    }

    await db.run('COMMIT');
    res.status(201).json({ message: 'Product created successfully', id: productId });
  } catch (error) {
    const db = await getDb();
    await db.run('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/products/:id', upload.array('images', 5), async (req, res) => {
  try {
    const db = await getDb();
    await db.run('BEGIN TRANSACTION');

    const { name, description, base_price, sale_price, fabric, sku, categories, low_stock_threshold, variants } = req.body;
    const productId = req.params.id;

    await db.run(
      'UPDATE products SET name = ?, description = ?, base_price = ?, sale_price = ?, fabric = ?, sku = ?, category = ?, low_stock_threshold = ? WHERE id = ?',
      [name, description, base_price, sale_price || null, fabric, sku, categories || '["home"]', low_stock_threshold || null, productId]
    );

    if (variants) {
      const parsedVariants = JSON.parse(variants);
      const oldVariants = await db.all('SELECT * FROM product_variants WHERE product_id = ?', [productId]);
      
      await db.run('DELETE FROM product_variants WHERE product_id = ?', [productId]);
      
      for (const variant of parsedVariants) {
        const stockQty = Number(variant.stock_quantity || variant.stock || 0);
        
        let outOfStockDate = stockQty === 0 ? new Date().toISOString() : null;
        let everStocked = stockQty > 0 ? 1 : 0;
        
        if (stockQty === 0) {
          // Check if it was already out of stock before to preserve the date
          const oldVar = oldVariants.find(ov => ov.size === variant.size && ov.color === variant.color);
          if (oldVar) {
            everStocked = (oldVar.ever_stocked === 1 || oldVar.ever_stocked === true || oldVar.ever_stocked === 'true') ? 1 : 0;
            if (oldVar.stock_quantity === 0 && oldVar.out_of_stock_date) {
              outOfStockDate = oldVar.out_of_stock_date;
            }
          }
        }

        await db.run(
          'INSERT INTO product_variants (product_id, size, color, stock_quantity, out_of_stock_date, ever_stocked) VALUES (?, ?, ?, ?, ?, ?)',
          [productId, variant.size, variant.color, stockQty, outOfStockDate, everStocked]
        );
      }
    }

    // Images update logic not fully implemented yet in UI for edit, but keep structure ready
    if (req.files && req.files.length > 0) {
      await db.run('DELETE FROM product_images WHERE product_id = ?', [productId]);
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = file.filename;
        const isPrimary = i === 0 ? 1 : 0;
        await db.run(
          'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
          [productId, imageUrl, isPrimary]
        );
      }
    }

    await db.run('COMMIT');
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    const db = await getDb();
    await db.run('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const db = await getDb();
    const orders = await db.all('SELECT * FROM orders ORDER BY created_at DESC');
    for (let o of orders) {
      o.items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
    }
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.put('/orders/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { status, courier_name, tracking_number, tracking_url } = req.body;
    await db.run(
      'UPDATE orders SET status = ?, courier_name = ?, tracking_number = ?, tracking_url = ? WHERE id = ?', 
      [status, courier_name || null, tracking_number || null, tracking_url || null, req.params.id]
    );
    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ==========================================
// SETTINGS ROUTES
// ==========================================

router.put('/orders/:id/settlement', async (req, res) => {
  try {
    const db = await getDb();
    const { payment_status, cod_settlement_status } = req.body;
    await db.run(
      'UPDATE orders SET payment_status = ?, cod_settlement_status = ? WHERE id = ?', 
      [payment_status || 'Pending', cod_settlement_status || 'Pending', req.params.id]
    );
    res.json({ message: 'Order settlement updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update order settlement' });
  }
});

router.put('/orders/:id/tracking', async (req, res) => {
  try {
    const db = await getDb();
    const { courier_name, tracking_number, tracking_url, shipment_status } = req.body;
    
    const existingOrder = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await db.run(
      'UPDATE orders SET courier_name = ?, tracking_number = ?, tracking_url = ?, shipment_status = ?, last_tracking_update = CURRENT_TIMESTAMP WHERE id = ?',
      [courier_name, tracking_number, tracking_url, shipment_status || existingOrder.shipment_status || 'Pending', req.params.id]
    );

    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    
    // Send email if shipment status changed
    if (updatedOrder && updatedOrder.email && updatedOrder.shipment_status !== existingOrder.shipment_status) {
      const triggerStatuses = ['Packed', 'Shipped', 'In Transit', 'Delivered'];
      if (triggerStatuses.includes(updatedOrder.shipment_status)) {
        sendShipmentUpdateEmail(updatedOrder).catch(err => console.error('Failed to send email:', err));
      }
    }

    res.json({ success: true, message: 'Tracking information updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update tracking information' });
  }
});

router.delete('/orders/:id', async (req, res) => {
  try {
    const db = await getDb();
    const orderId = req.params.id;
    
    const existingOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    await db.run('BEGIN TRANSACTION');
    
    // Order items have ON DELETE CASCADE in schema, but we can do it explicitly just in case, or rely on schema.
    // We will rely on schema foreign key or explicit delete. Let's explicit delete to be safe.
    await db.run('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    await db.run('DELETE FROM orders WHERE id = ?', [orderId]);
    
    const adminUser = req.user.username || 'Admin';
    await db.run(
      'INSERT INTO admin_audit_logs (admin_username, action, details) VALUES (?, ?, ?)',
      [adminUser, 'Deleted Order', `Deleted Order #${orderId}`]
    );
    
    await db.run('COMMIT');
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    const db = await getDb();
    await db.run('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
});

router.post('/orders/:id/verify-payment', async (req, res) => {
  try {
    const db = await getDb();
    const { action } = req.body;
    const adminUser = req.user.username || 'Admin';

    if (action !== 'Approve' && action !== 'Reject') {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.payment_verification_status === 'Approved' || order.payment_verification_status === 'Rejected') {
      return res.status(400).json({ success: false, message: 'Order payment has already been verified' });
    }

    let orderStatus = '';
    let paymentStatus = '';
    let verificationStatus = '';

    if (action === 'Approve') {
      orderStatus = 'Confirmed';
      paymentStatus = 'Paid';
      verificationStatus = 'Approved';
    } else {
      orderStatus = 'Payment Failed';
      paymentStatus = 'Failed';
      verificationStatus = 'Rejected';
    }

    await db.run(
      `UPDATE orders SET 
        status = ?, 
        payment_status = ?, 
        payment_verification_status = ?, 
        payment_verification_date = CURRENT_TIMESTAMP, 
        payment_verified_by = ? 
      WHERE id = ?`,
      [orderStatus, paymentStatus, verificationStatus, adminUser, req.params.id]
    );

    await db.run(
      `INSERT INTO audit_logs (order_id, action, admin_user) VALUES (?, ?, ?)`,
      [req.params.id, `${action}d Bank Transfer`, adminUser]
    );

    res.json({ success: true, message: `Payment ${verificationStatus} successfully` });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get('SELECT username, email, facebook_link, recovery_pin, security_question, security_question_text FROM admin_users WHERE id = ?', [req.user.id]);
    
    let settingsRows = [];
    try {
      settingsRows = await db.all('SELECT setting_key, setting_value FROM admin_settings');
    } catch (e) {} // ignore if admin_settings doesn't exist
    const stats = {};
    settingsRows.forEach(row => {
      stats[row.setting_key] = row.setting_value;
    });
    res.json({ user, stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.post('/settings/username', async (req, res) => {
  try {
    const db = await getDb();
    const { currentUsername, newUsername } = req.body;
    const user = await db.get('SELECT * FROM admin_users WHERE id = ?', [req.user.id]);
    if (!user || user.username !== currentUsername) return res.status(400).json({ error: 'Invalid current username' });
    
    // Increment token_version to force re-login after username change
    await db.run('UPDATE admin_users SET username = ?, token_version = token_version + 1 WHERE id = ?', [newUsername, req.user.id]);
    res.json({ message: 'Username updated successfully. Please log in again.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update username' });
  }
});

router.post('/settings/password', async (req, res) => {
  try {
    const db = await getDb();
    const { currentPassword, newPassword } = req.body;
    const user = await db.get('SELECT * FROM admin_users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ error: 'Invalid current password' });
    
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    // Increment token_version to log out all other devices
    await db.run('UPDATE admin_users SET password = ?, token_version = token_version + 1 WHERE id = ?', [hashedNewPassword, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

router.post('/settings/email', async (req, res) => {
  try {
    const db = await getDb();
    const { newEmail, newFacebookLink } = req.body;
    await db.run('UPDATE admin_users SET email = ?, facebook_link = ? WHERE id = ?', [newEmail, newFacebookLink, req.user.id]);
    res.json({ message: 'Email and Facebook updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update email and facebook' });
  }
});

router.post('/settings/stats', async (req, res) => {
  try {
    const db = await getDb();
    const { totalClients, activeProjects } = req.body;
    await db.run('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value', ['total_clients', totalClients]);
    await db.run('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value', ['active_projects', activeProjects]);
    res.json({ message: 'Stats updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

router.get('/orders/pending-count', async (req, res) => {
  try {
    const db = await getDb();
    const count = await db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'Pending'");
    res.json({ count: count.count || 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch pending orders count' });
  }
});

router.post('/settings/security', async (req, res) => {
  try {
    const db = await getDb();
    const { recoveryPin, securityQuestion, securityQuestionText, currentPassword } = req.body;
    
    // Verify password
    const user = await db.get('SELECT * FROM admin_users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(400).json({ error: 'User not found' });
    
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ error: 'Incorrect password' });

    await db.run('UPDATE admin_users SET recovery_pin = ?, security_question = ?, security_question_text = ? WHERE id = ?', [recoveryPin, securityQuestion, securityQuestionText, req.user.id]);
    res.json({ message: 'Security settings updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update security settings' });
  }
});

// ==========================================
// MENU MANAGEMENT ROUTES
// ==========================================

router.get('/menu', async (req, res) => {
  try {
    const db = await getDb();
    const menus = await db.all('SELECT * FROM main_menu_items ORDER BY sort_order ASC, id ASC');
    res.json(menus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch menus' });
  }
});

router.post('/menu', async (req, res) => {
  try {
    const db = await getDb();
    const { label, link, sort_order } = req.body;
    const result = await db.run(
      'INSERT INTO main_menu_items (label, link, sort_order) VALUES (?, ?, ?)',
      [label, link, sort_order || 0]
    );
    res.json({ message: 'Menu item added', id: result.lastID });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

router.put('/menu/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { label, link, sort_order } = req.body;
    await db.run(
      'UPDATE main_menu_items SET label = ?, link = ?, sort_order = ? WHERE id = ?',
      [label, link, sort_order || 0, req.params.id]
    );
    res.json({ message: 'Menu item updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

router.delete('/menu/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM main_menu_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// Bulk reorder — receives [{id, sort_order}, ...]
router.post('/menu/reorder', async (req, res) => {
  try {
    const db = await getDb();
    const { order } = req.body; // array of { id, sort_order }
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array' });
    for (const item of order) {
      await db.run('UPDATE main_menu_items SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
    }
    res.json({ message: 'Menu order saved' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reorder menu' });
  }
});

// ==========================================
// HERO SLIDER ROUTES
// ==========================================

router.post('/hero', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const db = await getDb();
    const imageUrl = req.file.filename;
    
    // get max sort order
    const row = await db.get('SELECT MAX(sort_order) as maxSort FROM hero_slides');
    const nextSort = (row && row.maxSort ? row.maxSort : 0) + 1;

    const result = await db.run('INSERT INTO hero_slides (image_url, sort_order) VALUES (?, ?)', [imageUrl, nextSort]);
    res.json({ message: 'Hero slide added successfully', id: result.lastID, image_url: imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add hero slide' });
  }
});

router.delete('/hero/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM hero_slides WHERE id = ?', [req.params.id]);
    res.json({ message: 'Hero slide deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete hero slide' });
  }
});

// ==========================================
// SHIPPING SETTINGS ROUTES
// ==========================================

router.get('/shipping', async (req, res) => {
  try {
    const db = await getDb();
    const settings = await db.get('SELECT * FROM shipping_settings WHERE id = 1');
    res.json(settings || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch shipping settings' });
  }
});

router.put('/shipping', async (req, res) => {
  try {
    const db = await getDb();
    const { zone, status, flat_rate, free_shipping_enabled, free_shipping_min, cod_enabled, delivery_time, order_tracking, default_courier, cod_fee, api_integration_enabled } = req.body;
    
    await db.run(
      `UPDATE shipping_settings SET 
        zone = ?, status = ?, flat_rate = ?, free_shipping_enabled = ?, free_shipping_min = ?, cod_enabled = ?, delivery_time = ?, order_tracking = ?, default_courier = ?, cod_fee = ?, api_integration_enabled = ?
       WHERE id = 1`,
      [zone, status, flat_rate, free_shipping_enabled ? 1 : 0, free_shipping_min, cod_enabled ? 1 : 0, delivery_time, order_tracking ? 1 : 0, default_courier || 'Leopards', cod_fee || 0, api_integration_enabled ? 1 : 0]
    );
    res.json({ message: 'Shipping settings updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update shipping settings' });
  }
});

// Review management
router.get('/reviews', async (req, res) => {
  try {
    const db = await getDb();
    const reviews = await db.all(`
      SELECT r.*, p.name as product_name 
      FROM product_reviews r
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `);
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.put('/reviews/:id/status', async (req, res) => {
  try {
    const db = await getDb();
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await db.run('UPDATE product_reviews SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update review status' });
  }
});

// Store Settings
router.get('/store-settings', async (req, res) => {
  try {
    const db = await getDb();
    const settings = await db.get('SELECT * FROM store_settings WHERE id = 1');
    res.json(settings || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch store settings' });
  }
});

router.put('/store-settings', async (req, res) => {
  try {
    const db = await getDb();
    const { phone, email, address, facebook_link, instagram_link, tiktok_link, timing_text } = req.body;
    
    await db.run(
      `UPDATE store_settings 
       SET phone = ?, email = ?, address = ?, facebook_link = ?, instagram_link = ?, tiktok_link = ?, timing_text = ? 
       WHERE id = 1`,
      [phone, email, address, facebook_link, instagram_link, tiktok_link, timing_text]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update store settings' });
  }
});



// Courier Providers API
router.get('/shipping/providers', async (req, res) => {
  try {
    const db = await getDb();
    const providers = await db.all('SELECT * FROM shipping_providers');
    
    // Decrypt keys before sending to frontend
    const decryptedProviders = providers.map(p => ({
      ...p,
      api_key: decrypt(p.api_key),
      secret_key: decrypt(p.secret_key)
    }));
    
    res.json(decryptedProviders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch shipping providers' });
  }
});

router.post('/shipping/providers', async (req, res) => {
  try {
    const db = await getDb();
    const { id, provider_name, api_key, secret_key, account_id, shipper_id, base_url, environment, status } = req.body;
    
    const encApiKey = encrypt(api_key);
    const encSecretKey = encrypt(secret_key);

    const targetStatus = status || 'Inactive';

    // Active Provider Lock
    if (targetStatus === 'Active') {
      await db.run(`UPDATE shipping_providers SET status = 'Inactive'`);
    }

    if (id) {
      await db.run(
        `UPDATE shipping_providers 
         SET provider_name = ?, api_key = ?, secret_key = ?, account_id = ?, shipper_id = ?, base_url = ?, environment = ?, status = ?
         WHERE id = ?`,
        [provider_name, encApiKey, encSecretKey, account_id, shipper_id, base_url, environment, status || 'Inactive', id]
      );
      res.json({ message: 'Provider updated', id });
    } else {
      const result = await db.run(
        `INSERT INTO shipping_providers (provider_name, api_key, secret_key, account_id, shipper_id, base_url, environment, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [provider_name, encApiKey, encSecretKey, account_id, shipper_id, base_url, environment, status || 'Inactive']
      );
      res.json({ message: 'Provider added', id: result.lastID });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save shipping provider' });
  }
});

router.post('/shipping/providers/test', async (req, res) => {
  try {
    const db = await getDb();
    const { id, provider_name, api_key, secret_key, base_url, environment } = req.body;
    
    if (!provider_name || (!api_key && !secret_key)) {
      return res.status(400).json({ success: false, message: 'Missing credentials for test.' });
    }
    
    const engine = CourierEngine.getAdapter(provider_name, {
      api_key, secret_key, base_url, environment
    });
    
    const result = await engine.testConnection();
    
    // If we have an ID, update the test result in DB
    if (id) {
      await db.run(
        `UPDATE shipping_providers SET last_tested_at = CURRENT_TIMESTAMP, last_test_result = ? WHERE id = ?`,
        [result.success ? 'Success' : 'Failed', id]
      );
    }
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during test' });
  }
});

router.post('/orders/:id/retry-shipment', async (req, res) => {
  try {
    const db = await getDb();
    
    // Check if API is enabled
    const settings = await db.get('SELECT api_integration_enabled FROM shipping_settings WHERE id = 1');
    if (!settings || !settings.api_integration_enabled) {
      return res.status(400).json({ success: false, message: 'Courier API integration is disabled.' });
    }

    // Get active provider
    const provider = await db.get(`SELECT * FROM shipping_providers WHERE status = 'Active'`);
    if (!provider) {
      return res.status(400).json({ success: false, message: 'No active courier provider found.' });
    }

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.api_sync_status === 'Synced' && order.tracking_number) {
      return res.status(400).json({ success: false, message: 'Shipment already created for this order.' });
    }

    const config = {
      api_key: decrypt(provider.api_key),
      secret_key: decrypt(provider.secret_key),
      account_id: provider.account_id,
      shipper_id: provider.shipper_id,
      base_url: provider.base_url,
      environment: provider.environment
    };

    const engine = CourierEngine.getAdapter(provider.provider_name, config);
    const response = await engine.createShipment(order);

    if (response.success) {
      await db.run(
        `UPDATE orders SET api_sync_status = 'Synced', api_sync_error = NULL, courier_name = ?, tracking_number = ?, tracking_url = ? WHERE id = ?`,
        [provider.provider_name, response.tracking_number, response.tracking_url, req.params.id]
      );
      return res.json({ success: true, message: 'Shipment created successfully!', tracking_number: response.tracking_number });
    } else {
      await db.run(
        `UPDATE orders SET api_sync_status = 'Failed', api_sync_error = ? WHERE id = ?`,
        [response.message || 'API Error', req.params.id]
      );
      return res.status(400).json({ success: false, message: response.message || 'Failed to create shipment.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during shipment retry.' });
  }
});

// ==========================================
// PAYMENT SETTINGS & GATEWAYS ROUTES
// ==========================================

router.get('/payment/settings', async (req, res) => {
  try {
    const db = await getDb();
    const settings = await db.get('SELECT * FROM payment_settings WHERE id = 1');
    if (settings && settings.bank_accounts) {
      try {
        settings.bank_accounts = JSON.parse(settings.bank_accounts);
      } catch (e) {
        settings.bank_accounts = [];
      }
    }
    res.json(settings || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch payment settings' });
  }
});

router.put('/payment/settings', async (req, res) => {
  try {
    const db = await getDb();
    const { cod_enabled, bank_transfer_enabled, bank_name, account_title, account_number, iban, branch_name, bank_accounts } = req.body;
    await db.run(
      `UPDATE payment_settings SET cod_enabled = ?, bank_transfer_enabled = ?, bank_name = ?, account_title = ?, account_number = ?, iban = ?, branch_name = ?, bank_accounts = ? WHERE id = 1`,
      [cod_enabled, bank_transfer_enabled, bank_name, account_title, account_number, iban, branch_name, JSON.stringify(bank_accounts || [])]
    );
    res.json({ message: 'Payment settings updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update payment settings' });
  }
});

router.get('/payment/gateways', async (req, res) => {
  try {
    const db = await getDb();
    const gateways = await db.all('SELECT * FROM payment_gateways');
    const decryptedGateways = gateways.map(g => ({
      ...g,
      api_key: decrypt(g.api_key),
      secret_key: decrypt(g.secret_key),
      integrity_salt: decrypt(g.integrity_salt)
    }));
    res.json(decryptedGateways);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch payment gateways' });
  }
});

router.post('/payment/gateways', async (req, res) => {
  try {
    const db = await getDb();
    const { id, gateway_name, merchant_id, store_id, api_key, secret_key, integrity_salt, callback_url, environment, status } = req.body;

    const encApiKey = encrypt(api_key);
    const encSecretKey = encrypt(secret_key);
    const encSalt = encrypt(integrity_salt);
    const targetStatus = status || 'Inactive';

    // Active Provider Lock (Only 1 Active Gateway allowed)
    if (targetStatus === 'Active') {
      await db.run(`UPDATE payment_gateways SET status = 'Inactive'`);
    }

    if (id) {
      await db.run(
        `UPDATE payment_gateways SET gateway_name = ?, merchant_id = ?, store_id = ?, api_key = ?, secret_key = ?, integrity_salt = ?, callback_url = ?, environment = ?, status = ? WHERE id = ?`,
        [gateway_name, merchant_id, store_id, encApiKey, encSecretKey, encSalt, callback_url, environment, targetStatus, id]
      );
      res.json({ message: 'Gateway updated', id });
    } else {
      const result = await db.run(
        `INSERT INTO payment_gateways (gateway_name, merchant_id, store_id, api_key, secret_key, integrity_salt, callback_url, environment, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [gateway_name, merchant_id, store_id, encApiKey, encSecretKey, encSalt, callback_url, environment, targetStatus]
      );
      res.json({ message: 'Gateway added', id: result.lastID });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save payment gateway' });
  }
});

router.post('/payment/gateways/test', async (req, res) => {
  try {
    const db = await getDb();
    const { id, gateway_name, api_key, secret_key } = req.body;
    
    if (!gateway_name || (!api_key && !secret_key)) {
      return res.status(400).json({ success: false, message: 'Missing credentials for test.' });
    }
    
    const engine = PaymentEngine.getAdapter(gateway_name, { api_key, secret_key });
    const result = await engine.testConnection();
    
    if (id) {
      await db.run(
        `UPDATE payment_gateways SET last_tested_at = CURRENT_TIMESTAMP, last_test_result = ? WHERE id = ?`,
        [result.success ? 'Success' : 'Failed', id]
      );
    }
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during test' });
  }
});

const AdmZip = require('adm-zip');

// ==========================================
// BACKUP & RESTORE ROUTES
// ==========================================

router.get('/backups', async (req, res) => {
  try {
    const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.zip'));
    const backups = files.map(f => {
      const stats = fs.statSync(path.join(BACKUPS_DIR, f));
      return {
        filename: f,
        size: stats.size,
        created_at: stats.birthtime
      };
    }).sort((a, b) => b.created_at - a.created_at);
    res.json({ backups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

router.post('/backups/create', async (req, res) => {
  try {
    const zip = new AdmZip();
    
    // Add DB
    if (fs.existsSync(DB_PATH)) {
      zip.addLocalFile(DB_PATH);
    }
    
    // Add Uploads
    if (fs.existsSync(UPLOADS_DIR)) {
      zip.addLocalFolder(UPLOADS_DIR, 'uploads');
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup-${timestamp}.zip`;
    zip.writeZip(path.join(BACKUPS_DIR, backupFilename));
    
    // Log
    const db = await getDb();
    const adminUser = req.user.username || 'Admin';
    await db.run(
      'INSERT INTO admin_audit_logs (admin_username, action, details) VALUES (?, ?, ?)',
      [adminUser, 'Create Backup', `Created backup ${backupFilename}`]
    );

    res.json({ success: true, message: 'Backup created successfully', filename: backupFilename });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

router.get('/backups/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    // Basic validation to prevent directory traversal
    if (!filename || !filename.endsWith('.zip') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(BACKUPS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to download backup' });
  }
});

router.delete('/backups/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    if (!filename || !filename.endsWith('.zip') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(BACKUPS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    
    fs.unlinkSync(filePath);
    
    // Log
    const db = await getDb();
    const adminUser = req.user.username || 'Admin';
    await db.run(
      'INSERT INTO admin_audit_logs (admin_username, action, details) VALUES (?, ?, ?)',
      [adminUser, 'Delete Backup', `Deleted backup ${filename}`]
    );

    res.json({ success: true, message: 'Backup deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

const backupUpload = multer({
  dest: BACKUPS_TEMP_DIR,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'), false);
    }
  }
});

router.post('/backups/restore', backupUpload.single('backup'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No backup file uploaded' });
    }
    
    const zip = new AdmZip(req.file.path);
    const extractTo = DATA_DIR;
    
    zip.extractAllTo(extractTo, true);
    fs.unlinkSync(req.file.path);

    res.json({ success: true, message: 'Backup restored successfully. Please restart the backend server to apply database changes.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// System Logs API
router.get('/logs/security', async (req, res) => {
  try {
    const db = await getDb();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let query = 'SELECT * FROM security_logs WHERE 1=1';
    let params = [];

    if (search) {
      query += ' AND (event_type LIKE ? OR user_identifier LIKE ? OR ip LIKE ? OR details LIKE ?)';
      params.push(search, search, search, search);
    }
    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate + ' 00:00:00');
    }
    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate + ' 23:59:59');
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const totalResult = await db.get(countQuery, params);
    
    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = await db.all(query, params);

    res.json({
      logs,
      total: totalResult.total,
      totalPages: Math.ceil(totalResult.total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch security logs' });
  }
});

router.get('/logs/audit', async (req, res) => {
  try {
    const db = await getDb();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let query = 'SELECT * FROM admin_audit_logs WHERE 1=1';
    let params = [];

    if (search) {
      query += ' AND (admin_username LIKE ? OR action LIKE ? OR details LIKE ?)';
      params.push(search, search, search);
    }
    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate + ' 00:00:00');
    }
    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const totalResult = await db.get(countQuery, params);
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = await db.all(query, params);

    res.json({
      logs,
      total: totalResult.total,
      totalPages: Math.ceil(totalResult.total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
