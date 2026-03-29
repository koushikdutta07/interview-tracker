// controllers/authController.js
// Handles user registration and login logic.

const bcrypt = require("bcryptjs");
const { UserModel } = require("../models/store");
const { generateToken } = require("../middleware/auth");
const { createError } = require("../middleware/errorHandler");

/**
 * POST /api/auth/signup
 * Body: { username, email, password }
 */
const signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // ── Validate inputs ──────────────────────────────────────────────────────
    if (!username || !email || !password) {
      throw createError("Username, email, and password are required.");
    }
    if (password.length < 6) {
      throw createError("Password must be at least 6 characters.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError("Please provide a valid email address.");
    }

    // ── Check for duplicate email ────────────────────────────────────────────
    const existingUser = UserModel.findByEmail(email);
    if (existingUser) {
      throw createError("An account with this email already exists.", 409);
    }

    // ── Hash password (bcrypt, salt rounds = 10) ─────────────────────────────
    // Never store plain text passwords!
    const passwordHash = await bcrypt.hash(password, 10);

    // ── Save user ────────────────────────────────────────────────────────────
    const user = UserModel.create({ username, email, passwordHash });

    // ── Generate JWT ─────────────────────────────────────────────────────────
    const token = generateToken(user.id);

    res.status(201).json({
      message: "Account created successfully!",
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createError("Email and password are required.");
    }

    // ── Find user ────────────────────────────────────────────────────────────
    const user = UserModel.findByEmail(email);
    if (!user) {
      // Generic message prevents email enumeration attacks
      throw createError("Invalid email or password.", 401);
    }

    // ── Compare password ─────────────────────────────────────────────────────
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw createError("Invalid email or password.", 401);
    }

    // ── Generate JWT ─────────────────────────────────────────────────────────
    const token = generateToken(user.id);

    res.json({
      message: "Login successful!",
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns current user info (uses authenticate middleware)
 */
const getMe = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { signup, login, getMe };
