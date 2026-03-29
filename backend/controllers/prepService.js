// controllers/prepService.js
// ─────────────────────────────────────────────────────────────────────────────
// SMART PREP ASSISTANT — Rule-Based Backend Logic
// This is the "smart" part of the app. Instead of hardcoding suggestions in the
// frontend, the server analyzes the application and returns tailored advice.
//
// Rules engine:
//   1. Role keywords → suggest study topics
//   2. Status = Rejected → prompt feedback
//   3. Upcoming interview → suggest round-specific tips
// ─────────────────────────────────────────────────────────────────────────────

// ── Topic suggestion rules ────────────────────────────────────────────────────
// Each rule has: a test function and topics to suggest if the test passes.

const ROLE_RULES = [
  {
    test: (role) => /backend/i.test(role),
    topics: [
      "REST API design & HTTP methods",
      "Database design (SQL vs NoSQL)",
      "System scalability & load balancing",
      "Authentication (JWT, OAuth)",
      "Caching strategies (Redis)",
    ],
    label: "Backend Engineering",
  },
  {
    test: (role) => /frontend/i.test(role),
    topics: [
      "JavaScript fundamentals (closures, async/await)",
      "DOM manipulation & browser APIs",
      "CSS layout (Flexbox, Grid)",
      "React / component lifecycle",
      "Web performance optimization",
    ],
    label: "Frontend Engineering",
  },
  {
    test: (role) => /fullstack|full.stack/i.test(role),
    topics: [
      "REST API + database design",
      "JavaScript (client + server)",
      "Authentication flows",
      "Deployment basics (CI/CD, Docker)",
      "State management patterns",
    ],
    label: "Full Stack Engineering",
  },
  {
    test: (role) => /data\s*(scientist|analyst|engineer)|ml|machine learning/i.test(role),
    topics: [
      "Python (pandas, numpy, scikit-learn)",
      "SQL & data wrangling",
      "Statistics & probability basics",
      "Model evaluation metrics",
      "Data visualization",
    ],
    label: "Data / ML",
  },
  {
    test: (role) => /devops|sre|platform/i.test(role),
    topics: [
      "Docker & container orchestration",
      "CI/CD pipelines",
      "Linux & shell scripting",
      "Monitoring & alerting",
      "Cloud platforms (AWS/GCP/Azure basics)",
    ],
    label: "DevOps / SRE",
  },
  {
    test: (role) => /mobile|android|ios|react native|flutter/i.test(role),
    topics: [
      "Mobile app lifecycle",
      "State management on mobile",
      "Native APIs (camera, location, storage)",
      "App performance & memory",
      "Publishing to app stores",
    ],
    label: "Mobile Engineering",
  },
];

// ── General topics (fallback for unknown roles) ───────────────────────────────
const GENERAL_TOPICS = [
  "Data Structures & Algorithms (arrays, trees, graphs)",
  "Object-Oriented Programming principles",
  "Time & space complexity (Big O)",
  "System design basics",
  "Behavioral interview (STAR method)",
];

// ── Round-specific interview tips ─────────────────────────────────────────────
const ROUND_TIPS = {
  HR: [
    "Research the company's mission, values, and recent news.",
    "Prepare your 'Tell me about yourself' (keep it to 2 min).",
    "Know your salary expectations (use Glassdoor / Levels.fyi).",
    "Have 3–5 questions ready for the interviewer.",
  ],
  Technical: [
    "Practice coding problems on LeetCode/Codeforces daily.",
    "Talk through your thought process out loud — interviewers value this.",
    "Clarify the problem before coding (edge cases, constraints).",
    "Review time & space complexity after each solution.",
  ],
  "System Design": [
    "Practice the RESHADED framework (Requirements, Estimation, Storage, etc.).",
    "Know CAP theorem and trade-offs.",
    "Be ready to draw data flow diagrams.",
    "Study real-world architectures (Uber, WhatsApp, Twitter).",
  ],
  "Managerial/Behavioral": [
    "Prepare STAR stories for: leadership, conflict, failure, success.",
    "Be specific — numbers and results matter.",
    "Align your stories with the company's values.",
  ],
  "Take-Home": [
    "Read the instructions twice before coding.",
    "Write clean, commented code — it will be reviewed.",
    "Include a README explaining your approach and trade-offs.",
    "Add error handling and basic tests.",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FUNCTION: generatePrepAdvice
// Takes an application (+ its interview rounds) and returns structured advice.
// ─────────────────────────────────────────────────────────────────────────────

const generatePrepAdvice = (application, interviewRounds = []) => {
  const advice = {
    studyTopics: [],
    roundTips: [],
    statusAlert: null,
    generalTips: [],
    roleLabel: "General",
  };

  const { role, status } = application;

  // ── 1. Match role to topic rules ──────────────────────────────────────────
  let matched = false;
  for (const rule of ROLE_RULES) {
    if (rule.test(role)) {
      advice.studyTopics = rule.topics;
      advice.roleLabel = rule.label;
      matched = true;
      break; // Use first matching rule
    }
  }

  // Fallback: no rule matched, use general topics
  if (!matched) {
    advice.studyTopics = GENERAL_TOPICS;
  }

  // ── 2. Status-based alerts ────────────────────────────────────────────────
  if (status === "Rejected") {
    advice.statusAlert = {
      type: "feedback_prompt",
      message:
        "This application was rejected. Adding detailed feedback will help you identify patterns and improve for future applications. What went wrong?",
    };
  } else if (status === "Offer") {
    advice.statusAlert = {
      type: "success",
      message:
        "🎉 You received an offer! Before accepting, research compensation benchmarks on Levels.fyi or Glassdoor and consider negotiating.",
    };
  } else if (status === "OA") {
    advice.statusAlert = {
      type: "action",
      message:
        "Online Assessment incoming. Focus on LeetCode Easy–Medium problems and practice under timed conditions (typically 60–90 min).",
    };
  }

  // ── 3. Round-specific tips ─────────────────────────────────────────────────
  if (interviewRounds.length > 0) {
    // Find upcoming rounds (future dates)
    const now = new Date();
    const upcomingRounds = interviewRounds.filter(
      (r) => r.date && new Date(r.date) >= now
    );

    for (const round of upcomingRounds) {
      // Match roundType to tips (partial match)
      let tips = null;
      for (const [key, val] of Object.entries(ROUND_TIPS)) {
        if (round.roundType && round.roundType.toLowerCase().includes(key.toLowerCase())) {
          tips = val;
          break;
        }
      }
      if (tips) {
        advice.roundTips.push({
          roundType: round.roundType,
          date: round.date,
          tips,
        });
      }
    }
  }

  // ── 4. General interview tips (always included) ───────────────────────────
  advice.generalTips = [
    "Research the company's tech stack on StackShare or their engineering blog.",
    "Send a thank-you email within 24 hours of each interview.",
    "Keep a copy of your resume tailored to this specific role.",
    "Track your energy — schedule important rounds when you're at your best.",
  ];

  return advice;
};

module.exports = { generatePrepAdvice };
