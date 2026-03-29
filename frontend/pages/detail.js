// frontend/pages/detail.js
// Application detail page — shows full app info, interview timeline, and smart prep advice.

async function renderDetailPage({ id }) {
  const root = document.getElementById("app-root");

  if (!id) {
    root.innerHTML = `<div class="empty-state"><p>Invalid application ID.</p></div>`;
    return;
  }

  try {
    const { application: app, interviewRounds, prepAdvice } = await Applications.getOne(id);
    renderDetail(app, interviewRounds, prepAdvice);
  } catch (err) {
    root.innerHTML = `
      <div class="empty-state">
        <p>${getErrorMessage(err)}</p>
        <a href="#dashboard" class="btn btn-ghost">← Back to Dashboard</a>
      </div>
    `;
  }
}

function renderDetail(app, interviewRounds, prepAdvice) {
  const root = document.getElementById("app-root");

  root.innerHTML = `
    <div class="page">
      <!-- Back link + header -->
      <div class="page-header">
        <div class="breadcrumb">
          <a href="#dashboard" class="back-link">← Dashboard</a>
          <span class="breadcrumb-sep">/</span>
          <span>${app.companyName}</span>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost" id="btn-edit-app">Edit</button>
          <button class="btn btn-danger" id="btn-delete-app">Delete</button>
        </div>
      </div>

      <!-- App Info Card -->
      <div class="detail-card">
        <div class="detail-header">
          <div class="company-badge-large">${app.companyName[0].toUpperCase()}</div>
          <div class="detail-title-group">
            <h1 class="detail-company">${app.companyName}</h1>
            <p class="detail-role">${app.role}</p>
            <div class="detail-meta">
              ${UI.statusBadge(app.status)}
              <span class="meta-item">📅 Applied ${UI.formatDate(app.dateApplied)}</span>
              <span class="meta-item">🕒 Updated ${UI.formatDate(app.updatedAt)}</span>
            </div>
          </div>
        </div>
        ${app.notes ? `
          <div class="detail-notes">
            <h4>Notes</h4>
            <p>${app.notes}</p>
          </div>
        ` : ""}
      </div>

      <!-- Status Alert (from Smart Prep) -->
      ${prepAdvice.statusAlert ? renderStatusAlert(prepAdvice.statusAlert) : ""}

      <!-- Two-column layout: Interview Timeline + Prep Advice -->
      <div class="detail-grid">
        <!-- Interview Timeline -->
        <div class="detail-section">
          <div class="section-header">
            <h2>Interview Rounds</h2>
            <button class="btn btn-primary btn-sm" id="btn-add-round">+ Add Round</button>
          </div>

          <div id="rounds-container">
            ${interviewRounds.length === 0
              ? `<div class="empty-state-small">No interview rounds yet. Add your first one!</div>`
              : renderTimeline(interviewRounds, app.id)
            }
          </div>
        </div>

        <!-- Smart Prep Assistant -->
        <div class="detail-section">
          <div class="section-header">
            <h2>🤖 Smart Prep</h2>
            <span class="prep-label">${prepAdvice.roleLabel}</span>
          </div>

          <!-- Study Topics -->
          <div class="prep-card">
            <h4>📚 Study Topics for ${prepAdvice.roleLabel}</h4>
            <ul class="prep-list">
              ${prepAdvice.studyTopics.map(t => `<li>✦ ${t}</li>`).join("")}
            </ul>
          </div>

          <!-- Round-specific tips (only if upcoming rounds exist) -->
          ${prepAdvice.roundTips.length > 0 ? `
            <div class="prep-card">
              <h4>⚡ Upcoming Round Tips</h4>
              ${prepAdvice.roundTips.map(rt => `
                <div class="round-tip">
                  <p class="round-tip-label">${rt.roundType} — ${UI.formatDate(rt.date)}</p>
                  <ul class="prep-list">
                    ${rt.tips.map(t => `<li>→ ${t}</li>`).join("")}
                  </ul>
                </div>
              `).join("")}
            </div>
          ` : ""}

          <!-- General tips -->
          <div class="prep-card prep-card-subtle">
            <h4>💡 General Tips</h4>
            <ul class="prep-list">
              ${prepAdvice.generalTips.map(t => `<li>• ${t}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Round Modal -->
    <div class="modal-overlay hidden" id="round-modal">
      <div class="modal">
        <div class="modal-header">
          <h2 id="round-modal-title">Add Interview Round</h2>
          <button class="modal-close" id="close-round-modal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Round Type</label>
            <select id="r-type">
              <option value="HR">HR</option>
              <option value="Technical">Technical</option>
              <option value="System Design">System Design</option>
              <option value="Managerial/Behavioral">Managerial/Behavioral</option>
              <option value="Take-Home">Take-Home</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="r-date" value="${new Date().toISOString().split("T")[0]}" />
          </div>
          <div class="form-group">
            <label>Feedback / Notes</label>
            <textarea id="r-feedback" rows="3" placeholder="How did it go? What was asked?"></textarea>
          </div>
        </div>
        <div class="form-error hidden" id="round-error"></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="cancel-round-modal">Cancel</button>
          <button class="btn btn-primary" id="save-round-btn">Save Round</button>
        </div>
      </div>
    </div>

    <!-- Edit App Modal -->
    <div class="modal-overlay hidden" id="edit-modal">
      <div class="modal">
        <div class="modal-header">
          <h2>Edit Application</h2>
          <button class="modal-close" id="close-edit-modal">✕</button>
        </div>
        <div id="edit-form-container">
          ${renderEditForm(app)}
        </div>
        <div class="form-error hidden" id="edit-error"></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="cancel-edit-modal">Cancel</button>
          <button class="btn btn-primary" id="save-edit-btn">Save Changes</button>
        </div>
      </div>
    </div>
  `;

  // ── Event Listeners ──────────────────────────────────────────────────────────

  // Add round
  document.getElementById("btn-add-round").addEventListener("click", () => {
    document.getElementById("round-modal").classList.remove("hidden");
  });
  document.getElementById("close-round-modal").addEventListener("click", () => {
    document.getElementById("round-modal").classList.add("hidden");
  });
  document.getElementById("cancel-round-modal").addEventListener("click", () => {
    document.getElementById("round-modal").classList.add("hidden");
  });

  document.getElementById("save-round-btn").addEventListener("click", async () => {
    const roundType = document.getElementById("r-type").value;
    const date = document.getElementById("r-date").value;
    const feedback = document.getElementById("r-feedback").value;
    const errEl = document.getElementById("round-error");
    const btn = document.getElementById("save-round-btn");

    errEl.classList.add("hidden");
    if (!date) { errEl.textContent = "Date is required."; errEl.classList.remove("hidden"); return; }

    try {
      UI.setButtonLoading(btn, true);
      await Interviews.add(app.id, { roundType, date, feedback });
      UI.toast("Interview round added!", "success");
      document.getElementById("round-modal").classList.add("hidden");
      // Refresh page
      const { application, interviewRounds: rounds, prepAdvice } = await Applications.getOne(app.id);
      renderDetail(application, rounds, prepAdvice);
    } catch (err) {
      errEl.textContent = getErrorMessage(err);
      errEl.classList.remove("hidden");
    } finally {
      UI.setButtonLoading(btn, false);
    }
  });

  // Delete round
  document.querySelectorAll(".btn-delete-round").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const roundId = btn.dataset.roundId;
      if (!confirm("Delete this interview round?")) return;
      try {
        await Interviews.delete(app.id, roundId);
        UI.toast("Round deleted.", "info");
        const { application, interviewRounds: rounds, prepAdvice } = await Applications.getOne(app.id);
        renderDetail(application, rounds, prepAdvice);
      } catch (err) {
        UI.toast(getErrorMessage(err), "error");
      }
    });
  });

  // Edit application
  document.getElementById("btn-edit-app").addEventListener("click", () => {
    document.getElementById("edit-modal").classList.remove("hidden");
  });
  document.getElementById("close-edit-modal").addEventListener("click", () => {
    document.getElementById("edit-modal").classList.add("hidden");
  });
  document.getElementById("cancel-edit-modal").addEventListener("click", () => {
    document.getElementById("edit-modal").classList.add("hidden");
  });

  document.getElementById("save-edit-btn").addEventListener("click", async () => {
    const companyName = document.getElementById("e-company").value.trim();
    const role = document.getElementById("e-role").value.trim();
    const status = document.getElementById("e-status").value;
    const dateApplied = document.getElementById("e-date").value;
    const notes = document.getElementById("e-notes").value.trim();
    const errEl = document.getElementById("edit-error");
    const btn = document.getElementById("save-edit-btn");

    errEl.classList.add("hidden");
    if (!companyName || !role) {
      errEl.textContent = "Company name and role are required.";
      errEl.classList.remove("hidden");
      return;
    }

    try {
      UI.setButtonLoading(btn, true);
      await Applications.update(app.id, { companyName, role, status, dateApplied, notes });
      UI.toast("Application updated!", "success");
      const { application, interviewRounds: rounds, prepAdvice } = await Applications.getOne(app.id);
      renderDetail(application, rounds, prepAdvice);
    } catch (err) {
      errEl.textContent = getErrorMessage(err);
      errEl.classList.remove("hidden");
    } finally {
      UI.setButtonLoading(btn, false);
    }
  });

  // Delete application
  document.getElementById("btn-delete-app").addEventListener("click", async () => {
    if (!confirm(`Delete this application for ${app.companyName}? This cannot be undone.`)) return;
    try {
      await Applications.delete(app.id);
      UI.toast("Application deleted.", "info");
      Router.navigate("#dashboard");
    } catch (err) {
      UI.toast(getErrorMessage(err), "error");
    }
  });
}

// ── Timeline renderer ─────────────────────────────────────────────────────────
function renderTimeline(rounds, appId) {
  return `
    <div class="timeline">
      ${rounds.map((r, i) => `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          ${i < rounds.length - 1 ? `<div class="timeline-line"></div>` : ""}
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-type">${r.roundType}</span>
              <span class="timeline-date">${UI.formatDate(r.date)}</span>
              <button class="btn-icon btn-delete-round" data-round-id="${r.id}" title="Delete">🗑</button>
            </div>
            ${r.feedback
              ? `<p class="timeline-feedback">${r.feedback}</p>`
              : `<p class="timeline-feedback empty">No feedback added yet.</p>`
            }
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// ── Status alert renderer ────────────────────────────────────────────────────
function renderStatusAlert(alert) {
  const typeClass = {
    feedback_prompt: "alert-warning",
    success: "alert-success",
    action: "alert-info",
  }[alert.type] || "alert-info";

  return `
    <div class="status-alert ${typeClass}">
      <span class="alert-icon">${alert.type === "success" ? "🎉" : alert.type === "feedback_prompt" ? "💬" : "⚡"}</span>
      <p>${alert.message}</p>
    </div>
  `;
}

// ── Edit form ─────────────────────────────────────────────────────────────────
function renderEditForm(app) {
  return `
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Company Name *</label>
          <input type="text" id="e-company" value="${app.companyName}" />
        </div>
        <div class="form-group">
          <label>Role *</label>
          <input type="text" id="e-role" value="${app.role}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Status</label>
          <select id="e-status">
            ${["Applied","OA","Interview","Rejected","Offer"].map(s =>
              `<option value="${s}" ${app.status === s ? "selected" : ""}>${s}</option>`
            ).join("")}
          </select>
        </div>
        <div class="form-group">
          <label>Date Applied</label>
          <input type="date" id="e-date" value="${app.dateApplied}" />
        </div>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea id="e-notes" rows="3">${app.notes || ""}</textarea>
      </div>
    </div>
  `;
}
