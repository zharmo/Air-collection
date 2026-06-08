const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { addProductColor, getProductColors, deleteProductColors, addProductSize, getProductSizes, deleteProductSizes } = require('../models/ProductVariant');
const { saveUploadedImage } = require('../services/localUploadService');

const PRODUCT_UPLOAD_SUBDIR = process.env.PRODUCT_UPLOAD_SUBDIR || 'products';

const enrichProductWithVariants = async (product) => {
    try {
        const colors = await getProductColors(product.id);
        const sizes = await getProductSizes(product.id);
        return { ...product, colors, sizes };
    } catch (error) {
        console.error('enrichProductWithVariants error:', error);
        return product;
    }
};

// @desc    Get all products
const getProducts = async (req, res) => {
    try {
        const { categoryId, search, minPrice, maxPrice } = req.query;
        let query = `
            SELECT p.*, c.name as category_name,
            (SELECT json_agg(json_build_object('id', pi.id, 'image_url', pi.image_url, 'is_primary', pi.is_primary))
             FROM product_images pi WHERE pi.product_id = p.id) as images
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = true
        `;
        const values = [];
        let i = 1;
        if (categoryId) { query += ` AND p.category_id = $${i}`; values.push(categoryId); i++; }
        if (search) { query += ` AND (p.name ILIKE $${i} OR p.description ILIKE $${i})`; values.push(`%${search}%`); i++; }
        if (minPrice) { query += ` AND p.price >= $${i}`; values.push(minPrice); i++; }
        if (maxPrice) { query += ` AND p.price <= $${i}`; values.push(maxPrice); i++; }
        query += ` ORDER BY p.created_at DESC`;
        const result = await pool.query(query, values);
        sendSuccess(res, result.rows);
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error', 500);
    }
};

// @desc    Get single product
const getProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productResult = await pool.query(
            `SELECT p.*, c.name as category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = $1`,
            [id]
        );
        if (productResult.rows.length === 0) return sendError(res, 'Product not found', 404);
        const product = productResult.rows[0];
        const imagesResult = await pool.query(
            `SELECT id, image_url, is_primary, alt_text, color FROM product_images WHERE product_id = $1`,
            [id]
        );
        product.images = imagesResult.rows;
        const colors = await getProductColors(id);
        const sizes = await getProductSizes(id);
        product.colors = colors;
        product.sizes = sizes;
        sendSuccess(res, product);
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error', 500);
    }
};

