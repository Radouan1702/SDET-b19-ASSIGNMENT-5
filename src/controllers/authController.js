const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { User } = require('../models');
const { signToken } = require('../utils/jwt');

function validationMessage(req) {
  const errors = validationResult(req);
  return errors.isEmpty() ? null : errors.array()[0].msg;
}

function publicUser(user) {
  return {
    id: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createAt: user.createAt,
  };
}

async function register(req, res, next) {
  try {
    const message = validationMessage(req);
    if (message) {
      return res.status(400).json({ message });
    }

    const firstname = req.body.firstname.trim();
    const lastname = req.body.lastname.trim();
    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      role: 'user',
      isActive: true,
    });

    return res.status(201).json(publicUser(user));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Email already exists.' });
    }
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const message = validationMessage(req);
    if (message) {
      return res.status(400).json({ message });
    }

    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account is deactivated.' });
    }

    return res.json({
      message: 'Login successful',
      token: signToken(user),
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login };
