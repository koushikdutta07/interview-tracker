// frontend/app.js
// ─────────────────────────────────────────────────────────────────────────────
// App Router + State Management (vanilla JS SPA)
// Uses URL hash (#login, #dashboard, #app/:id) for navigation
// ─────────────────────────────────────────────────────────────────────────────

// ── App State ─────────────────────────────────────────────────────────────────
const AppState = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token") || null,

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },

  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  isLoggedIn() {
    return !!this.token && !!this.user;
  },
};

// ── UI Utilities ──────────────────────────────────────────────────────────────
const UI = {
  // Show a toast notification
  toast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    // Animate in
    setTimeout(() => toast.classList.add("show"), 10);
    // Animate out and remove
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  // Show/hide loading state on a button
  setButtonLoading(btn, loading) {
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = "Loading…";
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.originalText || btn.textContent;
      btn.disabled = false;
    }
  },

  // Format date string for display
  formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  },

  // Status badge HTML
  statusBadge(status) {
    const map = {
      Applied: "badge-applied",
      OA: "badge-oa",
      Interview: "badge-interview",
      Rejected: "badge-rejected",
      Offer: "badge-offer",
    };
    return `<span class="badge ${map[status] || ""}">${status}</span>`;
  },
};

// ── Router ─────────────────────────────────────────────────────────────────────
const Router = {
  routes: {},

  register(hash, handler) {
    this.routes[hash] = handler;
  },

  async navigate(hash) {
    window.location.hash = hash;
  },

  async handleRoute() {
    const hash = window.location.hash || "#login";
    const appRoot = document.getElementById("app-root");

    // Guard: redirect to login if not authenticated
    if (!AppState.isLoggedIn() && hash !== "#login" && hash !== "#signup") {
      window.location.hash = "#login";
      return;
    }
    // Guard: redirect to dashboard if already logged in
    if (AppState.isLoggedIn() && (hash === "#login" || hash === "#signup")) {
      window.location.hash = "#dashboard";
      return;
    }

    // Match route (support params like #app/123)
    let handler = this.routes[hash];
    let params = {};

    if (!handler) {
      // Try parameterized routes
      for (const [pattern, fn] of Object.entries(this.routes)) {
        const paramMatch = pattern.match(/^(.*)\/:(\w+)$/);
        if (paramMatch) {
          const base = paramMatch[1];
          const paramName = paramMatch[2];
          if (hash.startsWith(base + "/")) {
            params[paramName] = hash.slice(base.length + 1);
            handler = fn;
            break;
          }
        }
      }
    }

    if (handler) {
      appRoot.innerHTML = '<div class="page-loader"><div class="spinner"></div></div>';
      await handler(params);
    } else {
      appRoot.innerHTML = `<div class="empty-state"><h2>404 — Page not found</h2><a href="#dashboard">Go home</a></div>`;
    }

    // Update nav
    updateNav();
  },
};

// ── Navigation bar ─────────────────────────────────────────────────────────────
function updateNav() {
  const nav = document.getElementById("main-nav");
  if (!AppState.isLoggedIn()) {
    nav.classList.add("hidden");
    return;
  }
  nav.classList.remove("hidden");
  document.getElementById("nav-username").textContent = AppState.user.username;
}

// ── Logout ────────────────────────────────────────────────────────────────────
document.getElementById("btn-logout")?.addEventListener("click", () => {
  AppState.clearAuth();
  Router.navigate("#login");
  UI.toast("Logged out successfully.", "info");
});

// ── Hash change listener ──────────────────────────────────────────────────────
window.addEventListener("hashchange", () => Router.handleRoute());
window.addEventListener("load", () => Router.handleRoute());
