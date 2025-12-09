import db from '../models/index.js';
import queue from '../lib/queue.js';
import { logger } from '../common/logger.js';

async function start() {
  queue.process('bookAvailable', 5, async (job) => {
    const { bookId, title } = job.data;
    logger.info(`Worker processing notifications for bookId=${bookId}, title=${title}`);

    // find wishlists
    const wishlists = await db.Wishlist.findAll({ where: { bookId }, include: [db.User] });

    // for each wishlister create NotificationLog and print
    for (const w of wishlists) {
      const userId = w.userId;
      const message = `Notification prepared for user_id:${userId}: Book [${title}] is now available.`;
      logger.info(message);
      await db.NotificationLog.create({ userId, bookId, message });
      // Could extend: send email / push message by adding another job to mailer queue
    }

    return Promise.resolve();
  });

  queue.on('failed', (job, err) => {
    logger.error(`Job failed: ${job.id}, ${err}`);
  });

  logger.info('Notification worker started');
}

// ensure DB connection then start
db.sequelize.authenticate().then(() => {
logger.info('DB connected for worker');
  return start();
}).catch(err => {
  logger.error(`DB connection failed for worker: ${err}`);
  process.exit(1);
});
