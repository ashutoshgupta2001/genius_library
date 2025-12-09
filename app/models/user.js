import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const User = sequelize.define('User', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        email: { type: DataTypes.STRING, unique: true, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: true },
        passwordHash: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.STRING, defaultValue: 'user' },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
        tableName: 'users',
        timestamps: true
    });
    return User;
};
