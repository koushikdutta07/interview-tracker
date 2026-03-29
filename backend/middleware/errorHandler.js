// middleware/errorHandler.js
// Centralized error handling — all errors bubble up here via next(err)
// This keeps error logic in one place instead of scattered across controllers.

const errorHandler = (err, req, res, next) => {
  // Log the error for debugging (in production, use a logger like Winston)
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(403).json({ error: err.message });
  }

  // Default: internal server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || "Something went wrong on the server.",
  });
};

// Helper to create custom errors with a status code
const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { errorHandler, createError };
