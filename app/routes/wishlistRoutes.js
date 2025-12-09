import express from 'express';
import { authentication } from '../middleware/auth.js';
import { addToWishlist, removeFromWishlist } from '../controllers/wishlistController.js';

const router = express.Router();

// add to wishlist
router.post('/', authentication, addToWishlist);

// remove
router.delete('/:id', authentication, removeFromWishlist);

export default router;
