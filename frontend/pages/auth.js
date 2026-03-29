// frontend/pages/auth.js
// Login and Signup page renderers

function renderLoginPage() {
  const root = document.getElementById("app-root");
  root.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">📋</div>
          <h1 class="auth-title">Interview Tracker</h1>
          <p class="auth-subtitle">Smart prep. Better outcomes.</p>
        </div>

        <form id="login-form" class="auth-form" novalidate>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" placeholder="you@email.com" required />
            <span class="field-error" id="email-error"></span>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="••••••••" required />
            <span class="field-error" id="password-error"></span>
          </div>

          <div class="form-error hidden" id="login-error"></div>

          <button type="submit" class="btn btn-primary btn-full" id="login-btn">
            Sign In
          </button>
        </form>

        <p class="auth-switch">
          Don't have an account? <a href="#signup">Sign up</a>
        </p>

        <div class="auth-demo">
          <p class="demo-label">Demo credentials</p>
          <p class="demo-creds">demo@test.com / demo123</p>
          <button class="btn btn-ghost btn-sm" id="fill-demo">Fill Demo</button>
        </div>
      </div>
    </div>
  `;

  // Fill demo credentials button
  document.getElementById("fill-demo").addEventListener("click", () => {
    document.getElementById("email").value = "demo@test.com";
    document.getElementById("password").value = "demo123";
  });

  // Form submit
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const errEl = document.getElementById("login-error");
    const btn = document.getElementById("login-btn");

    errEl.classList.add("hidden");

    try {
      UI.setButtonLoading(btn, true);
      const { token, user } = await Auth.login(email, password);
      AppState.setAuth(token, user);
      UI.toast(`Welcome back, ${user.username}! 👋`, "success");
      Router.navigate("#dashboard");
    } catch (err) {
      errEl.textContent = getErrorMessage(err);
      errEl.classList.remove("hidden");
    } finally {
      UI.setButtonLoading(btn, false);
    }
  });
}

function renderSignupPage() {
  const root = document.getElementById("app-root");
  root.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">📋</div>
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Track your job hunt. Land your dream role.</p>
        </div>

        <form id="signup-form" class="auth-form" novalidate>
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" placeholder="Your name" required />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" placeholder="you@email.com" required />
          </div>
          <div class="form-group">
            <label for="password">Password <span class="hint">(min 6 characters)</span></label>
            <input type="password" id="password" placeholder="••••••••" required />
          </div>

          <div class="form-error hidden" id="signup-error"></div>

          <button type="submit" class="btn btn-primary btn-full" id="signup-btn">
            Create Account
          </button>
        </form>

        <p class="auth-switch">
          Already have an account? <a href="#login">Sign in</a>
        </p>
      </div>
    </div>
  `;

  document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const errEl = document.getElementById("signup-error");
    const btn = document.getElementById("signup-btn");

    errEl.classList.add("hidden");

    try {
      UI.setButtonLoading(btn, true);
      const { token, user } = await Auth.signup(username, email, password);
      AppState.setAuth(token, user);
      UI.toast(`Account created! Welcome, ${user.username} 🎉`, "success");
      Router.navigate("#dashboard");
    } catch (err) {
      errEl.textContent = getErrorMessage(err);
      errEl.classList.remove("hidden");
    } finally {
      UI.setButtonLoading(btn, false);
    }
  });
}
