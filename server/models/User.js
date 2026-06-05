const pool = require('../config/db');

const createUser = async (name, email, hashedPassword, role = 'customer') => {
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, hashedPassword, role]
  );
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const findUserById = async (id) => {
  const result = await pool.query(
    'SELECT id, name, email, role, avatar, is_active, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const updateUserPassword = async (userId, hashedPassword) => {
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
};

const setResetToken = async (email, token, expires) => {
  await pool.query(
    'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
    [token, expires, email]
  );
};

const findByResetToken = async (token) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()`,
    [token]
  );
  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserPassword,
  setResetToken,
  findByResetToken,
};