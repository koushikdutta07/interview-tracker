// controllers/interviewController.js
// Manages interview rounds attached to an application.

const { ApplicationModel, InterviewModel } = require("../models/store");
const { createError } = require("../middleware/errorHandler");

const VALID_ROUND_TYPES = ["HR", "Technical", "System Design", "Managerial/Behavioral", "Take-Home", "Other"];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/applications/:appId/interviews
// Get all rounds for an application.
// ─────────────────────────────────────────────────────────────────────────────
const getInterviews = (req, res, next) => {
  try {
    const app = ApplicationModel.findById(req.params.appId);
    if (!app) throw createError("Application not found.", 404);
    if (app.userId !== req.user.id) throw createError("Not authorized.", 403);

    const rounds = InterviewModel.findByApplication(app.id);
    res.json({ interviewRounds: rounds });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applications/:appId/interviews
// Add an interview round to an application.
// ─────────────────────────────────────────────────────────────────────────────
const addInterview = (req, res, next) => {
  try {
    const app = ApplicationModel.findById(req.params.appId);
    if (!app) throw createError("Application not found.", 404);
    if (app.userId !== req.user.id) throw createError("Not authorized.", 403);

    const { roundType, date, feedback } = req.body;

    if (!roundType || !date) {
      throw createError("Round type and date are required.");
    }

    const round = InterviewModel.create({
      applicationId: app.id,
      userId: req.user.id,
      roundType,
      date,
      feedback: feedback || "",
    });

    // Auto-update application status to "Interview" if it's still "Applied" or "OA"
    if (app.status === "Applied" || app.status === "OA") {
      ApplicationModel.update(app.id, { status: "Interview" });
    }

    res.status(201).json({ message: "Interview round added!", interviewRound: round });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/applications/:appId/interviews/:roundId
// Update feedback or details for an interview round.
// ─────────────────────────────────────────────────────────────────────────────
const updateInterview = (req, res, next) => {
  try {
    const app = ApplicationModel.findById(req.params.appId);
    if (!app) throw createError("Application not found.", 404);
    if (app.userId !== req.user.id) throw createError("Not authorized.", 403);

    const round = InterviewModel.findById(req.params.roundId);
    if (!round) throw createError("Interview round not found.", 404);
    if (round.applicationId !== app.id) throw createError("Round does not belong to this application.", 400);

    const { roundType, date, feedback } = req.body;
    const updates = {};
    if (roundType !== undefined) updates.roundType = roundType;
    if (date !== undefined) updates.date = date;
    if (feedback !== undefined) updates.feedback = feedback;

    const updated = InterviewModel.update(round.id, updates);
    res.json({ message: "Interview round updated!", interviewRound: updated });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/applications/:appId/interviews/:roundId
// ─────────────────────────────────────────────────────────────────────────────
const deleteInterview = (req, res, next) => {
  try {
    const app = ApplicationModel.findById(req.params.appId);
    if (!app) throw createError("Application not found.", 404);
    if (app.userId !== req.user.id) throw createError("Not authorized.", 403);

    const round = InterviewModel.findById(req.params.roundId);
    if (!round) throw createError("Interview round not found.", 404);

    InterviewModel.delete(round.id);
    res.json({ message: "Interview round deleted." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getInterviews, addInterview, updateInterview, deleteInterview };
