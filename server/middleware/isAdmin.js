const jwt = require('jsonwebtoken');
const { getDb } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

const isAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Strict role validation
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const db = await getDb();
    const adminUser = await db.get('SELECT token_version FROM admin_users WHERE id = ?', [decoded.id]);

    if (!adminUser) {
      return res.status(403).json({ error: 'Forbidden: Admin user not found' });
    }

    // Token version validation
    if (adminUser.token_version !== decoded.token_version) {
      return res.status(401).json({ error: 'Unauthorized: Session expired or invalidated' });
    }

    req.user = decoded; // Contains { id, username, role, token_version }
    next();
  } catch (err) {
    console.error('Admin JWT Verification Error:', err.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = isAdmin;
