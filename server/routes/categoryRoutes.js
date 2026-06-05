const express = require('express');
const {
  getCategories,
  getCategory,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getCategories);
router.get('/:id', getCategory);
router.post('/', protect, adminOnly, createCategoryHandler);
router.put('/:id', protect, adminOnly, updateCategoryHandler);
router.delete('/:id', protect, adminOnly, deleteCategoryHandler);

module.exports = router;