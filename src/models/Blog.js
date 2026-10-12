const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Blog = sequelize.define(
  'Blog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    blogTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    blog: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: 'blogs',
    timestamps: true,
    createdAt: 'createAt',
    updatedAt: 'updateAt',
  }
);

module.exports = Blog;
