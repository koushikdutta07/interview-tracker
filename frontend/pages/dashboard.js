// frontend/pages/dashboard.js
// Main dashboard — shows all applications with stats, search, and filter.

async function renderDashboard() {
  const root = document.getElementById("app-root");

  // Show skeleton while loading
  root.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">Track your job applications</p>
        </div>
        <button class="btn btn-primary" id="btn-add-app">+ Add Application</button>
      </div>
      <div class="stats-row skeleton-row">
        ${[1,2,3,4,5].map(() => `<div class="stat-card skeleton"></div>`).join("")}
      </div>
      <div class="toolbar skeleton-row"></div>
      <div class="app-list skeleton-list"></div>
    </div>
  `;

  try {
    // Load data with initial filters
    await loadDashboardData();

    document.getElementById("btn-add-app")?.addEventListener("click", () => {
      showAddApplicationModal();
    });
  } catch (err) {
    root.innerHTML = `<div class="empty-state"><p>Failed to load dashboard: ${getErrorMessage(err)}</p></div>`;
  }
}

async function loadDashboardData(search = "", statusFilter = "") {
  const root = document.getElementById("app-root");

  try {
    const { applications, stats } = await Applications.getAll({ search, status: statusFilter });

    // Re-render the full page content
    root.innerHTML = `
      <div class="page">
        <div class="page-header">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-sub">Hello, ${AppState.user.username} 👋 — Here's your job hunt overview</p>
          </div>
          <button class="btn btn-primary" id="btn-add-app">+ Add Application</button>
        </div>

        <!-- Stats Row -->
        <div class="stats-row">
          ${renderStatCard("Total", stats.total, "📋", "")}
          ${renderStatCard("Applied", stats.byStatus.Applied, "📤", "applied")}
          ${renderStatCard("In Progress", (stats.byStatus.OA || 0) + (stats.byStatus.Interview || 0), "⚡", "interview")}
          ${renderStatCard("Offers", stats.byStatus.Offer, "🎉", "offer")}
          ${renderStatCard("Rejected", stats.byStatus.Rejected, "✕", "rejected")}
        </div>

        <!-- Search & Filter Toolbar -->
        <div class="toolbar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              id="search-input"
              placeholder="Search company, role, notes…"
              value="${search}"
              class="search-input"
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">Status:</label>
            ${["", "Applied", "OA", "Interview", "Rejected", "Offer"].map(s =>
              `<button class="filter-btn ${statusFilter === s ? "active" : ""}" data-status="${s}">
                ${s || "All"}
              </button>`
            ).join("")}
          </div>
        </div>

        <!-- Applications List -->
        <div class="app-list" id="app-list">
          ${applications.length === 0
            ? `<div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>No applications yet</h3>
                <p>${search || statusFilter ? "No results match your filters." : "Add your first job application to get started."}</p>
                ${!search && !statusFilter ? `<button class="btn btn-primary" id="btn-add-first">+ Add Application</button>` : ""}
              </div>`
            : applications.map(renderAppCard).join("")
          }
        </div>
      </div>

      <!-- Add Application Modal -->
      <div class="modal-overlay hidden" id="add-modal">
        <div class="modal">
          <div class="modal-header">
            <h2>Add Application</h2>
            <button class="modal-close" id="close-modal">✕</button>
          </div>
          ${renderApplicationForm()}
          <div class="form-error hidden" id="app-form-error"></div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="cancel-modal">Cancel</button>
            <button class="btn btn-primary" id="save-app-btn">Save Application</button>
          </div>
        </div>
      </div>
    `;

    // ── Event Listeners ──────────────────────────────────────────────────────

    // Add application button
    document.getElementById("btn-add-app")?.addEventListener("click", () => {
      document.getElementById("add-modal").classList.remove("hidden");
    });
    document.getElementById("btn-add-first")?.addEventListener("click", () => {
      document.getElementById("add-modal").classList.remove("hidden");
    });

    // Close modal
    document.getElementById("close-modal")?.addEventListener("click", closeModal);
    document.getElementById("cancel-modal")?.addEventListener("click", closeModal);
    document.getElementById("add-modal")?.addEventListener("click", (e) => {
      if (e.target.id === "add-modal") closeModal();
    });

    // Save application
    document.getElementById("save-app-btn")?.addEventListener("click", handleSaveApplication);

    // Search (debounced)
    let searchTimer;
    document.getElementById("search-input")?.addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        loadDashboardData(e.target.value, statusFilter);
      }, 300);
    });

    // Status filter buttons
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        loadDashboardData(search, btn.dataset.status);
      });
    });

    // Click on application card → go to detail page
    document.querySelectorAll(".app-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        // Don't navigate if clicking delete button
        if (e.target.closest(".btn-delete-app")) return;
        Router.navigate(`#app/${card.dataset.id}`);
      });
    });

    // Delete application
    document.querySelectorAll(".btn-delete-app").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const company = btn.dataset.company;
        if (!confirm(`Delete application for ${company}? This cannot be undone.`)) return;
        try {
          await Applications.delete(id);
          UI.toast("Application deleted.", "info");
          loadDashboardData(search, statusFilter);
        } catch (err) {
          UI.toast(getErrorMessage(err), "error");
        }
      });
    });

  } catch (err) {
    UI.toast(getErrorMessage(err), "error");
  }
}

