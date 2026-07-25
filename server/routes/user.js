const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify customer token
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Get User Profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get('SELECT id, full_name, email, phone, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update User Profile
router.put('/profile', authenticateUser, async (req, res) => {
  const { full_name, phone } = req.body;
  try {
    const db = await getDb();
    await db.run('UPDATE users SET full_name = ?, phone = ? WHERE id = ?', [full_name, phone, req.user.id]);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get User Orders
router.get('/orders', authenticateUser, async (req, res) => {
  try {
    const db = await getDb();
    const orders = await db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    
    // Fetch items for each order
    for (let order of orders) {
      order.items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    }
    
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get User Wishlist
router.get('/wishlist', authenticateUser, async (req, res) => {
  try {
    const db = await getDb();
    const items = await db.all(`
      SELECT p.*, w.created_at as wishlisted_at 
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [req.user.id]);
    
    for (let p of items) {
      const imagesRows = await db.all('SELECT image_url FROM product_images WHERE product_id = ?', [p.id]);
      p.images = imagesRows.map(row => 
        row.image_url.startsWith('/uploads') ? `http://localhost:5000${row.image_url}` : row.image_url
      );
    }
    
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Add to Wishlist
router.post('/wishlist/:productId', authenticateUser, async (req, res) => {
  try {
    const db = await getDb();
    const { productId } = req.params;
    await db.run('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?) ON CONFLICT DO NOTHING', [req.user.id, productId]);
    res.json({ message: 'Added to wishlist' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// Remove from Wishlist
router.delete('/wishlist/:productId', authenticateUser, async (req, res) => {
  try {
    const db = await getDb();
    const { productId } = req.params;
    await db.run('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

module.exports = router;
