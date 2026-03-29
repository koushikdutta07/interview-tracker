// routes/applications.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
} = require("../controllers/applicationController");
const {
  getInterviews,
  addInterview,
  updateInterview,
  deleteInterview,
} = require("../controllers/interviewController");

// All application routes require authentication
router.use(authenticate);

// ── Application CRUD ──────────────────────────────────────────────────────────
router.get("/", getApplications);           // GET  /api/applications
router.post("/", createApplication);        // POST /api/applications
router.get("/:id", getApplication);         // GET  /api/applications/:id
router.put("/:id", updateApplication);      // PUT  /api/applications/:id
router.delete("/:id", deleteApplication);   // DELETE /api/applications/:id

// ── Interview Rounds (nested under applications) ──────────────────────────────
router.get("/:appId/interviews", getInterviews);                        // GET all rounds
router.post("/:appId/interviews", addInterview);                        // Add round
router.put("/:appId/interviews/:roundId", updateInterview);             // Update round
router.delete("/:appId/interviews/:roundId", deleteInterview);          // Delete round

module.exports = router;
