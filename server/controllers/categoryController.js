const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../models/Category');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { saveUploadedImage } = require('../services/localUploadService');

const CATEGORY_UPLOAD_SUBDIR = process.env.CATEGORY_UPLOAD_SUBDIR || 'categories';

// @desc    Get all categories
// @route   GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();
    sendSuccess(res, categories);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
const getCategory = async (req, res) => {
  try {
    const category = await getCategoryById(req.params.id);
    if (!category) {
      return sendError(res, 'Category not found', 404);
    }
    sendSuccess(res, category);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Create category (admin only)
// @route   POST /api/categories
const createCategoryHandler = async (req, res) => {
  try {
    const { name, slug, description, image, parent_id } = req.body;
    if (!name || !slug) {
      return sendError(res, 'Name and slug are required', 400);
    }

    let categoryImage = image || null;
    if (req.file) {
      const upload = await saveUploadedImage(req.file, CATEGORY_UPLOAD_SUBDIR);
      categoryImage = upload.url;
    }

    const newCategory = await createCategory(name, slug, description, categoryImage, parent_id || null);
    sendSuccess(res, newCategory, 'Category created', 201);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return sendError(res, 'Category name or slug already exists', 400);
    }
    sendError(res, 'Server error', 500);
  }
};

// @desc    Update category (admin only)
// @route   PUT /api/categories/:id
const updateCategoryHandler = async (req, res) => {
  try {
    const category = await getCategoryById(req.params.id);
    if (!category) {
      return sendError(res, 'Category not found', 404);
    }
    const { name, slug, description, image, parent_id, is_active } = req.body;

    let categoryImage = image;
    if (req.file) {
      const upload = await saveUploadedImage(req.file, CATEGORY_UPLOAD_SUBDIR);
      categoryImage = upload.url;
    }

    const updated = await updateCategory(req.params.id, { name, slug, description, image: categoryImage, parent_id, is_active });
    sendSuccess(res, updated, 'Category updated');
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return sendError(res, 'Category name or slug already exists', 400);
    }
    sendError(res, 'Server error', 500);
  }
};

// @desc    Delete category (admin only)
// @route   DELETE /api/categories/:id
const deleteCategoryHandler = async (req, res) => {
  try {
    const category = await getCategoryById(req.params.id);
    if (!category) {
      return sendError(res, 'Category not found', 404);
    }
    await deleteCategory(req.params.id);
    sendSuccess(res, null, 'Category deleted');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
};
