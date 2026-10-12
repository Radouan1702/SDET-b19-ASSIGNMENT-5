const bcrypt = require('bcrypt');
const { User } = require('../models');

const userAttributes = [
  'id',
  'firstname',
  'lastname',
  'email',
  'role',
  'isActive',
  'createAt',
  'updateAt',
];

function publicUser(user) {
  return {
    id: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createAt: user.createAt,
    updateAt: user.updateAt,
  };
}

function isPositiveInteger(value) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

async function listUsers(req, res, next) {
  try {
    const users = await User.findAll({
      attributes: userAttributes,
      order: [['id', 'ASC']],
    });
    return res.json(users.map(publicUser));
  } catch (error) {
    return next(error);
  }
}

function getProfile(req, res) {
  return res.json(publicUser(req.user));
}

async function updateProfile(req, res, next) {
  try {
    const body = req.body || {};
    const hasFirstname = Object.prototype.hasOwnProperty.call(body, 'firstname');
    const hasLastname = Object.prototype.hasOwnProperty.call(body, 'lastname');

    if (!hasFirstname && !hasLastname) {
      return res.status(400).json({ message: 'At least one name must be provided.' });
    }
    if (
      (hasFirstname && (typeof body.firstname !== 'string' || !body.firstname.trim()))
      || (hasLastname && (typeof body.lastname !== 'string' || !body.lastname.trim()))
    ) {
      return res.status(400).json({ message: 'First name and last name must be non-empty strings.' });
    }

    const updates = {};
    if (hasFirstname) updates.firstname = body.firstname.trim();
    if (hasLastname) updates.lastname = body.lastname.trim();

    await req.user.update(updates);
    return res.json(publicUser(req.user));
  } catch (error) {
    return next(error);
  }
}

async function updatePassword(req, res, next) {
  try {
    const password = req.body && req.body.password;
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    req.user.password = await bcrypt.hash(password, 12);
    await req.user.save();
    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function getUser(req, res, next) {
  try {
    if (!isPositiveInteger(req.params.id)) {
      return res.status(400).json({ message: 'User id must be a positive integer.' });
    }

    const user = await User.findByPk(Number(req.params.id), { attributes: userAttributes });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json(publicUser(user));
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    if (!isPositiveInteger(req.params.id)) {
      return res.status(400).json({ message: 'User id must be a positive integer.' });
    }
    if (!req.body || typeof req.body.isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean.' });
    }

    const user = await User.findByPk(Number(req.params.id), { attributes: userAttributes });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.id === req.user.id && req.body.isActive === false) {
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    }

    await user.update({ isActive: req.body.isActive });
    return res.json(publicUser(user));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listUsers,
  getProfile,
  updateProfile,
  updatePassword,
  getUser,
  updateStatus,
};
