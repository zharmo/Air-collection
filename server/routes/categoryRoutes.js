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
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed.'));
    }
    cb(null, true);
  },
});

router.get('/', getCategories);
router.get('/:id', getCategory);
router.post('/', protect, adminOnly, upload.single('image'), createCategoryHandler);
router.put('/:id', protect, adminOnly, upload.single('image'), updateCategoryHandler);
router.delete('/:id', protect, adminOnly, deleteCategoryHandler);

module.exports = router;
