const pool = require('../config/db');

const addProductColor = async (productId, colorName, imageUrl) => {
    const result = await pool.query(
        `INSERT INTO product_colors (product_id, color_name, image_url)
         VALUES ($1, $2, $3) RETURNING *`,
        [productId, colorName, imageUrl]
    );
    return result.rows[0];
};

const getProductColors = async (productId) => {
    const result = await pool.query(
        `SELECT id, color_name, image_url FROM product_colors WHERE product_id = $1 ORDER BY id`,
        [productId]
    );
    return result.rows;
};

const deleteProductColors = async (productId) => {
    await pool.query(`DELETE FROM product_colors WHERE product_id = $1`, [productId]);
};

// IMPORTANT: colorId can be NULL (size applies to all colors) or specific color ID
const addProductSize = async (productId, colorId, sizeName, sizeType, measurements, stock, isAvailable, position = 0) => {
    const result = await pool.query(
        `INSERT INTO product_sizes (product_id, color_id, size_name, size_type, measurements, stock, is_available, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [productId, colorId, sizeName, sizeType, measurements, stock, isAvailable, position]
    );
    return result.rows[0];
};

const getProductSizes = async (productId, colorId = null) => {
    let query = `SELECT id, color_id, size_name, size_type, measurements, stock, is_available 
                 FROM product_sizes WHERE product_id = $1`;
    const values = [productId];
    if (colorId !== null) {
        query += ` AND color_id = $2`;
        values.push(colorId);
    }
    query += ` ORDER BY position, id`;
    const result = await pool.query(query, values);
    return result.rows;
};

const deleteProductSizes = async (productId, colorId = null) => {
    if (colorId) {
        await pool.query(`DELETE FROM product_sizes WHERE product_id = $1 AND color_id = $2`, [productId, colorId]);
    } else {
        await pool.query(`DELETE FROM product_sizes WHERE product_id = $1`, [productId]);
    }
};

module.exports = {
    addProductColor,
    getProductColors,
    deleteProductColors,
    addProductSize,
    getProductSizes,
    deleteProductSizes,
};