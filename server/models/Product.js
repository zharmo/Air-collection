const pool = require('../config/db');

const getAllProducts = async (filters = {}) => {
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

  if (filters.categoryId) {
    query += ` AND p.category_id = $${i}`;
    values.push(filters.categoryId);
    i++;
  }
  if (filters.search) {
    query += ` AND (p.name ILIKE $${i} OR p.description ILIKE $${i})`;
    values.push(`%${filters.search}%`);
    i++;
  }
  if (filters.minPrice) {
    query += ` AND p.price >= $${i}`;
    values.push(filters.minPrice);
    i++;
  }
  if (filters.maxPrice) {
    query += ` AND p.price <= $${i}`;
    values.push(filters.maxPrice);
    i++;
  }

  query += ` ORDER BY p.created_at DESC`;

  const result = await pool.query(query, values);
  return result.rows;
};

const getProductById = async (id) => {
  const productResult = await pool.query(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = $1`,
    [id]
  );
  if (productResult.rows.length === 0) return null;

  const product = productResult.rows[0];
  const imagesResult = await pool.query(
    `SELECT id, image_url, is_primary, alt_text FROM product_images WHERE product_id = $1`,
    [id]
  );
  product.images = imagesResult.rows;
  return product;
};

const createProduct = async (productData) => {
  const { name, slug, description, price, compare_price, stock_quantity, sku, category_id, is_featured } = productData;
  const result = await pool.query(
    `INSERT INTO products (name, slug, description, price, compare_price, stock_quantity, sku, category_id, is_featured)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [name, slug, description, price, compare_price, stock_quantity, sku, category_id, is_featured || false]
  );
  return result.rows[0];
};

const updateProduct = async (id, updates) => {
  const fields = [];
  const values = [];
  let i = 1;
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = $${i}`);
      values.push(value);
      i++;
    }
  }
  values.push(id);
  const query = `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

const deleteProduct = async (id) => {
  await pool.query('DELETE FROM products WHERE id = $1', [id]);
};

const addProductImage = async (product_id, image_url, is_primary = false, alt_text = null) => {
  if (is_primary) {
    // Remove other primary images for this product
    await pool.query('UPDATE product_images SET is_primary = false WHERE product_id = $1', [product_id]);
  }
  const result = await pool.query(
    `INSERT INTO product_images (product_id, image_url, is_primary, alt_text)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [product_id, image_url, is_primary, alt_text]
  );
  return result.rows[0];
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
};