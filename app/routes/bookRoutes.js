import express from 'express';
import { listBooks, getBook, createBook, updateBook, deleteBook, searchBooks } from '../controllers/bookController.js';
import { authentication, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authentication, listBooks);
router.get('/:id', authentication, getBook);
router.post('/', authentication, requireAdmin, createBook);
router.put('/:id', authentication, requireAdmin, updateBook);
router.delete('/:id', authentication, requireAdmin, deleteBook);
router.get('/search', authentication, searchBooks);

export default router;
