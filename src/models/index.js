const User = require('./User');
const Blog = require('./Blog');

User.hasMany(Blog, { foreignKey: 'userId', as: 'blogs' });
Blog.belongsTo(User, { foreignKey: 'userId', as: 'author' });

module.exports = { User, Blog };
