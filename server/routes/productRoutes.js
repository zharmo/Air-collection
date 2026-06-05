const express = require('express');
const {
    getProducts,
    getProduct,
    createProduct,
    createFullProduct,
    updateProduct,
    updateFullProduct,
    deleteProduct,
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

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Admin only routes
router.post('/', protect, adminOnly, createProduct);
router.post('/full', protect, adminOnly, createFullProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.put('/:id/full', protect, adminOnly, updateFullProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.post('/:id/images', protect, adminOnly, upload.single('image'), uploadProductImage);

// DELETE /api/products/:id/colors
router.delete('/:id/colors', protect, adminOnly, async (req, res) => {
    await deleteProductColors(req.params.id);
    sendSuccess(res, null, 'Colors deleted');
});

// DELETE /api/products/:id/sizes
router.delete('/:id/sizes', protect, adminOnly, async (req, res) => {
    await deleteProductSizes(req.params.id);
    sendSuccess(res, null, 'Sizes deleted');
});

// POST /api/products/:id/colors
router.post('/:id/colors', protect, adminOnly, async (req, res) => {
    const { colorName, imageUrl } = req.body;
    const result = await addProductColor(req.params.id, colorName, imageUrl);
    sendSuccess(res, result, 'Color added');
});

// POST /api/products/:id/sizes
router.post('/:id/sizes', protect, adminOnly, async (req, res) => {
    const { colorId, sizeName, sizeType, measurements, stock, isAvailable } = req.body;
    const result = await addProductSize(req.params.id, colorId, sizeName, sizeType, measurements, stock, isAvailable);
    sendSuccess(res, result, 'Size added');
});

module.exports = router;