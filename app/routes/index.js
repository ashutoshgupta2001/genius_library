import express from 'express';
import authRoutes from './authRoutes.js';
import bookRoutes from './bookRoutes.js';
import wishlistRoutes from './wishlistRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/wishlist', wishlistRoutes);

export default router;