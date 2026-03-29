// server.js — Entry point for the Express backend
// ─────────────────────────────────────────────────────────────────────────────
// Interview Tracker + Smart Prep Assistant
// Backend: Node.js + Express + In-Memory Store + JWT Auth
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const applicationRoutes = require("./routes/applications");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────

// Allow cross-origin requests (needed when frontend and backend run separately)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve static frontend files from the /frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);

// Health check endpoint — useful for deployment & testing
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Catch-all: serve frontend for any non-API route ─────────────────────────
// This enables client-side routing (e.g., navigating directly to /dashboard)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ─── Centralized Error Handler (must be last middleware) ─────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   Interview Tracker + Smart Prep Assistant    ║
║   Server running → http://localhost:${PORT}      ║
╚═══════════════════════════════════════════════╝
  `);
});

module.exports = app;
