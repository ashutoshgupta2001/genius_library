import db from '../models/index.js';
import { logger } from '../common/logger.js';

const addToWishlist = async (req, res) => {
    try {
        const { bookId } = req.body;
        const userId = req.user.userId;

        if (!bookId) {
            return res.status(400).json({ success: false, error: 'bookId is required' });
        }

        // Check if book exists
        const book = await db.Book.findByPk(bookId);
        if (!book) {
            return res.status(404).json({ success: false, error: 'Book not found' });
        }

        // Check if already wishlisted
        const existing = await db.Wishlist.findOne({ where: { userId, bookId } });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Book already in wishlist' });
        }

        const wishlist = await db.Wishlist.create({ userId, bookId });
        logger.info(`Wishlist added: ${wishlist.id}`);
        res.status(201).json({ success: true, data: wishlist });
    } catch (err) {
        logger.error(`Wishlist addition failed: ${err}`);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const id = req.params.id;
        const wishlistItem = await db.Wishlist.findByPk(id);
        if (!wishlistItem) return res.status(404).json({ success: false, error: 'Not found' });
        
        // Use Number() to handle BigInt comparison
        if (Number(wishlistItem.userId) !== Number(req.user.userId)) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }
        
        await wishlistItem.destroy();
        logger.info(`Wishlist removed: ${id}`);
        res.status(204).send();
    } catch (err) {
        logger.error(`Wishlist removal failed: ${err}`);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export { addToWishlist, removeFromWishlist };