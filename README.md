# 🚀 HackAI Platform

HackAI Platform is a hackathon management system with AI-assisted application review, real-time notifications, and an admin dashboard.

It includes a Next.js frontend, a NestJS backend, and a Gemini-backed AI review service.

---

## 🌟 Key Features

- 🤖 AI-guided application review pipeline
- 🔐 OAuth login with GitHub and Google
- 📡 Real-time notifications using WebSockets
- 🗄️ PostgreSQL database managed with Prisma
- 🌐 Next.js frontend with Tailwind CSS and TypeScript
- 🧠 Gemini review integration for automated idea analysis
- 🐳 Docker Compose deployment for local development

---

## 🧰 Tech Stack

- Frontend: `Next.js 15`, `React 19`, `TypeScript`, `Tailwind CSS`, `NextAuth`
- Backend: `NestJS 11`, `TypeScript`, `Prisma`, `PostgreSQL`, `Socket.IO`
- AI Service: custom Gemini review integration service
- Infrastructure: `Docker Compose`, `Redis`

---

## 🏗️ Architecture

```
frontend/   -> Next.js app on port 3000
backend/    -> NestJS API on port 3001
ai/         -> AI review service on port 3002
postgres    -> PostgreSQL database
redis       -> Redis cache
```

---

## 🚀 Local Development

### Docker Compose

Run the minimal local stack:

```bash
docker compose -f docker-compose.minimal.yml up --build
```

This starts:

- `frontend` on `http://localhost:3000`
- `backend` on `http://localhost:3001`
- `ai` on `http://localhost:3002`
- `postgres` on `localhost:5432`

### Manual Development

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Backend

```bash
cd backend
npm install
npm run start:dev
```

---

## 📦 Backend Scripts

From `backend/`:

- `npm run build` — compile the NestJS app
- `npm run start:dev` — run backend in watch mode
- `npm run start:prod` — run the production build
- `npm run test` — run unit tests
- `npm run test:e2e` — run e2e tests
- `npm run db:seed` — seed the database

---

## ⚙️ Environment

The Docker Compose setup passes runtime values for database and backend connectivity.

For manual startup, configure environment variables such as:

- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `NEXT_PUBLIC_API_URL`
- `GEMINI_API_KEY`

---

## 📁 Repository Structure

- `frontend/` — Next.js application
- `backend/` — NestJS API server and Prisma schema
- `ai/` — AI review service container
- `docker-compose.minimal.yml` — local multi-service deployment

---

## Notes

- This repository uses Docker Compose with a single backend instance.
- Monitoring services like Grafana/Prometheus are not part of the running stack today.
- NGINX is configured as a reverse proxy, not a load balancer.


