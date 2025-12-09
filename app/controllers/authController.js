import bcrypt from 'bcrypt';    
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import config from '../config/config.js';
import { logger } from '../common/logger.js';

const { User } = db;

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ success: false, error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash: hash, name: name.trim() });
    res.status(201).json({ success: true, data: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, config.auth.jwtSecret, { expiresIn: config.auth.jwtExpiresIn });
    logger.info(`Login successful for user: ${user.id}`);
    res.status(200).json({ success: true, data: { token, expires_in: config.auth.jwtExpiresIn } });
  } catch (err) {
    logger.error(`Login failed: ${err}`);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export { register, login };
