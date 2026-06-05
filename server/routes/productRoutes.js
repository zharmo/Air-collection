const express = require('express');
const {
  getProducts,
  getProduct,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  uploadProductImage,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for product images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', protect, adminOnly, createProductHandler);
router.put('/:id', protect, adminOnly, updateProductHandler);
router.delete('/:id', protect, adminOnly, deleteProductHandler);
router.post('/:id/images', protect, adminOnly, upload.single('image'), uploadProductImage);

module.exports = router;