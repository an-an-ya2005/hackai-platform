# 🏆 AI Hackathon Platform

A production-ready, scalable hackathon management platform with AI-powered application reviews, real-time notifications, and comprehensive monitoring. Built with modern technologies and containerized for easy deployment.

## 🌟 Features

- 🤖 **AI-Powered Reviews**: Automated application evaluation using Google Gemini AI
- 🔐 **OAuth Authentication**: GitHub and Google login integration
- 📱 **Real-time Updates**: WebSocket-based live notifications
- 📊 **Comprehensive Monitoring**: Grafana dashboards and Prometheus metrics
- 🔄 **Load Balancing**: Multi-instance backend with nginx reverse proxy
- 🎨 **Modern UI**: Next.js with Tailwind CSS and shadcn/ui components
- 📧 **Email Integration**: Automated notifications and updates
- 🗄️ **Robust Database**: PostgreSQL with Prisma ORM
- 🚀 **Container Ready**: Docker/Podman with development and production configurations

## 🏗️ Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │    Nginx    │    │   Backend   │
│  (Next.js)  │◄──►│ Load Balancer│◄──►│  (NestJS)   │
│   Port 3004 │    │   Port 80   │    │  Port 3001  │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           │                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Grafana   │    │     AI      │    │ PostgreSQL  │
│ Port 3000   │    │  Service    │    │ Port 5432   │
│ (Monitoring)│    │ Port 3002   │    │ (Database)  │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Container Runtime**: Docker or Podman
- **Node.js**: 18+ (for local development)
- **Git**: Latest version

### 1. Clone Repository

```bash
git clone https://github.com/darshan45672/ai-hackathon.git
cd ai-hackathon
```

### 2. Environment Setup

#### Development Environment

```bash
# The .env.development file is already configured for development
# Just update the OAuth credentials and API keys

# Required: Update OAuth Credentials
# 1. GitHub OAuth App: https://github.com/settings/applications/new
# 2. Google OAuth App: https://console.cloud.google.com/
# 3. Gemini API Key: https://makersuite.google.com/app/apikey

# Edit development environment
nano .env.development
```

**Required Environment Variables:**
```bash
# OAuth Configuration (REQUIRED)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Configuration (REQUIRED for AI reviews)
GEMINI_API_KEY="your-gemini-api-key"

# Other variables are pre-configured for development
```

#### Production Environment

```bash
# Copy production template
cp .env.production.template .env.production

# Edit with your production values
nano .env.production
```

### 3. Start the Application

#### Development Mode (Recommended)

```bash
# Start with development configuration
podman-compose -f podman-compose.development.yml up -d

# View logs
podman-compose -f podman-compose.development.yml logs -f

# Stop services
podman-compose -f podman-compose.development.yml down
```

#### Production Mode

```bash
# Start with production configuration
podman-compose -f podman-compose.production.yml up -d
```

### 4. Access the Application

| Service | URL | Credentials |
|---------|-----|-------------|
| **Main Application** | http://localhost | - |
| **API Documentation** | http://localhost/api | - |
| **GraphQL Playground** | http://localhost/graphql | - |
| **Grafana Monitoring** | http://localhost:3000 | admin/admin |
| **Prometheus Metrics** | http://localhost:9091 | - |
| **Adminer (Database)** | http://localhost/adminer | postgres/password |
| **Redis Commander** | http://localhost/redis-commander | - |
| **MailHog (Email Testing)** | http://localhost/mailhog | - |

## 🔧 Configuration Guide

### OAuth Setup

#### GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Create a new OAuth App with:
   - **Application name**: AI Hackathon Platform
   - **Homepage URL**: `http://localhost` (development) or your domain
   - **Authorization callback URL**: `http://localhost/api/auth/github/callback`
3. Copy the Client ID and Client Secret to your environment file

#### Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Authorized origins**: `http://localhost`
   - **Authorized redirect URIs**: `http://localhost/api/auth/google/callback`
5. Copy the Client ID and Client Secret to your environment file

### AI Configuration

#### Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your environment file as `GEMINI_API_KEY`

### Database Configuration

The platform supports multiple database configurations:

#### Option 1: Containerized PostgreSQL (Default)
```bash
DATABASE_URL="postgresql://postgres:password@postgres:5432/ai_hackathon?schema=public"
```

#### Option 2: External Database (Neon, AWS RDS, etc.)
```bash
DATABASE_URL="your-external-database-url"
```

## 📁 Project Structure

```
ai-hackathon/
├── 📁 frontend/                 # Next.js Frontend
│   ├── 📁 app/                 # App Router pages
│   ├── 📁 components/          # React components
│   ├── 📁 lib/                 # Utilities & API client
│   └── 📁 contexts/            # React contexts
├── 📁 backend/                 # NestJS Backend
│   ├── 📁 src/                 # Source code
│   │   ├── 📁 auth/           # Authentication module
│   │   ├── 📁 applications/   # Application management
│   │   ├── 📁 reviews/        # Review system
│   │   └── 📁 users/          # User management
│   └── 📁 prisma/             # Database schema & migrations
├── 📁 ai/                      # AI Microservice
│   ├── 📁 src/                # NestJS AI service
│   └── 📁 prisma/             # AI-specific database schema
├── 📁 mcp-server/             # Model Context Protocol server
├── 📁 grafana/                # Monitoring dashboards
├── 📁 prometheus/             # Metrics configuration
├── 🐳 podman-compose.development.yml
├── 🐳 podman-compose.production.yml
├── 📄 .env.development        # Development environment
├── 📄 .env.production.template # Production template
└── 📖 README.md              # This file
```

## 🛠️ Development

### Local Development Setup

