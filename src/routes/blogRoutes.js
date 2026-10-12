const express = require('express');
const authenticate = require('../middleware/authenticate');
const {
  listBlogs, getBlog, createBlog, updateBlog, deleteBlog,
} = require('../controllers/blogController');

const router = express.Router();

router.post('/create', authenticate, createBlog);
router.put('/update/:id', authenticate, updateBlog);
router.delete('/delete/:id', authenticate, deleteBlog);
router.delete('/:id', authenticate, deleteBlog);
router.get('/', listBlogs);
router.get('/:id', getBlog);

module.exports = router;
