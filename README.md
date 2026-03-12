# 🚀 HackAI Platform

HackAI Platform is a scalable hackathon management system with **AI-powered application reviews, real-time notifications, and monitoring dashboards**.

It helps organizers efficiently evaluate submissions using **automated AI analysis**.

---

## 🌟 Key Features

- 🤖 AI Application Reviews using **Google Gemini**
- 🔐 OAuth Login (**GitHub & Google**)
- 📡 Real-time Notifications via **WebSockets**
- 📊 Monitoring Dashboards (**Grafana + Prometheus**)
- ⚖️ Load Balanced Backend using **NGINX**
- 🎨 Modern UI with **Next.js + Tailwind CSS**
- 🗄️ PostgreSQL Database with **Prisma ORM**
- 🐳 Containerized Deployment using **Docker / Podman**

---

## 🏗️ Architecture

```
Frontend (Next.js)
        │
        ▼
NGINX Load Balancer
        │
        ▼
NestJS Backend (Multiple Instances)
        │
 ┌───────────────┬───────────────┐
 ▼               ▼               ▼
PostgreSQL      Redis        AI Service
Database        Cache        (Gemini API)
        │
        ▼
Monitoring (Prometheus + Grafana)
```

---

## 🚀 Quick Start

### Clone Repository

```bash
git clone https://github.com/an-an-ya2005/hackai-platform.git
cd hackai-platform
```
