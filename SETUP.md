## Local setup

### Backend
```bash
cd backend
cp .env.example .env
# edit DATABASE_URL, JWT_SECRET, CLIENT_ORIGIN
npm i
npm run prisma:dev
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm i
npm run dev
```

Open http://localhost:5173 and register + login.

## Deployment

- **Frontend (Vercel):** set `VITE_API_URL` and `VITE_API_BASE` to your backend URL.
- **Backend (Render):** set `CLIENT_ORIGIN` to your Vercel domain, `COOKIE_SECURE=true`, and `DATABASE_URL` to managed Postgres (Render/Railway).
