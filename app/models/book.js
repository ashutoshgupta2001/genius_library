import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Book = sequelize.define('Book', {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    author: { type: DataTypes.STRING, allowNull: false },
    isbn: { type: DataTypes.STRING, allowNull: false, unique: true },
    publishedYear: { type: DataTypes.INTEGER, allowNull: true },
    availabilityStatus: { type: DataTypes.ENUM('Available', 'Borrowed', 'Reserved'), defaultValue: 'Available' },
    // Audit trail fields
    createdBy: { type: DataTypes.BIGINT, allowNull: true },
    updatedBy: { type: DataTypes.BIGINT, allowNull: true },
    deletedBy: { type: DataTypes.BIGINT, allowNull: true }
  }, {
    tableName: 'books',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['author'] },
      { fields: ['publishedYear'] },
      { fields: ['availabilityStatus'] },
      { fields: ['title'] },
      { fields: ['createdBy'] },
      { fields: ['updatedBy'] }
    ]
  });


  Book.addHook('beforeValidate', (book) => {
    if (book.publishedYear) {
      const y = parseInt(book.publishedYear, 10);
      if (isNaN(y) || y < 1000 || y > new Date().getFullYear() + 1) {
        throw new Error('publishedYear must be a valid year');
      }
    }
  });

  return Book;
};
