const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !/^Bearer\s+\S+$/.test(header)) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const token = header.slice(7).trim();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account is deactivated.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = authenticate;
