import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { logger } from '../common/logger.js';

function authentication(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'Authorization header missing' });
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, error: 'Invalid Authorization format' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret);
    req.user = payload; // contains userId, email, etc.
    logger.info(`Authentication successful for user: ${payload.userId}`);
    next();
  } catch (err) {
    logger.error(`Authentication failed: ${err}`);
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};  

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'You are not authorized to access this resource.' });
  }
  next();
}

export { authentication, requireAdmin };