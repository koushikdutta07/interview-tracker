// models/store.js
// Simple in-memory database — acts like a "database" for this project.
// In a real app, you'd replace this with MongoDB, PostgreSQL, etc.

const { v4: uuidv4 } = require("uuid");

// ─── DATA STORE ───────────────────────────────────────────────────────────────

const db = {
  users: [],         // { id, username, email, passwordHash, createdAt }
  applications: [],  // { id, userId, companyName, role, status, dateApplied, notes, createdAt, updatedAt }
  interviews: [],    // { id, applicationId, userId, roundType, date, feedback, createdAt }
};

// ─── USER MODEL ───────────────────────────────────────────────────────────────

const UserModel = {
  create({ username, email, passwordHash }) {
    const user = {
      id: uuidv4(),
      username,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return user;
  },

  findByEmail(email) {
    return db.users.find((u) => u.email === email) || null;
  },

  findById(id) {
    return db.users.find((u) => u.id === id) || null;
  },
};

// ─── APPLICATION MODEL ────────────────────────────────────────────────────────

const ApplicationModel = {
  create({ userId, companyName, role, status, dateApplied, notes }) {
    const app = {
      id: uuidv4(),
      userId,
      companyName,
      role,
      status: status || "Applied",
      dateApplied: dateApplied || new Date().toISOString().split("T")[0],
      notes: notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.applications.push(app);
    return app;
  },

  findAllByUser(userId) {
    return db.applications.filter((a) => a.userId === userId);
  },

  findById(id) {
    return db.applications.find((a) => a.id === id) || null;
  },

  update(id, updates) {
    const idx = db.applications.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    db.applications[idx] = {
      ...db.applications[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return db.applications[idx];
  },

  delete(id) {
    const idx = db.applications.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    db.applications.splice(idx, 1);
    // Cascade delete interview rounds
    db.interviews = db.interviews.filter((i) => i.applicationId !== id);
    return true;
  },
};

// ─── INTERVIEW ROUND MODEL ────────────────────────────────────────────────────

const InterviewModel = {
  create({ applicationId, userId, roundType, date, feedback }) {
    const round = {
      id: uuidv4(),
      applicationId,
      userId,
      roundType,
      date,
      feedback: feedback || "",
      createdAt: new Date().toISOString(),
    };
    db.interviews.push(round);
    return round;
  },

  findByApplication(applicationId) {
    return db.interviews
      .filter((i) => i.applicationId === applicationId)
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // sorted by date
  },

  findById(id) {
    return db.interviews.find((i) => i.id === id) || null;
  },

  update(id, updates) {
    const idx = db.interviews.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    db.interviews[idx] = { ...db.interviews[idx], ...updates };
    return db.interviews[idx];
  },

  delete(id) {
    const idx = db.interviews.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    db.interviews.splice(idx, 1);
    return true;
  },
};

module.exports = { UserModel, ApplicationModel, InterviewModel };
