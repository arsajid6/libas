const { getDb } = require('../db');

async function logSecurityEvent(eventType, details, ip, userIdentifier = null) {
  try {
    const db = await getDb();
    await db.run(
      `INSERT INTO security_logs (event_type, details, ip, user_identifier) VALUES (?, ?, ?, ?)`,
      [eventType, details, ip, userIdentifier]
    );
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

module.exports = { logSecurityEvent };
