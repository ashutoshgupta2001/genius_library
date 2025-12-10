import { Op } from 'sequelize';
import db from '../models/index.js';
import queue from '../lib/queue.js'; // bull queue instance
import { logger } from '../common/logger.js';

// Create book
const createBook = async (req, res) => {
    try {
        const { title, author, isbn, publishedYear } = req.body;

        if (!title || title.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }
        if (!author || author.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Author is required' });
        }
        if (!isbn || isbn.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'ISBN is required' });
        }
        if (publishedYear) {
            const year = parseInt(publishedYear, 10);
            if (isNaN(year) || year < 1000 || year > new Date().getFullYear() + 1) {
                return res.status(400).json({ success: false, error: 'publishedYear must be a valid year' });
            }
        }

        const existing = await db.Book.findOne({ where: { isbn } });
        if (existing) return res.status(409).json({ success: false, error: 'ISBN already exists' });

        const book = await db.Book.create({ 
            title: title.trim(), 
            author: author.trim(), 
            isbn: isbn.trim(), 
            publishedYear, 
            availabilityStatus: 'Available',
            createdBy: req.user.userId 
        });
        logger.info(`Book created: ${book.id} by user: ${req.user.userId}`);
        res.status(201).json({ 
            success: true, 
            data: { 
                id: book.id, 
                title: book.title, 
                author: book.author, 
                isbn: book.isbn, 
                published_year: book.publishedYear, 
                availability_status: book.availabilityStatus
            } });
    } catch (err) {
        logger.error(`Book creation failed: ${err}`);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// List books with pagination & filters & search
const listBooks = async (req, res) => {
    try {
        const { page = 1, limit = 10, author, publishedYear, availabilityStatus, q } = req.query;
        const offset = (page - 1) * limit;
        const where = {};

        if (author) where.author = { [Op.iLike]: `%${author}%` };
        if (publishedYear) where.publishedYear = publishedYear;
        if (availabilityStatus) where.availabilityStatus = availabilityStatus;
        if (q) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${q}%` } },
                { author: { [Op.iLike]: `%${q}%` } }
            ];
        }

        const { rows, count } = await db.Book.findAndCountAll({
            where,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order: [['createdAt', 'DESC']]
        });

        logger.info(`Books listed: ${count} books`);
        res.status(200).json({
            success: true, data: {
                page: Number(page),
                limit: Number(limit),
                total: count,
                totalPages: Math.ceil(count / limit),
                data: rows
            }
        });
    } catch (err) {
        logger.error(`Books listing failed: ${err}`);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Get single
const getBook = async (req, res) => {
    try {
        const book = await db.Book.findByPk(req.params.id);
        if (!book) return res.status(404).json({ success: false, error: 'Book not found' });
        logger.info(`Book retrieved: ${book.id}`);
        res.status(200).json({ success: true, data: book });
    } catch (err) {
        logger.error(`Book retrieval failed: ${err}`);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Update book
const updateBook = async (req, res) => {
    try {
        const book = await db.Book.findByPk(req.params.id);
        if (!book) return res.status(404).json({ success: false, error: 'Book not found' });

        // capture previous status for comparison
        const prevStatus = book.availabilityStatus;
        logger.info(`Previous status: ${prevStatus}`);

        // allow partial updates; validate publishedYear & isbn uniqueness if changed
        if (req.body.isbn && req.body.isbn !== book.isbn) {
            const existing = await db.Book.findOne({ where: { isbn: req.body.isbn } });
            if (existing) return res.status(409).json({ success: false, error: 'ISBN already exists' });
        }
        if (req.body.publishedYear) {
            const y = parseInt(req.body.publishedYear, 10);
            if (isNaN(y) || y < 1000 || y > new Date().getFullYear() + 1) {
                return res.status(400).json({ success: false, error: 'publishedYear must be a valid year' });
            }
        }

        await book.update({ ...req.body, updatedBy: req.user.userId });

        // If status changed from Borrowed -> Available, enqueue a job
        if (prevStatus === 'Borrowed' && book.availabilityStatus === 'Available') {
            // enqueue job (non-blocking)
            await queue.add('bookAvailable', { bookId: book.id, title: book.title });
            logger.info(`Book available job enqueued: ${book.id}`);
            // respond quickly without waiting for notifications to complete
        }

        logger.info(`Book updated: ${book.id} by user: ${req.user.userId}`);
        res.status(200).json({ success: true, data: book });
    } catch (err) {
        logger.error(`Book update failed: ${err}`);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Soft delete
const deleteBook = async (req, res) => {
    try {
        const book = await db.Book.findByPk(req.params.id);
        if (!book) return res.status(404).json({ success: false, error: 'Book not found' });
        
        // Set deletedBy before soft-delete
        await book.update({ deletedBy: req.user.userId });
        await book.destroy(); // soft-delete because paranoid: true
        logger.info(`Book deleted: ${book.id} by user: ${req.user.userId}`);
        res.status(204).send();
    } catch (err) {
        logger.error(`Book deletion failed: ${err}`);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

const searchBooks = async (req, res) => {
    try {
        const { page = 1, limit = 10, q } = req.query;
        const offset = (page - 1) * limit;
        const where = {};
        if (q) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${q}%` } },
                { author: { [Op.iLike]: `%${q}%` } }
            ];
        }

        logger.info(`Searching for books: ${q} with page: ${page}, limit: ${limit}`);
        const { rows, count } = await db.Book.findAndCountAll({
            where,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order: [['createdAt', 'DESC']]
        });

        logger.info(`Found ${count} books`);
        res.status(200).json({ success: true, data: { 
            page: Number(page),
            limit: Number(limit),
            total: count,
            totalPages: Math.ceil(count / limit),
            data: rows
        } });
    } catch (err) {
        logger.error(`Book search failed: ${err}`);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export { createBook, listBooks, getBook, updateBook, deleteBook, searchBooks };
