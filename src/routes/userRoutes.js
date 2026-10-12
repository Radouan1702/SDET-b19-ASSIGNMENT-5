const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorizeAdmin = require('../middleware/authorizeAdmin');
const {
  listUsers,
  getProfile,
  updateProfile,
  updatePassword,
  getUser,
  updateStatus,
} = require('../controllers/userController');

const router = express.Router();

router.get('/', authenticate, authorizeAdmin, listUsers);
router.get('/profile', authenticate, getProfile);
router.put('/profile/update', authenticate, updateProfile);
router.patch('/password', authenticate, updatePassword);
router.get('/:id', authenticate, authorizeAdmin, getUser);
router.patch('/:id/status', authenticate, authorizeAdmin, updateStatus);

module.exports = router;
