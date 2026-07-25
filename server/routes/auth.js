const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { getDb } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;
const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id');

// --- Admin Auth ---
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM admin_users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: 'admin', token_version: user.token_version },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Customer Auth ---

router.post('/user/register', async (req, res) => {
  const { full_name, email, password, phone } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const db = await getDb();
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.random().toString(36).substring(2, 15);

    const result = await db.run(
      'INSERT INTO users (full_name, email, password, phone, verification_token) VALUES (?, ?, ?, ?, ?)',
      [full_name, email, hashedPassword, phone || null, verificationToken]
    );

    // TODO: Send real email verification here
    
    res.status(201).json({ 
      message: 'Registration successful! A verification link has been sent to your email.'
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/user/verify', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE verification_token = ?', [token]);
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    await db.run('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?', [user.id]);
    
    // Auto-login after verification
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      message: 'Email verified successfully',
      token: jwtToken,
      user: { id: user.id, name: user.full_name, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.post('/user/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email first' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.full_name, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/user/google', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.VITE_GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    const db = await getDb();
    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      // Create user
      const result = await db.run(
        'INSERT INTO users (full_name, email, is_verified, google_id) VALUES (?, ?, true, ?)',
        [name, email, sub]
      );
      user = { id: result.lastID, full_name: name, email };
    } else if (!user.google_id) {
      // Link google ID if email matches but google_id is missing
      await db.run('UPDATE users SET google_id = ?, is_verified = 1 WHERE id = ?', [sub, user.id]);
    }

    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google login successful',
      token: jwtToken,
      user: { id: user.id, name: user.full_name || user.name, email: user.email }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

router.post('/user/create-from-order', async (req, res) => {
  const { orderId, email, password } = req.body;
  if (!orderId || !email || !password) {
    return res.status(400).json({ error: 'Order ID, email, and password are required' });
  }

  try {
    const db = await getDb();
    // Check if user already exists
    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (user) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Get order to verify it belongs to this email
    const order = await db.get('SELECT * FROM orders WHERE id = ? AND email = ?', [orderId, email]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found for this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user (verified automatically since they placed an order via email)
    const result = await db.run(
      'INSERT INTO users (full_name, email, password, phone, is_verified) VALUES (?, ?, ?, ?, true)',
      [order.customer_name, email, hashedPassword, order.phone]
    );

    const userId = result.lastID;

    // Link the order
    await db.run('UPDATE orders SET user_id = ? WHERE id = ?', [userId, orderId]);

    // Auto-login
    const jwtToken = jwt.sign(
      { id: userId, email: email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token: jwtToken,
      user: { id: userId, name: order.customer_name, email: email }
    });
  } catch (error) {
    console.error('Create from order error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.get('/admin/recovery-info-default', async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get('SELECT username, recovery_pin, security_question, security_question_text FROM admin_users LIMIT 1');
    if (!user) {
      return res.status(404).json({ error: 'No admin user found' });
    }
    
    const hasPin = !!user.recovery_pin;
    const hasQuestion = !!user.security_question;
    const methodsConfigured = hasPin || hasQuestion;

    res.json({ 
      username: user.username, 
      methodsConfigured,
      hasPin,
      hasQuestion,
      securityQuestionText: user.security_question_text || '' 
    });
  } catch (error) {
    console.error('Recovery info error:', error);
    res.status(500).json({ error: 'Failed to get recovery info' });
  }
});

router.post('/admin/verify-recovery', async (req, res) => {
  const { username, recoveryType, recoveryAnswer } = req.body;
  if (!username || !recoveryType || !recoveryAnswer) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM admin_users WHERE username = ?', [username]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    let isValid = false;
    if (recoveryType === 'pin') {
      isValid = user.recovery_pin === recoveryAnswer;
    } else if (recoveryType === 'question') {
      isValid = user.security_question && user.security_question.toLowerCase() === recoveryAnswer.toLowerCase().trim();
    }
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid recovery answer or PIN' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Verify recovery error:', error);
    res.status(500).json({ error: 'Failed to verify recovery info' });
  }
});

router.post('/admin/reset-password', async (req, res) => {
  const { username, recoveryType, recoveryAnswer, newPassword } = req.body;
  if (!username || !recoveryType || !recoveryAnswer || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM admin_users WHERE username = ?', [username]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let isValid = false;
    if (recoveryType === 'pin') {
      isValid = user.recovery_pin === recoveryAnswer;
    } else if (recoveryType === 'question') {
      isValid = user.security_question && user.security_question.toLowerCase() === recoveryAnswer.toLowerCase().trim();
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid recovery answer or PIN' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE admin_users SET password = ? WHERE id = ?', [hashed, user.id]);
    return res.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
