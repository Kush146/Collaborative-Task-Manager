Collaborative Task Manager

Live Frontend: https://collaborative-task-manager-psi.vercel.app
Live Backend API: https://collaborative-task-manager-1.onrender.com
Health Check: https://collaborative-task-manager-1.onrender.com/health

Overview:
Collaborative Task Manager is a full-stack productivity web application designed to help users create, assign, and track tasks in real time. It includes secure authentication, task filtering, notifications, and WebSocket-based updates.

Tech Stack:
Frontend: React (Vite + TypeScript) | React Query | TailwindCSS | React Hook Form | Zod
Backend: Node.js | Express | TypeScript | Prisma ORM | PostgreSQL | Socket.IO
Database: PostgreSQL (Render)
Deployments: Frontend on Vercel, Backend on Render
Testing: Jest unit tests for task services

Project Features:
• Authentication: Register, Login, Logout, and Session Persistence (JWT + HttpOnly cookies)
• Task Management: Create, update, filter, and delete tasks by priority, status, or ownership
• Notifications: Real-time updates for assigned and updated tasks
• Review Requests: Upload files or notes for review
• Dashboard: Interactive interface with task filters and status badges
• User Profile: Edit display name and preferences
• Validation: Zod for DTOs, schema validation, and error-safe responses
• Real-time Sync: Socket.IO emits taskCreated, taskUpdated, and taskAssigned
• Testing: Comprehensive Jest test suite (all tests passing)

Live URLs:
Frontend: https://collaborative-task-manager-psi.vercel.app
Backend API: https://collaborative-task-manager-1.onrender.com

Local Setup Instructions:

1. Clone the repository
   git clone <your-repo-url>
   cd task-manager

2. Setup backend
   cd backend
   cp .env.example .env
   # Fill in your DATABASE_URL, JWT_SECRET, CLIENT_ORIGIN=http://localhost:5173
   npm install
   npx prisma migrate dev
   npm run dev

3. Setup frontend
   cd ../frontend
   npm install
   echo VITE_API_BASE=http://localhost:8080 > .env.local
   npm run dev

4. Access the app
   Frontend: http://localhost:5173
   Backend: http://localhost:8080

Environment Variables:

Backend (.env):
DATABASE_URL=postgresql://user:password@localhost:5432/collab_task_manager
JWT_SECRET=your_super_secret_jwt_key
COOKIE_SECURE=false
CLIENT_ORIGIN=http://localhost:5173
CORS_ORIGINS=http://localhost:5173

Frontend (.env.local):
VITE_API_BASE=http://localhost:8080

API Endpoints Summary:
POST /api/v1/auth/register      → Register new user
POST /api/v1/auth/login         → Login and set cookie
POST /api/v1/auth/logout        → Logout and clear cookie
GET  /api/v1/auth/me            → Fetch logged-in user
GET  /api/v1/tasks              → List tasks with filters
POST /api/v1/tasks              → Create a new task
PATCH /api/v1/tasks/:id         → Update task
DELETE /api/v1/tasks/:id        → Delete task
GET  /api/v1/notifications      → Fetch user notifications
PATCH /api/v1/users/me          → Update profile name

Testing:
cd backend
npm test
All 4 test suites (task.repository, task.service, createTaskService, updateTaskService) pass successfully.

Deployment Details:
Backend: Render (Node service)
Frontend: Vercel (static deployment)
Database: Render PostgreSQL

Render Environment Variables:
PORT=8080
DATABASE_URL=<your Render Postgres URL>
JWT_SECRET=<your random JWT secret>
COOKIE_SECURE=true
CLIENT_ORIGIN=https://collaborative-task-manager-psi.vercel.app
CORS_ORIGINS=https://collaborative-task-manager-psi.vercel.app

Vercel Environment Variables:
VITE_API_BASE=https://collaborative-task-manager-1.onrender.com

Verification Checklist:
 Register/Login works (cookie set on Render)
/auth/me returns valid user session
 Real-time task creation, assignment, updates
Socket.IO events working live across tabs
Logout clears cookies
All Jest tests passing

Author:
Developed by Kush — Collaborative Task Manager (2025)
Full-stack implementation: Secure, tested, and deployed.

