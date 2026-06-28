# ProjectFlow

A full-stack project management system built with React and Node.js. ProjectFlow helps small teams create projects, assign team members, track tasks on a Kanban board, monitor budgets, and log daily contributions — all from a single dashboard.

I built this to get hands-on with the full stack end to end: a relational schema, a REST API, JWT-based authentication, and a React frontend that stays in sync with real backend state instead of mock data.

## Live Demo

Not yet deployed — currently runs locally. Deployment (Render + a hosted Postgres/SQLite setup) is the next milestone for this project.

## Features

- **Authentication** — signup and login with JWT, passwords hashed with bcrypt, protected routes on both frontend and backend
- **Project management** — create, edit, and delete projects with name, description, priority, color tag, budget, start date, planned deadline, and an optional final deadline
- **Status workflow** — mark projects as In Progress, Completed, or On Hold; the Projects page filters by status with live counts
- **Kanban board** — drag-and-drop tasks across To Do / In Progress / Done columns per project
- **Gantt-style timeline** — visualizes each project's tasks against its start date and deadline, both on the dashboard (across all projects) and within a single project's detail page
- **Budget tracking** — visual budget usage bar comparing amount spent against total allocated, per project
- **Team management** — invite, edit, and remove team members; assign members to specific projects
- **Daily activity logging** — each team member can log a day's contribution (tasks completed, hours spent, budget used, breaks taken) with optional notes and project tagging; logs roll up into per-member totals and a viewable history
- **Recent activity feed** — automatically logged events (project created, status changed, task completed, daily log submitted) shown on the dashboard
- **Dashboard analytics** — overall completion ring, budget bar chart and task-completion pie chart (via Recharts), and a focus timer for personal work sessions

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Charts | Recharts |
| HTTP Client | Axios / Fetch |
| Routing | React Router DOM |

## Project Structure

projectflow/

├── frontend/

│   └── src/

│       ├── pages/

│       │   ├── Dashboard.jsx

│       │   ├── Projects.jsx

│       │   ├── ProjectDetail.jsx

│       │   ├── Members.jsx

│       │   ├── Chat.jsx

│       │   ├── Login.jsx

│       │   └── Signup.jsx

│       ├── components/

│       │   ├── Sidebar.jsx

│       │   └── ProtectedRoute.jsx

│       └── context/

│           └── AuthContext.jsx

└── backend/

├── routes/

│   ├── auth.js

│   ├── projects.js

│   ├── tasks.js

│   ├── members.js

│   ├── dailylogs.js

│   └── activity.js

├── middleware/

│   └── auth.js

├── database.js

└── server.js



## Getting Started

### Prerequisites

- Node.js v18 or above
- npm

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:


Start the backend:

```bash
node server.js
```

Backend runs at `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## Usage

1. Open `http://localhost:5173` in your browser
2. Sign up for an account
3. Create a project with a name, budget, and timeline
4. Add tasks and drag them across the Kanban board as work progresses
5. Invite team members and assign them to projects
6. Log daily activity (tasks done, hours, budget, breaks) from the Team page
7. Track progress, budget usage, and recent activity from the Dashboard

## Demo Data

The system seeds demo data on first run, including three sample projects (LexAI Legal Assistant, Smart Wellbeing App, Agriculture Rover) and four sample team members, so the app has realistic data to explore immediately after setup.

## Known Limitations

This is an active learning project, not a production system. Current limitations:

- Single SQLite file as the database — fine for one machine, not built for concurrent multi-instance access
- No automated tests yet
- Direct Chat is a placeholder page — not yet backed by real messaging infrastructure
- Not yet deployed to a public URL

## Roadmap

- [ ] Deploy backend and frontend to free hosting tiers
- [ ] Migrate from SQLite to a hosted Postgres database
- [ ] Add automated tests for core API routes
- [ ] Build out real-time Direct Chat
- [ ] Add input validation coverage across all routes

## Author

Yogesh Tiwari — IU2341230450 — IITE, Indus University, Ahmedabad