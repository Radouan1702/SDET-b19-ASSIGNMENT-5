const { Op, col, fn, where } = require('sequelize');
const { Blog, User } = require('../models');

const authorInclude = {
  model: User,
  as: 'author',
  attributes: ['id', 'firstname', 'lastname'],
};

function parseBlogId(value) {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }
  return Number(value);
}

function escapeLikeValue(value) {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function formatBlog(blog) {
  const value = blog.toJSON();
  return {
    id: value.id,
    blogTitle: value.blogTitle,
    blog: value.blog,
    category: value.category,
    createAt: value.createAt,
    updateAt: value.updateAt,
    author: value.author,
  };
}

function getBlogFields(body) {
  return ['blogTitle', 'blog', 'category'].filter(
    (field) => body && Object.prototype.hasOwnProperty.call(body, field)
  );
}

function validateStringField(body, field) {
  if (!body || typeof body[field] !== 'string' || body[field].trim() === '') {
    return `${field} is required.`;
  }
  return null;
}

async function listBlogs(req, res, next) {
  try {
    const filters = {};
    const title = typeof req.query.title === 'string' ? req.query.title.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';

    if (title) {
      filters[Op.and] = [
        where(fn('LOWER', col('blogTitle')), {
          [Op.like]: `%${escapeLikeValue(title.toLowerCase())}%`,
        }),
      ];
    }
    if (category) {
      filters[Op.and] = [
        ...(filters[Op.and] || []),
        where(fn('LOWER', col('category')), category.toLowerCase()),
      ];
    }

    const blogs = await Blog.findAll({
      where: filters,
      include: [authorInclude],
      order: [['createAt', 'DESC']],
    });
    return res.status(200).json(blogs.map(formatBlog));
  } catch (error) {
    return next(error);
  }
}

async function getBlog(req, res, next) {
  try {
    const id = parseBlogId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: 'Invalid blog id.' });
    }

    const blog = await Blog.findByPk(id, { include: [authorInclude] });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }
    return res.status(200).json(formatBlog(blog));
  } catch (error) {
    return next(error);
  }
}

async function createBlog(req, res, next) {
  try {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : null;
    for (const field of ['blogTitle', 'blog', 'category']) {
      const errorMessage = validateStringField(body, field);
      if (errorMessage) {
        return res.status(400).json({ message: errorMessage });
      }
    }

    const blog = await Blog.create({
      blogTitle: body.blogTitle.trim(),
      blog: body.blog.trim(),
      category: body.category.trim(),
      userId: req.user.id,
    });
    await blog.reload({ include: [authorInclude] });
    return res.status(201).json(formatBlog(blog));
  } catch (error) {
    return next(error);
  }
}

async function updateBlog(req, res, next) {
  try {
    const id = parseBlogId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: 'Invalid blog id.' });
    }

    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : null;
    const fields = getBlogFields(body);
    if (fields.length === 0) {
      return res.status(400).json({ message: 'At least one blog field is required.' });
    }
    for (const field of fields) {
      const errorMessage = validateStringField(body, field);
      if (errorMessage) {
        return res.status(400).json({ message: errorMessage });
      }
    }

    const blog = await Blog.findByPk(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }
    if (blog.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to update this blog.' });
    }

    const updates = {};
    for (const field of fields) {
      updates[field] = body[field].trim();
    }
    await blog.update(updates);
    await blog.reload({ include: [authorInclude] });
    return res.status(200).json(formatBlog(blog));
  } catch (error) {
    return next(error);
  }
}

async function deleteBlog(req, res, next) {
  try {
    const id = parseBlogId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: 'Invalid blog id.' });
    }

    const blog = await Blog.findByPk(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }
    if (blog.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to delete this blog.' });
    }

    await blog.destroy();
    return res.status(200).json({ message: 'Blog deleted successfully.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listBlogs, getBlog, createBlog, updateBlog, deleteBlog };
