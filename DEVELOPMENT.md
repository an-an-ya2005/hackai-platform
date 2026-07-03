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

# Create environment file
cp .env.template .env
# Edit .env with your values

docker compose -f docker-compose.minimal.yml up --build
```

### Prerequisites

- **Container Runtime**: Docker
- **Node.js**: 18+ for local development
- **Git**: Latest version

### Environment Files

| File | Purpose | Committed |
|------|---------|-----------|
| `.env.template` | Template with all variables | ✅ Yes |
| `.env` | Local environment file | ❌ No (gitignored) |

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
docker compose -f docker-compose.minimal.yml up --build

# View logs
docker compose -f docker-compose.minimal.yml logs -f

# View specific service logs
docker compose -f docker-compose.minimal.yml logs backend

docker compose -f docker-compose.minimal.yml logs ai

docker compose -f docker-compose.minimal.yml logs frontend

# Restart specific service
docker compose -f docker-compose.minimal.yml restart backend

# Stop all services
docker compose -f docker-compose.minimal.yml down

# Clean rebuild
docker compose -f docker-compose.minimal.yml down
docker compose -f docker-compose.minimal.yml build --no-cache
docker compose -f docker-compose.minimal.yml up --build
```

### Service Health Check

```bash
# Check all containers
docker compose -f docker-compose.minimal.yml ps

# Check backend health
curl http://localhost:3001/api/health
```

### Container Debugging

```bash
# Enter backend container shell
docker compose -f docker-compose.minimal.yml exec backend sh

# Check environment variables
docker compose -f docker-compose.minimal.yml exec backend env | grep -E "(NODE_ENV|FRONTEND_URL)"

# Check container logs
docker compose -f docker-compose.minimal.yml logs backend

# Inspect container
docker inspect $(docker compose -f docker-compose.minimal.yml ps -q backend)
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
docker compose -f docker-compose.minimal.yml exec postgres psql -U postgres ai_hackathon

# Backup database
docker compose -f docker-compose.minimal.yml exec postgres pg_dump -U postgres ai_hackathon > backup.sql

# Restore database
docker compose -f docker-compose.minimal.yml exec -T postgres psql -U postgres ai_hackathon < backup.sql
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
docker compose -f docker-compose.minimal.yml logs backend

# Check environment
docker compose -f docker-compose.minimal.yml exec backend env | grep NODE_ENV
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
| OAuth redirects to the wrong host | Check `FRONTEND_URL=http://localhost` |
| Database connection failed | Verify `DATABASE_URL` and postgres container |
| CORS errors | Check `CORS_ORIGIN` settings |
| JWT errors | Verify `JWT_SECRET` configuration |
| AI service timeout | Check `GEMINI_API_KEY` and network |

## 📊 Performance Monitoring

### Application Logs

```bash
# View all service logs
docker compose -f docker-compose.minimal.yml logs -f

# View specific service
docker compose -f docker-compose.minimal.yml logs backend

# Filter logs
docker compose -f docker-compose.minimal.yml logs backend 2>&1 | Select-String -Pattern ERROR
```

### Performance Optimization

```bash
# Check memory usage
docker stats

# Monitor database queries
# Enable slow query logging in postgres

# Profile Node.js application
npm run start:dev -- --inspect
```

## 🔧 Advanced Configuration

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

For questions or issues, please check the main [README.md](README.md) or open an issue on GitHub.
