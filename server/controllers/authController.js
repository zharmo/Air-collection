const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/db');
const { findUserByEmail, createUser, setResetToken, findByResetToken, updateUserPassword } = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { isValidEmail, isValidPassword } = require('../utils/validators');
const { sendPasswordResetEmail } = require('../services/emailService');

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Please provide name, email and password', 400);
    }
    if (!isValidEmail(email)) {
      return sendError(res, 'Invalid email format', 400);
    }
    if (!isValidPassword(password)) {
      return sendError(res, 'Password must be at least 6 characters', 400);
    }

    const userExists = await findUserByEmail(email);
    if (userExists) {
      return sendError(res, 'User already exists', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await createUser(name, email, hashedPassword, 'customer');

    const token = generateToken(newUser.id, newUser.role);

    sendSuccess(res, { user: newUser, token }, 'Registration successful', 201);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Please provide email and password', 400);
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', 401);
    }

    if (!user.is_active) {
      return sendError(res, 'Account disabled. Contact admin.', 401);
    }

    const token = generateToken(user.id, user.role);

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    sendSuccess(res, { user: userData, token }, 'Login successful');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Forgot password - send reset link via email
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'Email is required', 400);

    const user = await findUserByEmail(email);
    // For security, always return success message even if email doesn't exist
    if (!user) {
      return sendSuccess(res, null, 'If that email exists, a reset link has been sent');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await setResetToken(email, hashedToken, expires);

    // Send actual email
    const emailSent = await sendPasswordResetEmail(email, resetToken);

    if (!emailSent) {
      console.error(`Failed to send reset email to ${email}`);
      // Still return success to avoid leaking existence
      return sendSuccess(res, null, 'If that email exists, a reset link has been sent');
    }

    sendSuccess(res, null, 'Password reset link sent to your email');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return sendError(res, 'Token and new password are required', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await findByResetToken(hashedToken);
    if (!user) {
      return sendError(res, 'Invalid or expired reset token', 400);
    }

    if (!isValidPassword(newPassword)) {
      return sendError(res, 'Password must be at least 6 characters', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await updateUserPassword(user.id, hashedPassword);

    // Clear reset token fields
    await pool.query(
      'UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = $1',
      [user.id]
    );

    sendSuccess(res, null, 'Password reset successful. You can now login.');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };