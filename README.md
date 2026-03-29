# 📋 Interview Tracker + Smart Prep Assistant

A full-stack web app to track job applications, manage interview rounds, and get role-specific preparation advice — built with vanilla HTML/CSS/JS, Node.js, Express, and JWT authentication.

---

## 🗂️ Project Structure

```
interview-tracker/
├── backend/
│   ├── server.js                  # Express app entry point
│   ├── package.json
│   ├── routes/
│   │   ├── auth.js                # Auth routes (signup, login)
│   │   └── applications.js        # Application + interview routes
│   ├── controllers/
│   │   ├── authController.js      # Signup/login logic
│   │   ├── applicationController.js # Application CRUD
│   │   ├── interviewController.js # Interview round CRUD
│   │   └── prepService.js         # Smart prep rules engine ⭐
│   ├── models/
│   │   └── store.js               # In-memory DB (UserModel, ApplicationModel, InterviewModel)
│   └── middleware/
│       ├── auth.js                # JWT middleware (authenticate, generateToken)
│       └── errorHandler.js        # Centralized error handling
│
├── frontend/
│   ├── index.html                 # Single-page app shell
│   ├── style.css                  # Full stylesheet
│   ├── api.js                     # Axios-based API client
│   ├── app.js                     # Router + state management
│   └── pages/
│       ├── auth.js                # Login & signup pages
│       ├── dashboard.js           # Dashboard (stats, search, filter, list)
│       └── detail.js              # Application detail + interview timeline + prep
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd interview-tracker

# 2. Install backend dependencies
cd backend
npm install

# 3. (Optional) Set up environment variables
cp ../.env.example .env
# Edit .env with your JWT_SECRET

# 4. Start the server
node server.js
# or for auto-reload:
npx nodemon server.js

# 5. Open in browser
# http://localhost:3000
```

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register a new user | No |
| POST | `/api/auth/login` | Login and get JWT | No |
| GET | `/api/auth/me` | Get current user | ✅ Yes |

**Signup Request:**
```json
POST /api/auth/signup
{
  "username": "koushik",
  "email": "koushik@example.com",
  "password": "secret123"
}
```
**Signup Response:**
```json
{
  "message": "Account created successfully!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "uuid", "username": "koushik", "email": "koushik@example.com" }
}
```

**Login Request:**
```json
POST /api/auth/login
{ "email": "koushik@example.com", "password": "secret123" }
```

---

### Applications

All application endpoints require:
`Authorization: Bearer <token>`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | Get all applications (supports `?search=&status=`) |
| POST | `/api/applications` | Create a new application |
| GET | `/api/applications/:id` | Get application + rounds + prep advice |
| PUT | `/api/applications/:id` | Update application |
| DELETE | `/api/applications/:id` | Delete application (cascades to rounds) |

**Create Application:**
```json
POST /api/applications
{
  "companyName": "Google",
  "role": "Backend Engineer",
  "status": "Applied",
  "dateApplied": "2024-01-15",
  "notes": "Applied via LinkedIn"
}
```

**Get Application Response (includes Smart Prep):**
```json
{
  "application": { "id": "...", "companyName": "Google", "role": "Backend Engineer", ... },
  "interviewRounds": [
    { "id": "...", "roundType": "HR", "date": "2024-01-20", "feedback": "Went well" }
  ],
  "prepAdvice": {
    "roleLabel": "Backend Engineering",
    "studyTopics": [
      "REST API design & HTTP methods",
      "Database design (SQL vs NoSQL)",
      "System scalability & load balancing",
      ...
    ],
    "statusAlert": null,
    "roundTips": [],
    "generalTips": [ "Research the company's tech stack...", ... ]
  }
}
```

**Search & Filter:**
```
GET /api/applications?search=google&status=Interview
```

---

