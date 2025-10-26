# Deployment Guide (Collaborative Task Manager)

This guide explains how to deploy and run the **Collaborative Task Manager** project on **Vercel (Frontend)** and **Render/Railway (Backend & Database)**.

---

## 🚀 Quick Start (Local Development)

1. **Start PostgreSQL**
   - Use your existing local Postgres container or a hosted DB.
   - Example (if you already have `ctm-postgres2`):
     ```bash
     docker start ctm-postgres2
     ```

2. **Backend**
   ```bash
   cd backend
   npm install
   npm run prisma:dev     # generate + run migrations
   npm run dev            # start API server
   ```
   - Runs on **http://localhost:8080**

3. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   - Runs on **http://localhost:5173**

---

## 🌐 Deployment (Vercel + Render/Railway)

### 1. Database (PostgreSQL)
- Create a managed Postgres instance on **Render**, **Railway**, **Supabase**, or **Neon**.
- Copy its connection string (usually looks like  
  `postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?sslmode=require`).

---

### 2. Backend (Render/Railway)
**Build & Start**
```bash
npm install
npm run build
node dist/server.js
```

**Environment Variables**
```
DATABASE_URL=<your-managed-postgres-url>
JWT_SECRET=<strong-random-secret>
CLIENT_ORIGIN=https://<your-frontend>.vercel.app
COOKIE_SECURE=true
```

> The first deployment will automatically run:
> ```bash
> npm run prisma:deploy
> ```
> This creates all required tables.

---

### 3. Frontend (Vercel)
**Settings**
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

**Environment Variables**
```
VITE_API_BASE=https://<your-api>.onrender.com
VITE_API_URL=https://<your-api>.onrender.com/api/v1
```

---

## 🧪 Postman Collection
Import:
```
postman/Collaborative Task Manager.postman_collection.json
```

**Usage**
1. Run **Auth → Login** to obtain the `token` cookie.  
   (Postman automatically saves it into the `{{cookie}}` variable.)
2. Test other endpoints:
   - **Auth → Me**
   - **Tasks**
   - **Notifications**

Set the collection variable:
```
{{baseUrl}} = https://<your-api>.onrender.com
```

to test against your live deployment.

---

✅ **That’s it!**
You no longer need Docker for any part of this setup — the app runs and deploys cleanly using standard npm commands and hosted services.
