# 🛠️ Development Guide

This guide provides detailed information for developers working on the AI Hackathon platform.

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Environment Configuration](#environment-configuration)
- [Container Management](#container-management)
- [Database Management](#database-management)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [AI Service Development](#ai-service-development)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance Monitoring](#performance-monitoring)

## 🚀 Development Setup

### Quick Start

```bash
# Clone and setup
git clone https://github.com/darshan45672/ai-hackathon.git
cd ai-hackathon

# Quick setup with script
./setup.sh development

# Or manual setup
cp .env.template .env.development
# Edit .env.development with your values
podman-compose -f podman-compose.development.yml up -d
```

### Prerequisites

- **Container Runtime**: Podman (recommended) or Docker
- **Node.js**: 18+ for local development
- **Git**: Latest version

### Environment Files

| File | Purpose | Committed |
|------|---------|-----------|
| `.env.template` | Template with all variables | ✅ Yes |
| `.env.development` | Development configuration | ✅ Yes (safe values) |
| `.env.production.template` | Production template | ✅ Yes |
| `.env.production` | Production secrets | ❌ No (gitignored) |
| `.env.local` | Personal overrides | ❌ No (gitignored) |
| `.env` | Legacy/current environment | ❌ No (gitignored) |

## ⚙️ Environment Configuration

### Required Variables

```bash
# Authentication (REQUIRED)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GEMINI_API_KEY="your-gemini-api-key"

# Security (REQUIRED)
JWT_SECRET="generate-secure-32char-secret"
DATABASE_URL="postgresql://postgres:password@postgres:5432/ai_hackathon"

# Application (REQUIRED)
FRONTEND_URL="http://localhost"
NODE_ENV="development"
```

### OAuth Setup

#### GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Create OAuth App:
   - **Name**: AI Hackathon Platform (Dev)
   - **Homepage**: `http://localhost`
   - **Callback**: `http://localhost/api/auth/github/callback`
3. Copy Client ID and Secret to `.env.development`

#### Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project and enable Google+ API
3. Create OAuth 2.0 credentials:
   - **Origins**: `http://localhost`
   - **Redirects**: `http://localhost/api/auth/google/callback`
4. Copy Client ID and Secret to `.env.development`

### Validate Configuration

```bash
# Validate your environment
./validate-env.sh .env.development

# Check specific environment
./validate-env.sh .env.production
```

## 🐳 Container Management

### Development Commands

```bash
# Start all services
podman-compose -f podman-compose.development.yml up -d

# View logs
podman-compose -f podman-compose.development.yml logs -f

# View specific service logs
podman logs -f ai-hackathon_app1_1

# Restart specific service
podman-compose -f podman-compose.development.yml restart app1

# Stop all services
podman-compose -f podman-compose.development.yml down

# Clean rebuild
podman-compose -f podman-compose.development.yml down
podman-compose -f podman-compose.development.yml build --no-cache
podman-compose -f podman-compose.development.yml up -d
```

### Service Health Check

```bash
# Check all containers
podman ps --format "table {{.Names}}\t{{.Status}}"

# Check application health
curl http://localhost/health

# Check API health
curl http://localhost/api/health
```

### Container Debugging

```bash
# Enter container shell
podman exec -it ai-hackathon_app1_1 /bin/bash

# Check environment variables
podman exec ai-hackathon_app1_1 env | grep -E "(NODE_ENV|FRONTEND_URL)"

# Check container logs
podman logs --tail=50 ai-hackathon_app1_1

# Inspect container
podman inspect ai-hackathon_app1_1
```

## 🗄️ Database Management

### Prisma Commands

```bash
# Navigate to backend
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name your_migration_name

# Reset database (development only)
npx prisma migrate reset

# View database in browser
npx prisma studio

# Deploy migrations (production)
npx prisma migrate deploy
```

### Database Access

```bash
# Via Adminer (web interface)
open http://localhost/adminer
# Server: postgres, Username: postgres, Password: password, Database: ai_hackathon

# Via psql (command line)
podman exec -it ai-hackathon_postgres_1 psql -U postgres ai_hackathon

# Backup database
podman exec ai-hackathon_postgres_1 pg_dump -U postgres ai_hackathon > backup.sql

# Restore database
podman exec -i ai-hackathon_postgres_1 psql -U postgres ai_hackathon < backup.sql
```

### Common Database Tasks

```sql
-- Check tables
\\dt

-- Check users
SELECT id, email, role, "createdAt" FROM "User";

-- Check applications
SELECT id, title, status, "createdAt" FROM "Application";

-- Check OAuth providers
SELECT "providerId", provider, email FROM "OAuthAccount";
```

## 🔌 API Development

### Local Development

```bash
# Run backend in development mode
cd backend
npm run start:dev

# API will be available at:
# http://localhost:3001/api
# http://localhost:3001/graphql
```

### API Documentation

- **REST API**: http://localhost/api (Swagger)
- **GraphQL**: http://localhost/graphql (Playground)

### Adding New Endpoints

1. Create controller:
```typescript
// backend/src/example/example.controller.ts
@Controller('api/example')
export class ExampleController {
  @Get()
  findAll() {
    return { message: 'Hello World' };
  }
}
```

2. Add to module:
```typescript
// backend/src/example/example.module.ts
@Module({
  controllers: [ExampleController],
})
export class ExampleModule {}
```

3. Import in app module:
```typescript
// backend/src/app.module.ts
@Module({
  imports: [ExampleModule],
})
export class AppModule {}
```

### Testing API

```bash
# Health check
curl http://localhost/api/health

# Get user profile (with auth)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost/api/auth/profile

# Test OAuth
curl http://localhost/api/auth/github
```

## 🎨 Frontend Development

### Local Development

```bash
# Run frontend in development mode
cd frontend
npm run dev

# Frontend will be available at:
# http://localhost:3000 (direct)
# http://localhost (via nginx)
```

### Adding New Pages

```typescript
// frontend/app/example/page.tsx
export default function ExamplePage() {
  return (
    <div>
      <h1>Example Page</h1>
    </div>
  );
}
```

### API Integration

```typescript
// frontend/lib/api.ts
import { ApiClient } from './api-client';

export const exampleApi = {
  getExample: () => ApiClient.get('/api/example'),
  createExample: (data: any) => ApiClient.post('/api/example', data),
};
```

### State Management

```typescript
// frontend/contexts/example-context.tsx
'use client';

import React, { createContext, useContext, useState } from 'react';

interface ExampleContextType {
  data: any;
  setData: (data: any) => void;
}

const ExampleContext = createContext<ExampleContextType | undefined>(undefined);

export function ExampleProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(null);

  return (
    <ExampleContext.Provider value={{ data, setData }}>
      {children}
    </ExampleContext.Provider>
  );
}

export const useExample = () => {
  const context = useContext(ExampleContext);
  if (!context) {
    throw new Error('useExample must be used within ExampleProvider');
  }
  return context;
};
```

## 🤖 AI Service Development

### Local Development

```bash
# Run AI service in development mode
cd ai
npm run start:dev

# AI service will be available at:
# http://localhost:3002
```

### Adding AI Features

```typescript
// ai/src/analysis/analysis.service.ts
@Injectable()
export class AnalysisService {
  async analyzeApplication(applicationData: any) {
    // Your AI analysis logic
    return {
      score: 85,
      feedback: 'Great application!',
      recommendations: ['Add more details']
    };
  }
}
```

### Gemini AI Integration

```typescript
// ai/src/gemini/gemini.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async generateReview(prompt: string) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
```

## 🧪 Testing

### Unit Tests

```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm run test

# AI service tests
cd ai
npm run test
```

### E2E Tests

```bash
# Run E2E tests
cd backend
npm run test:e2e

# Frontend E2E
cd frontend
npm run test:e2e
```

### Integration Tests

```bash
# Test OAuth flow
curl -L http://localhost/api/auth/github

# Test API endpoints
npm run test:integration
```

## 🐛 Debugging

### Backend Debugging

```bash
# Enable debug mode
DEBUG=* npm run start:dev

# View detailed logs
podman logs -f ai-hackathon_app1_1

# Check environment
podman exec ai-hackathon_app1_1 env | grep NODE_ENV
```

### Frontend Debugging

```bash
# Enable Next.js debug mode
DEBUG=* npm run dev

# Check network requests in browser
# Open DevTools > Network tab

# View client-side logs
# Open DevTools > Console tab
```

### Database Debugging

```bash
# Enable Prisma query logging
DEBUG="prisma:query" npm run start:dev

# View slow queries
# Check logs for queries taking >100ms
```

### Common Issues

| Issue | Solution |
|-------|----------|
| OAuth redirects to Grafana | Check `FRONTEND_URL=http://localhost` |
| Database connection failed | Verify `DATABASE_URL` and postgres container |
| CORS errors | Check `CORS_ORIGIN` settings |
| JWT errors | Verify `JWT_SECRET` configuration |
| AI service timeout | Check `GEMINI_API_KEY` and network |

## 📊 Performance Monitoring

### Grafana Dashboards

- **URL**: http://localhost:3000
- **Login**: admin/admin
- **Dashboards**: Application metrics, database performance, API response times

### Prometheus Metrics

- **URL**: http://localhost:9091
- **Metrics**: Custom application metrics, system metrics

### Application Logs

```bash
# View all service logs
podman-compose -f podman-compose.development.yml logs -f

# View specific service
podman logs -f ai-hackathon_app1_1

# Filter logs
podman logs ai-hackathon_app1_1 2>&1 | grep ERROR
```

### Performance Optimization

```bash
# Check memory usage
podman stats

# Monitor database queries
# Enable slow query logging in postgres

# Profile Node.js application
npm run start:dev -- --inspect
```

## 🔧 Advanced Configuration

### Custom nginx Configuration

```bash
# Edit nginx config
nano nginx.dev.conf

# Reload nginx
podman exec ai-hackathon_nginx_1 nginx -s reload
```

### Redis Configuration

```bash
# Access Redis CLI
podman exec -it ai-hackathon_redis_1 redis-cli

# Monitor Redis
podman exec ai-hackathon_redis_1 redis-cli monitor
```

### Email Testing

```bash
# Access MailHog
open http://localhost/mailhog

# Send test email via API
curl -X POST http://localhost/api/notifications \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","message":"Test"}'
```

## 🚀 Deployment

### Development Deployment

```bash
# Deploy to development environment
./setup.sh development
```

### Production Deployment

```bash
# Setup production environment
cp .env.production.template .env.production
# Edit with production values

# Deploy to production
./setup.sh production
```

### Environment Migration

```bash
# Migrate from development to production
npm run migrate:prod

# Backup before migration
./backup.sh
```

---

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Podman Documentation](https://podman.io/getting-started/)

For questions or issues, please check the main [README.md](README.md) or open an issue on GitHub.
