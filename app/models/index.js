import { Sequelize } from 'sequelize';
import config from '../config/config.js';
import User from './user.js';
import Book from './book.js';
import Wishlist from './wishlist.js';
import NotificationLog from './notificationLog.js';

const sequelize = new Sequelize(config.postgres.readWriteUri);

const db = {
  sequelize,
  Sequelize,
  User: User(sequelize),
  Book: Book(sequelize),
  Wishlist: Wishlist(sequelize),
  NotificationLog: NotificationLog(sequelize)
};

// Associations
db.User.hasMany(db.Wishlist, { foreignKey: 'userId' });
db.Book.hasMany(db.Wishlist, { foreignKey: 'bookId' });
db.Wishlist.belongsTo(db.User, { foreignKey: 'userId' });
db.Wishlist.belongsTo(db.Book, { foreignKey: 'bookId' });

db.NotificationLog.belongsTo(db.User, { foreignKey: 'userId' });
db.NotificationLog.belongsTo(db.Book, { foreignKey: 'bookId' });

// Audit trail associations
db.Book.belongsTo(db.User, { as: 'creator', foreignKey: 'createdBy' });
db.Book.belongsTo(db.User, { as: 'updater', foreignKey: 'updatedBy' });
db.Book.belongsTo(db.User, { as: 'deleter', foreignKey: 'deletedBy' });

export default db;
