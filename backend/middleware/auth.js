// middleware/auth.js
// This middleware protects routes — any route that needs a logged-in user
// must go through this. It reads the JWT from the Authorization header.

const jwt = require("jsonwebtoken");
const { UserModel } = require("../models/store");

const JWT_SECRET = process.env.JWT_SECRET || "interview_tracker_secret_key_2024";

/**
 * authenticate — Express middleware
 * Extracts and verifies the JWT, attaches the user to req.user
 */
const authenticate = (req, res, next) => {
  // JWT is sent as: "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided. Please log in." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // jwt.verify() throws if token is invalid or expired
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if the user still exists (in case they were deleted)
    const user = UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found. Please log in again." });
    }

    // Attach a safe version of the user (no password hash)
    req.user = { id: user.id, username: user.username, email: user.email };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please log in again." });
    }
    return res.status(401).json({ error: "Invalid token. Please log in." });
  }
};

/**
 * generateToken — creates a signed JWT for a user
 * @param {string} userId
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

module.exports = { authenticate, generateToken };