// @desc    Create basic product
const createProduct = async (req, res) => {
    try {
        const { name, slug, description, price, compare_price, stock_quantity, sku, category_id, is_featured } = req.body;
        if (!name || !slug || !price) return sendError(res, 'Name, slug and price are required', 400);
        const result = await pool.query(
            `INSERT INTO products (name, slug, description, price, compare_price, stock_quantity, sku, category_id, is_featured)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [name, slug, description, price, compare_price, stock_quantity, sku, category_id, is_featured || false]
        );
        sendSuccess(res, result.rows[0], 'Product created', 201);
    } catch (error) {
        console.error(error);
        if (error.code === '23505') return sendError(res, 'Duplicate slug or SKU', 400);
        sendError(res, 'Server error', 500);
    }
};

// @desc    Create full product (with colors & sizes)
const createFullProduct = async (req, res) => {
    let client;
    try {
        const { name, slug, description, price, compare_price, stock_quantity, sku, category_id, is_featured, colors, sizes } = req.body;
        if (!name || !slug || !price) return sendError(res, 'Name, slug and price are required', 400);
        
        console.log('🔵 createFullProduct - colors:', JSON.stringify(colors, null, 2));
        console.log('🔵 createFullProduct - sizes:', JSON.stringify(sizes, null, 2));
        
        client = await pool.connect();
        await client.query('BEGIN');
        
        // Insert product
        const productRes = await client.query(
            `INSERT INTO products (name, slug, description, price, compare_price, stock_quantity, sku, category_id, is_featured)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [name, slug, description, price, compare_price, stock_quantity, sku, category_id, is_featured || false]
        );
        const product = productRes.rows[0];
        
        // Map color names to IDs
        const colorIdMap = new Map();
        if (colors && colors.length) {
            for (const color of colors) {
                if (color.colorName && color.imageUrl) {
                    const colorRecord = await client.query(
                        `INSERT INTO product_colors (product_id, color_name, image_url)
                         VALUES ($1, $2, $3) RETURNING id`,
                        [product.id, color.colorName, color.imageUrl]
                    );
                    colorIdMap.set(color.colorName, colorRecord.rows[0].id);
                }
            }
        }
        
        // Insert sizes
        if (sizes && sizes.length) {
            for (let i = 0; i < sizes.length; i++) {
                const s = sizes[i];
                let colorId = null;
                // Support both colorName and colorId
                if (s.colorName && s.colorName.trim() !== '') {
                    colorId = colorIdMap.get(s.colorName);
                    if (!colorId) console.warn(`⚠️ Color "${s.colorName}" not found`);
                } else if (s.colorId && typeof s.colorId === 'number') {
                    colorId = s.colorId;
                }
                await client.query(
                    `INSERT INTO product_sizes (product_id, color_id, size_name, size_type, measurements, stock, is_available, position)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [product.id, colorId, s.sizeName, s.sizeType, s.measurements || {}, s.stock, s.isAvailable, i]
                );
            }
        }
        
        await client.query('COMMIT');
        
        const fullProduct = await enrichProductWithVariants(product);
        sendSuccess(res, fullProduct, 'Product created', 201);
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('❌ createFullProduct error:', error);
        sendError(res, error.message || 'Server error', 500);
    } finally {
        if (client) client.release();
    }
};

// @desc    Update basic product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, price, compare_price, stock_quantity, sku, category_id, is_featured } = req.body;
        const result = await pool.query(
            `UPDATE products SET name=$1, slug=$2, description=$3, price=$4, compare_price=$5, stock_quantity=$6, sku=$7, category_id=$8, is_featured=$9, updated_at=NOW()
             WHERE id=$10 RETURNING *`,
            [name, slug, description, price, compare_price, stock_quantity, sku, category_id, is_featured, id]
        );
        if (result.rows.length === 0) return sendError(res, 'Product not found', 404);
        sendSuccess(res, result.rows[0], 'Product updated');
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error', 500);
    }
};

// @desc    Update full product (replace colors & sizes)
const updateFullProduct = async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        const { name, slug, description, price, compare_price, stock_quantity, sku, category_id, is_featured, colors, sizes } = req.body;
        
        console.log('🟡 updateFullProduct - colors:', JSON.stringify(colors, null, 2));
        console.log('🟡 updateFullProduct - sizes:', JSON.stringify(sizes, null, 2));
        
        client = await pool.connect();
        await client.query('BEGIN');
        
        // Update product
        const productRes = await client.query(
            `UPDATE products SET name=$1, slug=$2, description=$3, price=$4, compare_price=$5, stock_quantity=$6, sku=$7, category_id=$8, is_featured=$9, updated_at=NOW()
             WHERE id=$10 RETURNING *`,
            [name, slug, description, price, compare_price, stock_quantity, sku, category_id, is_featured, id]
        );
        if (productRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return sendError(res, 'Product not found', 404);
        }
        
        // Delete existing colors and sizes
        await client.query(`DELETE FROM product_colors WHERE product_id = $1`, [id]);
        await client.query(`DELETE FROM product_sizes WHERE product_id = $1`, [id]);
        
        // Re-insert colors
        const colorIdMap = new Map();
        if (colors && colors.length) {
            for (const color of colors) {
                if (color.colorName && color.imageUrl) {
                    const colorRecord = await client.query(
                        `INSERT INTO product_colors (product_id, color_name, image_url)
                         VALUES ($1, $2, $3) RETURNING id`,
                        [id, color.colorName, color.imageUrl]
                    );
                    colorIdMap.set(color.colorName, colorRecord.rows[0].id);
                }
            }
        }
        
        // Re-insert sizes
        if (sizes && sizes.length) {
            for (let i = 0; i < sizes.length; i++) {
                const s = sizes[i];
                let colorId = null;
                if (s.colorName && s.colorName.trim() !== '') {
                    colorId = colorIdMap.get(s.colorName);
                    if (!colorId) console.warn(`⚠️ Color "${s.colorName}" not found`);
                } else if (s.colorId && typeof s.colorId === 'number') {
                    colorId = s.colorId;
                }
                await client.query(
                    `INSERT INTO product_sizes (product_id, color_id, size_name, size_type, measurements, stock, is_available, position)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [id, colorId, s.sizeName, s.sizeType, s.measurements || {}, s.stock, s.isAvailable, i]
                );
            }
        }
        
        await client.query('COMMIT');
        
        const updatedProduct = await enrichProductWithVariants(productRes.rows[0]);
        sendSuccess(res, updatedProduct, 'Product updated');
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('❌ updateFullProduct error:', error);
        sendError(res, error.message || 'Server error', 500);
    } finally {
        if (client) client.release();
    }
};

// @desc    Delete product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return sendError(res, 'Product not found', 404);
        sendSuccess(res, null, 'Product deleted');
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error', 500);
    }
};

// @desc    Upload product image
const uploadProductImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { color } = req.body;
        if (!req.file) return sendError(res, 'No image file uploaded', 400);
        const is_primary = req.body.is_primary === 'true';
        const alt_text = req.body.alt_text || 'product image';
        const upload = await saveUploadedImage(req.file, PRODUCT_UPLOAD_SUBDIR);

        if (is_primary) {
            await pool.query('UPDATE product_images SET is_primary = false WHERE product_id = $1', [id]);
        }

        const result = await pool.query(
            `INSERT INTO product_images (product_id, image_url, is_primary, alt_text, color, cloudinary_public_id)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [id, upload.url, is_primary, alt_text, color || null, upload.publicId]
        );
        sendSuccess(res, result.rows[0], 'Image uploaded', 201);
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Server error', 500);
    }
};

const setPrimaryProductImage = async (req, res) => {
    const { id, imageId } = req.params;

    try {
        await pool.query('BEGIN');
        await pool.query('UPDATE product_images SET is_primary = false WHERE product_id = $1', [id]);
        const result = await pool.query(
            'UPDATE product_images SET is_primary = true WHERE id = $1 AND product_id = $2 RETURNING *',
            [imageId, id]
        );

        if (result.rows.length === 0) {
            await pool.query('ROLLBACK');
            return sendError(res, 'Image not found', 404);
        }

        await pool.query('COMMIT');
        sendSuccess(res, result.rows[0], 'Primary image updated');
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error);
        sendError(res, 'Server error', 500);
    }
};

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    createFullProduct,
    updateProduct,
    updateFullProduct,
    deleteProduct,
    uploadProductImage,
    setPrimaryProductImage,
};
