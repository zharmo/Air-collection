const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendError } = require('../utils/responseHandler');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from DB
      const result = await pool.query(
        'SELECT id, name, email, role FROM users WHERE id = $1 AND is_active = true',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return sendError(res, 'User not found or inactive', 401);
      }

      req.user = result.rows[0];
      next();
    } catch (error) {
      console.error(error);
      return sendError(res, 'Not authorized, token failed', 401);
    }
  }

  if (!token) {
    return sendError(res, 'Not authorized, no token', 401);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    sendError(res, 'Access denied. Admin only.', 403);
  }
};

module.exports = { protect, adminOnly };