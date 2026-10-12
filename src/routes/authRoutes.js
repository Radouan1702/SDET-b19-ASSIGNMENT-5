const express = require('express');
const { body } = require('express-validator');
const { register, login } = require('../controllers/authController');

const router = express.Router();

const emailValidation = body('email')
  .isString()
  .withMessage('Email must be valid.')
  .trim()
  .notEmpty()
  .withMessage('Email is required.')
  .bail()
  .isEmail()
  .withMessage('Email must be valid.');
const requiredPassword = body('password')
  .isString()
  .withMessage('Password is required.')
  .trim()
  .notEmpty()
  .withMessage('Password is required.');
const registrationPassword = body('password')
  .isString()
  .withMessage('Password is required.')
  .trim()
  .notEmpty()
  .withMessage('Password is required.')
  .bail()
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters.');

router.post(
  '/register',
  [
    body('firstname').trim().notEmpty().withMessage('First name is required.'),
    body('lastname').trim().notEmpty().withMessage('Last name is required.'),
    emailValidation,
    registrationPassword,
  ],
  register
);
router.post('/login', [emailValidation, requiredPassword], login);

module.exports = router;
