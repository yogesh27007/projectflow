# ProjectFlow

A full-stack project management system built with React and Node.js. Designed for teams to manage projects, track tasks, monitor budgets, and collaborate efficiently.

## Features

- JWT-based authentication with signup and login
- Project creation with auto-generated Gantt charts based on project type
- Keyword-based template detection (Web, Mobile, ML, Hardware, Backend, Design, Game)
- Resource allocation with cost estimation per phase
- Deadline recalculation for project delays
- Kanban board with drag and drop task management
- Daily activity logging per team member
- Budget tracking and usage visualization
- Team member management
- Project progress tracking

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| HTTP Client | Axios |
| Routing | React Router DOM |

## Project Structure

```
projectflow/
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Projects.jsx
│       │   ├── ProjectDetail.jsx
│       │   ├── Members.jsx
│       │   ├── Login.jsx
│       │   └── Signup.jsx
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   └── ProtectedRoute.jsx
│       └── context/
│           └── authcontext.jsx
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
```

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

```
JWT_SECRET=your_secret_key_here
PORT=5000
```

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
3. Create a project — the system auto-detects the project type and generates a Gantt chart
4. Add tasks to the Kanban board
5. Invite team members and assign them to projects
6. Log daily activity per member
7. Track budget and progress from the project detail page

## Demo Data

The system seeds demo data on first run including three sample projects:

- LexAI Legal Assistant
- Smart Wellbeing App
- Agriculture Rover

## Author

Yogesh Tiwari — IU2341230450 — IITE, Indus University, Ahmedabad
