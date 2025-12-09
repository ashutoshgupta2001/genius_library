import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const NotificationLog = sequelize.define('NotificationLog', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.BIGINT },
    bookId: { type: DataTypes.BIGINT },
    message: { type: DataTypes.TEXT }
  }, {
    tableName: 'notification_logs',
    timestamps: true
  });
  return NotificationLog;   
};