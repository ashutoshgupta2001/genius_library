import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Wishlist = sequelize.define('Wishlist', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.BIGINT, allowNull: false },
    bookId: { type: DataTypes.BIGINT, allowNull: false }
  }, {
    tableName: 'wishlists',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['bookId'] },
      { unique: true, fields: ['userId', 'bookId'], name: 'unique_user_book_wishlist' }
    ]
  });

  return Wishlist;
};
