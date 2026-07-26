const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
const isAdmin = require('./middleware/isAdmin');
const crypto = require('crypto');
const multer = require('multer');
const CourierEngine = require('./couriers/index');
const PaymentEngine = require('./payments/index');
const { getDb, fetchRelationsForProducts } = require('./db');
const { sendOrderConfirmationEmail } = require('./utils/email');

const { logSecurityEvent } = require('./utils/logger');

const { UPLOADS_DIR } = require('./utils/paths');

const SupabaseStorage = require('./utils/supabaseStorage');
const storage = new SupabaseStorage({ bucket: 'images' });
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.'), false);
  }
};
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
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
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(UPLOADS_DIR));

// Routes
const userRoutes = require('./routes/user');

app.use('/api/auth', authRoutes);
app.use('/api/admin', isAdmin, adminRoutes);
app.use('/api/user', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.get('/api/public/menu', async (req, res) => {
  try {
    const db = await getDb();
    const menus = await db.all('SELECT * FROM main_menu_items ORDER BY sort_order ASC, id ASC');
    res.json(menus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch menus' });
  }
});

app.get('/api/public/products', async (req, res) => {
  try {
    const db = await getDb();
    const category = req.query.category;
    let products;
    
    if (category && category.toLowerCase() !== 'all') {
      products = await db.all('SELECT * FROM products WHERE category LIKE ? COLLATE NOCASE', [`%${category.toLowerCase()}%`]);
    } else {
      products = await db.all('SELECT * FROM products');
    }
    
    await fetchRelationsForProducts(db, products);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/public/products/:id', async (req, res) => {
  try {
    const db = await getDb();
    const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await fetchRelationsForProducts(db, [product]);
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.get('/api/public/hero', async (req, res) => {
  try {
    const db = await getDb();
    const slides = await db.all('SELECT * FROM hero_slides ORDER BY sort_order ASC, id ASC');
    res.json(slides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch hero slides' });
  }
});

app.get('/api/public/shipping', async (req, res) => {
  try {
    const db = await getDb();
    const settings = await db.get('SELECT * FROM shipping_settings WHERE id = 1');
    res.json(settings || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch shipping settings' });
  }
});

app.get('/api/public/store-settings', async (req, res) => {
  try {
    const db = await getDb();
    const settings = await db.get('SELECT * FROM store_settings WHERE id = 1');
    res.json(settings || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch store settings' });
  }
});

app.get('/api/public/payments/config', async (req, res) => {
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
    const gateways = await db.all(`SELECT id, gateway_name, status FROM payment_gateways`);
    const activeGateway = gateways.find(g => g.status === 'Active');
    
    res.json({
      settings: settings || {},
      gateways,
      onlinePaymentsActive: !!activeGateway,
      activeGateway: activeGateway || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch payment config' });
  }
});

app.post('/api/public/checkout', async (req, res) => {
  try {
    const db = await getDb();
    let { 
      user_id, customer_name, email, phone, city, area, address, 
      payment_method, order_notes, total_amount, shipping_cost, cod_fee, discount, items, transaction_reference,
      paymentProofBase64, paymentProofFileName
    } = req.body;

    // items should already be parsed as it's JSON
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch(e) {}
    }

    let payment_status = 'Pending';
    let paymentProofImage = null;

    if (payment_method === 'Cash on Delivery') {
      payment_status = 'COD Pending';
    } else if (payment_method === 'Bank Transfer') {
      payment_status = 'Pending Verification';
      
      if (paymentProofBase64) {
        // Upload base64 image to Supabase
        try {
          const { createClient } = require('@supabase/supabase-js');
          const supabaseUrl = 'https://vqzagnqoxmlffhjbnrxp.supabase.co';
          const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxemFnbnFveG1sZmZoamJucnhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc1MjIyNCwiZXhwIjoyMTAwMzI4MjI0fQ.xKOCwj1hzivN8EYpJhl0zJB515FCU-HH-JKUUpwSBAw';
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Data URL format: data:image/png;base64,iVBORw0KGgo...
          const matches = paymentProofBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const contentType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            
            const ext = require('path').extname(paymentProofFileName || '.png');
            const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
            
            const { data, error } = await supabase.storage.from('images').upload(filename, buffer, {
              contentType: contentType,
              upsert: true
            });
            
            if (!error) {
              const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(filename);
              paymentProofImage = publicUrlData.publicUrl;
            }
          }
        } catch (err) {
          console.error("Error uploading payment proof to Supabase:", err);
        }
      }
    } else if (payment_method === 'Online Payment') {
      // Validate if online payment is even active
      const activeGateway = await db.get(`SELECT * FROM payment_gateways WHERE status = 'Active'`);
      if (!activeGateway) {
        return res.status(400).json({ error: 'Online payments are currently disabled.' });
      }
      payment_status = 'Awaiting Payment';
    }

    await db.run('BEGIN TRANSACTION');

    // 1. Recalculate totals on backend to prevent financial tampering
    const shippingSettings = await db.get('SELECT * FROM shipping_settings WHERE id = 1');
    const flat_rate = shippingSettings ? shippingSettings.flat_rate : 250;
    const free_shipping_enabled = shippingSettings ? shippingSettings.free_shipping_enabled : true;
    const free_shipping_min = shippingSettings ? shippingSettings.free_shipping_min : 5000;
    const admin_cod_fee = shippingSettings ? shippingSettings.cod_fee : 0;

    let calculated_subtotal = 0;
    for (let item of items) {
      const product = await db.get('SELECT base_price, sale_price FROM products WHERE id = ?', [item.id]);
      if (!product) {
        await db.run('ROLLBACK');
        return res.status(400).json({ error: `Product ID ${item.id} not found` });
      }
      const price = product.sale_price || product.base_price;
      calculated_subtotal += (price * item.quantity);
    }

    let calculated_shipping = flat_rate;
    if (free_shipping_enabled && calculated_subtotal >= free_shipping_min) {
      calculated_shipping = 0;
    }
    
    let calculated_cod_fee = 0;
    if (payment_method === 'Cash on Delivery') {
      calculated_cod_fee = admin_cod_fee;
    }

    // Assuming frontend applies 'discount' directly. We must strictly ignore frontend total.
    let calculated_total = calculated_subtotal + calculated_shipping + calculated_cod_fee - Number(discount || 0);

    // Give small tolerance for floats
    if (Math.abs(calculated_total - Number(total_amount)) > 1) {
      await db.run('ROLLBACK');
      await logSecurityEvent('FINANCIAL_TAMPERING', `Frontend total ${total_amount} vs Backend calculated ${calculated_total}`, req.ip || req.connection.remoteAddress, email || customer_name);
      return res.status(400).json({ error: 'Order total mismatch. Security violation logged.' });
    }

    const generateTrackingToken = () => {
      return 'TRK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    };
    const trackingToken = generateTrackingToken();

    const result = await db.run(
      `INSERT INTO orders (
        user_id, customer_name, email, phone, city, area, address, 
        payment_method, order_notes, total_amount, shipping_cost, cod_fee, discount, status, payment_status, payment_proof_image, tracking_token, transaction_reference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id || null, customer_name, email || null, phone, city, area, address,
        payment_method || 'Cash on Delivery', order_notes || null, 
        calculated_total, calculated_shipping, calculated_cod_fee, discount || 0, 
        (payment_method === 'Bank Transfer' ? 'Awaiting Verification' : 'Waiting for Response'), 
        payment_status, paymentProofImage, trackingToken, transaction_reference || null
      ]
    );

    const orderId = result.lastID;

    for (let item of items) {
      // Atomic Stock Update to prevent race conditions (Overselling)
      const updateResult = await db.run(
        `UPDATE product_variants 
         SET stock_quantity = stock_quantity - ? 
         WHERE product_id = ? AND size IS NOT DISTINCT FROM ? AND color IS NOT DISTINCT FROM ? AND stock_quantity >= ?`,
        [item.quantity, item.id, item.selectedSize || null, item.selectedColor || null, item.quantity]
      );
      
      if (updateResult.changes === 0) {
        await db.run('ROLLBACK');
        return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
      }

      const product = await db.get('SELECT base_price, sale_price FROM products WHERE id = ?', [item.id]);
      const price = product.sale_price || product.base_price;

      await db.run(
        `INSERT INTO order_items (
          order_id, product_variant_id, product_name, size, color, quantity, price_at_purchase, product_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, null, item.name, item.selectedSize || null, item.selectedColor || null, item.quantity, price, item.image || null]
      );
      
      // Update the product's updated_at timestamp so it floats to top of alerts
      await db.run(
        `UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [item.id]
      );
    }

    // Courier Integration: Try to auto-create shipment if API is enabled
    try {
      const settings = await db.get('SELECT api_integration_enabled FROM shipping_settings WHERE id = 1');
      if (settings && settings.api_integration_enabled) {
        const provider = await db.get(`SELECT * FROM shipping_providers WHERE status = 'Active'`);
        if (provider) {
          const config = {
            api_key: decrypt(provider.api_key),
            secret_key: decrypt(provider.secret_key),
            account_id: provider.account_id,
            shipper_id: provider.shipper_id,
            base_url: provider.base_url,
            environment: provider.environment
          };
          const engine = CourierEngine.getAdapter(provider.provider_name, config);
          
          // Full order object for adapter
          const fullOrder = {
            id: orderId,
            customer_name, email, phone, city, area, address, 
            payment_method, order_notes, total_amount, shipping_cost, cod_fee, discount, items
          };

          const response = await engine.createShipment(fullOrder);
          if (response.success) {
            await db.run(
              `UPDATE orders SET api_sync_status = 'Synced', api_sync_error = NULL, courier_name = ?, tracking_number = ?, tracking_url = ? WHERE id = ?`,
              [provider.provider_name, response.tracking_number, response.tracking_url, orderId]
            );
          } else {
            await db.run(
              `UPDATE orders SET api_sync_status = 'Failed', api_sync_error = ? WHERE id = ?`,
              [response.message || 'API Error', orderId]
            );
          }
        }
      }
    } catch (apiError) {
      console.error('Courier API Sync Error:', apiError);
      await db.run(
        `UPDATE orders SET api_sync_status = 'Failed', api_sync_error = ? WHERE id = ?`,
        [apiError.message || 'Unknown API Error', orderId]
      );
    }

    await db.run('COMMIT');

    // Trigger Order Confirmation Email
    if (email) {
      const savedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
      if (savedOrder) {
        sendOrderConfirmationEmail(savedOrder).catch(err => console.error('Failed to send email:', err));
      }
    }

    res.status(201).json({ 
      success: true, 
      orderId, 
      message: 'Order created successfully!',
      tracking_token: trackingToken 
    });
  } catch (error) {
    console.error('Checkout error:', error);
    try {
      const db = await getDb();
      await db.run('ROLLBACK');
    } catch(rollbackErr) {}
    res.status(500).json({ error: 'Failed to process checkout', details: error.message });
  }
});

// Reviews endpoints
app.get('/api/public/reviews/:productId', async (req, res) => {
  try {
    const db = await getDb();
    const productId = req.params.productId;
    // Only fetch approved reviews
    const reviews = await db.all(
      'SELECT id, rating, title, content, display_name, created_at FROM product_reviews WHERE product_id = ? AND status = \'approved\' ORDER BY created_at DESC',
      [productId]
    );
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/public/reviews/:productId', async (req, res) => {
  try {
    const db = await getDb();
    const productId = req.params.productId;
    const { rating, title, content, display_name, email } = req.body;

    await db.run(
      'INSERT INTO product_reviews (product_id, rating, title, content, display_name, email, status) VALUES (?, ?, ?, ?, ?, ?, \'pending\')',
      [productId, rating, title, content, display_name, email]
    );

    res.json({ message: 'Review submitted successfully and is pending approval.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// GET /api/public/track-order
app.get('/api/public/track-order', async (req, res) => {
  try {
    const { token, order_id, email } = req.query;
    const db = await getDb();
    
    let order = null;
    
    if (token) {
      order = await db.get('SELECT * FROM orders WHERE tracking_token = ?', [token]);
    } else if (order_id && email) {
      const numericId = order_id.replace(/\D/g, ''); // Extract just digits if they typed #ORD-
      order = await db.get('SELECT * FROM orders WHERE id = ? AND email = ?', [numericId, email]);
    } else {
      await logSecurityEvent('UNAUTHORIZED_TRACKING', `Missing required email or token for order_id: ${order_id}`, req.ip || req.connection.remoteAddress);
      return res.status(400).json({ success: false, message: 'Email and Order ID are required' });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or email mismatch' });
    }

    // Only return safe tracking information
    res.json({
      success: true,
      order: {
        id: order.id,
        created_at: order.created_at,
        status: order.status,
        shipment_status: order.shipment_status || 'Pending',
        courier_name: order.courier_name,
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url,
        last_tracking_update: order.last_tracking_update
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to retrieve tracking info' });
  }
});

// Production validation
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || !process.env.GOOGLE_CLIENT_ID || !process.env.ENCRYPTION_KEY) {
    console.error('CRITICAL: Missing required secrets (JWT_SECRET, GOOGLE_CLIENT_ID, or ENCRYPTION_KEY) in production environment. Refusing to start.');
    process.exit(1);
  }
}

// Global Error Handlers
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION! Shutting down...', reason);
  process.exit(1);
});

app.listen(PORT, async () => {
  try {
    await getDb();
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Server running on port ${PORT} and Database initialized`);
    } else {
      console.log(`Production Server started on port ${PORT}`);
    }
  } catch (err) {
    console.error('Failed to initialize database', err);
    process.exit(1);
  }
});
