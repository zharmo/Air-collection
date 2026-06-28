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
    setPrimaryProductImage,
    deleteProductImage,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const multer = require('multer');
const { sendSuccess } = require('../utils/responseHandler');
const { addProductColor, deleteProductColors, addProductSize, deleteProductSizes } = require('../models/ProductVariant');

const router = express.Router();

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
router.put('/:id/images/:imageId/primary', protect, adminOnly, setPrimaryProductImage);
// ── NEW: delete a single product image ──
router.delete('/:id/images/:imageId', protect, adminOnly, deleteProductImage);

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