### Interview Rounds

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications/:appId/interviews` | Get all rounds for an application |
| POST | `/api/applications/:appId/interviews` | Add an interview round |
| PUT | `/api/applications/:appId/interviews/:roundId` | Update a round |
| DELETE | `/api/applications/:appId/interviews/:roundId` | Delete a round |

**Add Round:**
```json
POST /api/applications/:appId/interviews
{
  "roundType": "Technical",
  "date": "2024-01-25",
  "feedback": "Solved 2 LeetCode mediums. Got asked about system design basics."
}
```

---

## 🤖 Smart Prep Assistant — How It Works

The prep assistant is **backend logic** in `controllers/prepService.js`. It runs on every `GET /api/applications/:id` call and returns tailored advice.

### Rules Engine:

```
Role contains "Backend"   → suggest: APIs, databases, scalability, auth, caching
Role contains "Frontend"  → suggest: JS, DOM, CSS layout, React, performance
Role contains "Fullstack"  → suggest: both + deployment, state management
Role contains "Data/ML"   → suggest: Python, SQL, statistics, model evaluation
Role contains "DevOps"    → suggest: Docker, CI/CD, Linux, cloud

Status = "Rejected"       → prompt to add feedback (pattern recognition)
Status = "Offer"          → suggest salary negotiation resources
Status = "OA"             → suggest timed LeetCode practice

Upcoming HR round         → company research, "tell me about yourself" prep
Upcoming Technical round  → LeetCode, think aloud, edge cases
Upcoming System Design    → RESHADED, CAP theorem, real-world architectures
```

No match on role → fallback to general DSA + OOP + behavioral topics.

---

## 🔐 Authentication Flow

```
1. User signs up → password hashed with bcrypt (10 rounds)
2. Server returns JWT (signed, expires in 7 days)
3. Client stores JWT in localStorage
4. Every API request sends: Authorization: Bearer <token>
5. auth middleware verifies token on protected routes
6. On 401, Axios interceptor clears localStorage + redirects to login
```

---

## 📊 Data Schemas

### User
```js
{ id, username, email, passwordHash, createdAt }
```

### Application
```js
{ id, userId, companyName, role, status, dateApplied, notes, createdAt, updatedAt }
// status: "Applied" | "OA" | "Interview" | "Rejected" | "Offer"
```

### InterviewRound
```js
{ id, applicationId, userId, roundType, date, feedback, createdAt }
// roundType: "HR" | "Technical" | "System Design" | "Managerial/Behavioral" | "Take-Home" | "Other"
```

---

## ✅ Features Checklist

- [x] JWT-based signup & login
- [x] CRUD for applications (Create, Read, Update, Delete)
- [x] Interview round tracking with timeline UI
- [x] Smart Prep Assistant (role-based + status-based rules)
- [x] Search by company/role/notes
- [x] Filter by status
- [x] Dashboard stats (total, by status)
- [x] Centralized error handling
- [x] Axios-based API client with interceptors
- [x] Auto status update when interview round added
- [x] Cascade delete (app → rounds)
- [x] Responsive UI (mobile-friendly)
- [x] Toast notifications
- [x] Loading states on buttons

---

## 🧠 Key Concepts Demonstrated

| Concept | Where |
|---------|-------|
| JWT Auth | `middleware/auth.js`, `controllers/authController.js` |
| Password hashing | `authController.js` (bcrypt) |
| RESTful API design | `routes/applications.js` |
| Middleware pattern | `middleware/auth.js`, `middleware/errorHandler.js` |
| MVC architecture | `routes/ → controllers/ → models/` |
| Rule-based backend logic | `controllers/prepService.js` |
| Axios with interceptors | `frontend/api.js` |
| SPA routing (hash-based) | `frontend/app.js` |
| Error propagation | `next(err)` pattern throughout |
| Cascade delete | `ApplicationModel.delete()` in `models/store.js` |

<img width="1914" height="854" alt="image" src="https://github.com/user-attachments/assets/c43e249e-3e72-4d59-a9e7-ddd6b04cae50" />
<img width="1896" height="850" alt="image" src="https://github.com/user-attachments/assets/cf4e2606-5fed-48d4-b08c-bb9660b7bbdb" />
