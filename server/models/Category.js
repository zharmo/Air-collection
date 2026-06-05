const pool = require('../config/db');

const getAllCategories = async () => {
  const result = await pool.query(
    `SELECT id, name, slug, description, image, parent_id, is_active
     FROM categories
     ORDER BY name`
  );
  return result.rows;
};

const getCategoryById = async (id) => {
  const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
  return result.rows[0];
};

const createCategory = async (name, slug, description, image = null, parent_id = null) => {
  const result = await pool.query(
    `INSERT INTO categories (name, slug, description, image, parent_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, slug, description, image, parent_id]
  );
  return result.rows[0];
};

const updateCategory = async (id, updates) => {
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
  const query = `UPDATE categories SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

const deleteCategory = async (id) => {
  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};