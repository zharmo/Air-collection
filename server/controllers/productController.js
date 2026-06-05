const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
} = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// @desc    Get all products with filters
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    const { categoryId, search, minPrice, maxPrice } = req.query;
    const filters = { categoryId, search, minPrice, maxPrice };
    const products = await getAllProducts(filters);
    sendSuccess(res, products);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
const getProduct = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }
    sendSuccess(res, product);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Create product (admin only)
// @route   POST /api/products
const createProductHandler = async (req, res) => {
  try {
    const { name, slug, description, price, compare_price, stock_quantity, sku, category_id, is_featured } = req.body;
    if (!name || !slug || !price) {
      return sendError(res, 'Name, slug and price are required', 400);
    }
    const newProduct = await createProduct({
      name,
      slug,
      description,
      price,
      compare_price,
      stock_quantity,
      sku,
      category_id,
      is_featured,
    });
    sendSuccess(res, newProduct, 'Product created', 201);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return sendError(res, 'Product slug or SKU already exists', 400);
    }
    sendError(res, 'Server error', 500);
  }
};

// @desc    Update product (admin only)
// @route   PUT /api/products/:id
const updateProductHandler = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }
    const updates = req.body;
    const updated = await updateProduct(req.params.id, updates);
    sendSuccess(res, updated, 'Product updated');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Delete product (admin only)
// @route   DELETE /api/products/:id
const deleteProductHandler = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }
    await deleteProduct(req.params.id);
    sendSuccess(res, null, 'Product deleted');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Upload product image (admin only)
// @route   POST /api/products/:id/images
// (We'll add this to routes)
const uploadProductImage = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await getProductById(productId);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }
    if (!req.file) {
      return sendError(res, 'No image file uploaded', 400);
    }
    const imageUrl = `/uploads/products/${req.file.filename}`;
    const is_primary = req.body.is_primary === 'true';
    const alt_text = req.body.alt_text || product.name;
    const image = await addProductImage(productId, imageUrl, is_primary, alt_text);
    sendSuccess(res, image, 'Image uploaded', 201);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  uploadProductImage,
};