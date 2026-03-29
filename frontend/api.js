// frontend/api.js
// ─────────────────────────────────────────────────────────────────────────────
// API Client — wraps all backend calls using Axios
// All API communication goes through this file.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = "/api";

// ── Axios instance with default config ───────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach JWT to every request ─────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid → force logout
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.hash = "#login";
    }
    return Promise.reject(error);
  }
);

// ── Helper to extract error message ──────────────────────────────────────────
const getErrorMessage = (err) =>
  err.response?.data?.error || err.message || "Something went wrong.";

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const Auth = {
  async signup(username, email, password) {
    const res = await api.post("/auth/signup", { username, email, password });
    return res.data; // { token, user }
  },
  async login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },
  async me() {
    const res = await api.get("/auth/me");
    return res.data;
  },
};

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
const Applications = {
  async getAll(params = {}) {
    // params: { search, status }
    const res = await api.get("/applications", { params });
    return res.data; // { applications, stats }
  },
  async getOne(id) {
    const res = await api.get(`/applications/${id}`);
    return res.data; // { application, interviewRounds, prepAdvice }
  },
  async create(data) {
    const res = await api.post("/applications", data);
    return res.data;
  },
  async update(id, data) {
    const res = await api.put(`/applications/${id}`, data);
    return res.data;
  },
  async delete(id) {
    const res = await api.delete(`/applications/${id}`);
    return res.data;
  },
};

// ─── INTERVIEW ROUNDS ─────────────────────────────────────────────────────────
const Interviews = {
  async add(appId, data) {
    const res = await api.post(`/applications/${appId}/interviews`, data);
    return res.data;
  },
  async update(appId, roundId, data) {
    const res = await api.put(`/applications/${appId}/interviews/${roundId}`, data);
    return res.data;
  },
  async delete(appId, roundId) {
    const res = await api.delete(`/applications/${appId}/interviews/${roundId}`);
    return res.data;
  },
};
