// routes/auth.js
const express = require("express");
const router = express.Router();
const { signup, login, getMe } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

// POST /api/auth/signup — Register a new user
router.post("/signup", signup);

// POST /api/auth/login — Login and get JWT
router.post("/login", login);

// GET /api/auth/me — Get current user (protected)
router.get("/me", authenticate, getMe);

module.exports = router;