// ── Helper: render a stat card ────────────────────────────────────────────────
function renderStatCard(label, count, icon, type) {
  return `
    <div class="stat-card stat-${type}">
      <div class="stat-icon">${icon}</div>
      <div class="stat-count">${count || 0}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}

// ── Helper: render a single app card ─────────────────────────────────────────
function renderAppCard(app) {
  return `
    <div class="app-card" data-id="${app.id}">
      <div class="app-card-main">
        <div class="app-card-left">
          <div class="company-initial">${app.companyName[0].toUpperCase()}</div>
          <div class="app-info">
            <h3 class="app-company">${app.companyName}</h3>
            <p class="app-role">${app.role}</p>
          </div>
        </div>
        <div class="app-card-right">
          ${UI.statusBadge(app.status)}
          <span class="app-date">${UI.formatDate(app.dateApplied)}</span>
          <button class="btn-icon btn-delete-app" data-id="${app.id}" data-company="${app.companyName}" title="Delete">🗑</button>
        </div>
      </div>
      ${app.notes ? `<p class="app-notes">${app.notes.slice(0, 100)}${app.notes.length > 100 ? "…" : ""}</p>` : ""}
    </div>
  `;
}

// ── Helper: application form HTML ─────────────────────────────────────────────
function renderApplicationForm(app = {}) {
  return `
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Company Name *</label>
          <input type="text" id="f-company" placeholder="e.g. Google" value="${app.companyName || ""}" />
        </div>
        <div class="form-group">
          <label>Role *</label>
          <input type="text" id="f-role" placeholder="e.g. Backend Engineer" value="${app.role || ""}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Status</label>
          <select id="f-status">
            ${["Applied","OA","Interview","Rejected","Offer"].map(s =>
              `<option value="${s}" ${app.status === s ? "selected" : ""}>${s}</option>`
            ).join("")}
          </select>
        </div>
        <div class="form-group">
          <label>Date Applied</label>
          <input type="date" id="f-date" value="${app.dateApplied || new Date().toISOString().split("T")[0]}" />
        </div>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea id="f-notes" rows="3" placeholder="Referral, job link, notes…">${app.notes || ""}</textarea>
      </div>
    </div>
  `;
}

// ── Handle form submit ────────────────────────────────────────────────────────
async function handleSaveApplication() {
  const companyName = document.getElementById("f-company").value.trim();
  const role = document.getElementById("f-role").value.trim();
  const status = document.getElementById("f-status").value;
  const dateApplied = document.getElementById("f-date").value;
  const notes = document.getElementById("f-notes").value.trim();
  const errEl = document.getElementById("app-form-error");
  const btn = document.getElementById("save-app-btn");

  errEl.classList.add("hidden");

  if (!companyName || !role) {
    errEl.textContent = "Company name and role are required.";
    errEl.classList.remove("hidden");
    return;
  }

  try {
    UI.setButtonLoading(btn, true);
    await Applications.create({ companyName, role, status, dateApplied, notes });
    UI.toast("Application added! 🎉", "success");
    closeModal();
    loadDashboardData();
  } catch (err) {
    errEl.textContent = getErrorMessage(err);
    errEl.classList.remove("hidden");
  } finally {
    UI.setButtonLoading(btn, false);
  }
}

function closeModal() {
  document.getElementById("add-modal")?.classList.add("hidden");
}