```bash
# Install dependencies for all services
npm run install:all

# Start database only
podman-compose -f podman-compose.development.yml up postgres redis -d

# Run backend in development mode
cd backend && npm run start:dev

# Run frontend in development mode
cd frontend && npm run dev

# Run AI service in development mode
cd ai && npm run start:dev
```

### Database Management

```bash
# Run Prisma migrations
cd backend && npx prisma migrate dev

# Reset database
cd backend && npx prisma migrate reset

# View database in Prisma Studio
cd backend && npx prisma studio
```

### Monitoring & Debugging

```bash
# View application logs
podman logs -f ai-hackathon_app1_1

# View all service logs
podman-compose -f podman-compose.development.yml logs -f

# Check service health
podman ps --format "table {{.Names}}\t{{.Status}}"
```

## 🚀 Deployment

### Production Deployment

1. **Set up production environment**:
   ```bash
   cp .env.production.template .env.production
   # Edit with production values
   ```

2. **Deploy with production configuration**:
   ```bash
   podman-compose -f podman-compose.production.yml up -d
   ```

3. **Set up SSL** (recommended):
   - Update nginx configuration for SSL
   - Use Let's Encrypt or your SSL certificate
   - Update environment URLs to use HTTPS

### Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `development` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | Yes | - |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | Yes | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No | - |
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes | - |
| `FRONTEND_URL` | Frontend base URL | Yes | `http://localhost` |
| `REDIS_URL` | Redis connection string | Yes | `redis://redis:6379` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## � License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Common Issues

#### OAuth not working
- Check OAuth app configuration
- Verify callback URLs
- Ensure `FRONTEND_URL` is correct

#### Database connection issues
- Verify PostgreSQL is running: `podman ps | grep postgres`
- Check database URL format
- Run migrations: `cd backend && npx prisma migrate dev`

#### Container issues
- Clean up containers: `podman system prune -a`
- Rebuild images: `podman-compose build --no-cache`
- Check logs: `podman logs <container-name>`

### Getting Help

- 📚 Check the [documentation](./docs/)
- 🐛 Report issues on [GitHub Issues](https://github.com/darshan45672/ai-hackathon/issues)
- 💬 Join our community discussions

---

**Built with ❤️ for the developer community**

### Automated Review Pipeline

When users submit applications, they now go through an automated AI review process:

1. **External Idea Review**: Checks if similar ideas exist on Product Hunt, Y Combinator, etc.
2. **Internal Idea Review**: Compares with other submissions to avoid duplicates
3. **Categorization**: Automatically assigns applications to relevant categories
4. **Implementation Feasibility**: Evaluates technical complexity and feasibility
5. **Cost Analysis**: Reviews if requested budget is sufficient for implementation
6. **Customer Impact**: Assesses market potential and business viability

### Review States

Applications now progress through these states:
- `DRAFT` → `SUBMITTED` → `EXTERNAL_IDEA_REVIEW` → `INTERNAL_IDEA_REVIEW` → `CATEGORIZATION` → `IMPLEMENTATION_REVIEW` → `COST_REVIEW` → `IMPACT_REVIEW` → `UNDER_REVIEW` or `REJECTED`

### AI Service Features

- **Microservice Architecture**: Independent AI service for scalability
- **Real-time Processing**: Background processing with status tracking
- **Detailed Analytics**: Comprehensive review reports with scoring
- **Retry Mechanism**: Ability to retry failed review steps
- **Admin Controls**: Admin interface for review management

## 🏗️ Architecture

### Services Overview

- **NGINX**: Load balancer and reverse proxy
- **App1, App2, App3**: Three NestJS backend instances for high availability
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards

### Load Balancing
Traffic is distributed across three backend instances using NGINX's `least_conn` algorithm.

## 🛠️ Development

### Local Development (without Docker)

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Set up database
   npx prisma migrate dev
   npx prisma generate
   npm run db:seed
   
   # Start development server
   npm run start:dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Database Management

```bash
# Run migrations
docker-compose exec app1 npx prisma migrate deploy

# Seed database
docker-compose exec app1 npm run db:seed

# Access database
docker-compose exec postgres psql -U postgres -d ai_hackathon
```

### Scaling Services

```bash
# Scale backend instances
docker-compose up --scale app1=2 --scale app2=2 --scale app3=2

# Scale specific service
docker-compose up --scale app1=5
```

## 📊 Monitoring

### Health Checks
Each backend instance includes health checks accessible at `/api/health`.

### Metrics
- Prometheus collects metrics from all services
- Grafana provides visual dashboards
- Custom metrics available for application monitoring

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app1
docker-compose logs -f nginx
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@postgres:5432/ai_hackathon` |
| `JWT_SECRET` | JWT signing secret | Required |
| `REDIS_HOST` | Redis hostname | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `NODE_ENV` | Application environment | `production` |

### OAuth Configuration
Set up GitHub and Google OAuth by registering applications and updating the environment variables:
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check which ports are in use
   lsof -i :80 -i :3000 -i :5432 -i :6379
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Verify database is running
   docker-compose exec postgres pg_isready
   ```

3. **Build Issues**
   ```bash
   # Clean build
   docker-compose down -v
   docker-compose build --no-cache
   docker-compose up
   ```

4. **Permission Issues**
   ```bash
   # Fix entrypoint script permissions
   chmod +x backend/docker-entrypoint.sh
   ```

### Health Checks
```bash
# Check service health
curl http://localhost/api/health

# Check individual services
docker-compose ps
```

## 📝 API Documentation

Once the application is running, visit:
- Swagger UI: http://localhost/api/docs
- API endpoints: http://localhost/api/*

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the UNLICENSED license.
