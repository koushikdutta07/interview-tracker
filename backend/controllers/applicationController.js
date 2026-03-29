// controllers/applicationController.js
// CRUD operations for job applications + smart prep advice generation.

const { ApplicationModel, InterviewModel } = require("../models/store");
const { createError } = require("../middleware/errorHandler");
const { generatePrepAdvice } = require("./prepService");

// Valid status values — enforced on create/update
const VALID_STATUSES = ["Applied", "OA", "Interview", "Rejected", "Offer"];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/applications
// Returns all applications for the logged-in user.
// Supports: ?search=<query>  ?status=<status>
// ─────────────────────────────────────────────────────────────────────────────
const getApplications = (req, res, next) => {
  try {
    let apps = ApplicationModel.findAllByUser(req.user.id);

    // ── Search filter (searches company name, role, and notes) ───────────────
    const { search, status } = req.query;
    if (search) {
      const q = search.toLowerCase();
      apps = apps.filter(
        (a) =>
          a.companyName.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          a.notes.toLowerCase().includes(q)
      );
    }

    // ── Status filter ─────────────────────────────────────────────────────────
    if (status && VALID_STATUSES.includes(status)) {
      apps = apps.filter((a) => a.status === status);
    }

    // ── Sort: most recently updated first ────────────────────────────────────
    apps.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // ── Stats summary (useful for dashboard) ─────────────────────────────────
    const stats = {
      total: apps.length,
      byStatus: VALID_STATUSES.reduce((acc, s) => {
        acc[s] = apps.filter((a) => a.status === s).length;
        return acc;
      }, {}),
    };

    res.json({ applications: apps, stats });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/applications/:id
// Returns a single application with its interview rounds + prep advice.
// ─────────────────────────────────────────────────────────────────────────────
const getApplication = (req, res, next) => {
  try {
    const app = ApplicationModel.findById(req.params.id);

    if (!app) throw createError("Application not found.", 404);
    // Authorization check: ensure this app belongs to the current user
    if (app.userId !== req.user.id) throw createError("Not authorized.", 403);

    // Fetch associated interview rounds
    const rounds = InterviewModel.findByApplication(app.id);

    // Generate smart prep advice (backend logic!)
    const prepAdvice = generatePrepAdvice(app, rounds);

    res.json({ application: app, interviewRounds: rounds, prepAdvice });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applications
// Create a new job application.
// ─────────────────────────────────────────────────────────────────────────────
const createApplication = (req, res, next) => {
  try {
    const { companyName, role, status, dateApplied, notes } = req.body;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!companyName || !role) {
      throw createError("Company name and role are required.");
    }
    if (status && !VALID_STATUSES.includes(status)) {
      throw createError(`Status must be one of: ${VALID_STATUSES.join(", ")}.`);
    }

    const app = ApplicationModel.create({
      userId: req.user.id,
      companyName: companyName.trim(),
      role: role.trim(),
      status: status || "Applied",
      dateApplied,
      notes: notes || "",
    });

    res.status(201).json({
      message: "Application added!",
      application: app,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/applications/:id
// Update an existing application (partial update supported).
// ─────────────────────────────────────────────────────────────────────────────
const updateApplication = (req, res, next) => {
  try {
    const app = ApplicationModel.findById(req.params.id);
    if (!app) throw createError("Application not found.", 404);
    if (app.userId !== req.user.id) throw createError("Not authorized.", 403);

    const { companyName, role, status, dateApplied, notes } = req.body;

    if (status && !VALID_STATUSES.includes(status)) {
      throw createError(`Status must be one of: ${VALID_STATUSES.join(", ")}.`);
    }

    // Only update fields that were provided
    const updates = {};
    if (companyName !== undefined) updates.companyName = companyName.trim();
    if (role !== undefined) updates.role = role.trim();
    if (status !== undefined) updates.status = status;
    if (dateApplied !== undefined) updates.dateApplied = dateApplied;
    if (notes !== undefined) updates.notes = notes;

    const updated = ApplicationModel.update(app.id, updates);

    res.json({ message: "Application updated!", application: updated });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/applications/:id
// Deletes an application and all its interview rounds (cascade).
// ─────────────────────────────────────────────────────────────────────────────
const deleteApplication = (req, res, next) => {
  try {
    const app = ApplicationModel.findById(req.params.id);
    if (!app) throw createError("Application not found.", 404);
    if (app.userId !== req.user.id) throw createError("Not authorized.", 403);

    ApplicationModel.delete(app.id);

    res.json({ message: "Application deleted." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
};
