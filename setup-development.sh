#!/bin/bash

# =============================================================================
# AI Hackathon - Development Environment Setup Script
# =============================================================================
# This script helps you set up a development environment quickly
# =============================================================================

set -e

echo "🚀 AI Hackathon - Development Environment Setup"
echo "==============================================="

# Create directories
echo "📁 Creating development directory structure..."
mkdir -p postgres/init-dev
mkdir -p prometheus
mkdir -p grafana/provisioning/dashboards
mkdir -p grafana/provisioning/datasources
mkdir -p grafana/dashboards

# Create development database initialization script
echo "🗄️ Creating development database initialization..."
cat > postgres/init-dev/01-init.sql << 'EOF'
-- Development database initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create development user (if needed)
-- DO $$ BEGIN
--   IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'dev_user') THEN
--     CREATE USER dev_user WITH PASSWORD 'dev_password';
--   END IF;
-- END $$;

-- Development data seeding can go here
-- INSERT INTO users (id, email, name) VALUES (uuid_generate_v4(), 'dev@example.com', 'Dev User');
EOF

# Create Grafana datasource configuration
echo "📊 Creating Grafana development configuration..."
cat > grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

cat > grafana/provisioning/dashboards/dashboard.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

# Create .env.local template
echo "📝 Creating .env.local template for personal overrides..."
cat > .env.local.template << 'EOF'
# Personal development overrides
# Copy this to .env.local and customize for your setup
# .env.local is gitignored and won't be committed

# Personal OAuth credentials for development
GITHUB_CLIENT_ID=your-personal-github-client-id
GITHUB_CLIENT_SECRET=your-personal-github-client-secret
GOOGLE_CLIENT_ID=your-personal-google-client-id
GOOGLE_CLIENT_SECRET=your-personal-google-client-secret
GEMINI_API_KEY=your-personal-gemini-api-key

# Override database if you want to use your own
# DATABASE_URL=postgresql://your-personal-db-url

# Personal development settings
LOG_LEVEL=debug
DEBUG_MODE=true
EOF

# Update .gitignore
echo "🔒 Updating .gitignore for development files..."
cat >> .gitignore << 'EOF'

# Development environment files
.env.local
.env.development.local

# Development data
postgres/data/
redis/data/
prometheus/data/
grafana/data/

# Development logs
logs/
*.log
EOF

# Create development helper scripts
echo "🛠️ Creating development helper scripts..."

# Create dev helper script
cat > dev.sh << 'EOF'
#!/bin/bash

# Development helper script
set -e

case "$1" in
    up)
        echo "🚀 Starting development environment..."
        podman-compose -f podman-compose.development.yml up -d
        echo "✅ Development environment started!"
        echo ""
        echo "🔗 Available services:"
        echo "   Frontend:          http://localhost"
        echo "   API Docs:          http://localhost/api/docs"
        echo "   GraphQL:           http://localhost/graphql"
        echo "   Grafana:           http://localhost:3000 (admin/admin)"
        echo "   Prometheus:        http://localhost:9090"
        echo "   Adminer (DB):      http://localhost:8080"
        echo "   Redis Commander:   http://localhost:8081"
        echo "   MailHog:           http://localhost:8025"
        ;;
    down)
        echo "🛑 Stopping development environment..."
        podman-compose -f podman-compose.development.yml down
        echo "✅ Development environment stopped!"
        ;;
    restart)
        echo "🔄 Restarting development environment..."
        podman-compose -f podman-compose.development.yml restart
        echo "✅ Development environment restarted!"
        ;;
    logs)
        if [ -z "$2" ]; then
            podman-compose -f podman-compose.development.yml logs -f
        else
            podman-compose -f podman-compose.development.yml logs -f "$2"
        fi
        ;;
    ps)
        podman-compose -f podman-compose.development.yml ps
        ;;
    build)
        if [ -z "$2" ]; then
            echo "🔨 Building all services..."
            podman-compose -f podman-compose.development.yml build
        else
            echo "🔨 Building $2..."
            podman-compose -f podman-compose.development.yml build "$2"
        fi
        ;;
    clean)
        echo "🧹 Cleaning up development environment..."
        podman-compose -f podman-compose.development.yml down -v
        podman volume prune -f
        echo "✅ Development environment cleaned!"
        ;;
    reset-db)
        echo "🗄️ Resetting development database..."
        podman-compose -f podman-compose.development.yml stop postgres
        podman volume rm ai_hackathon_dev_postgres_dev_data || true
        podman-compose -f podman-compose.development.yml up -d postgres
        echo "✅ Database reset complete!"
        ;;
    shell)
        if [ -z "$2" ]; then
            echo "❌ Please specify a service name"
            echo "Usage: ./dev.sh shell <service-name>"
            exit 1
        fi
        podman-compose -f podman-compose.development.yml exec "$2" /bin/sh
        ;;
    *)
        echo "🚀 AI Hackathon Development Helper"
        echo "=================================="
        echo ""
        echo "Usage: ./dev.sh <command> [options]"
        echo ""
        echo "Commands:"
        echo "  up              Start development environment"
        echo "  down            Stop development environment"
        echo "  restart         Restart all services"
        echo "  logs [service]  Show logs (all services or specific)"
        echo "  ps              Show running containers"
        echo "  build [service] Build containers (all or specific)"
        echo "  clean           Stop and remove all containers/volumes"
        echo "  reset-db        Reset development database"
        echo "  shell <service> Open shell in container"
        echo ""
        echo "Examples:"
        echo "  ./dev.sh up                 # Start everything"
        echo "  ./dev.sh logs backend       # Show backend logs"
        echo "  ./dev.sh build frontend     # Rebuild frontend"
        echo "  ./dev.sh shell postgres     # Connect to database"
        ;;
esac
EOF

chmod +x dev.sh

echo ""
echo "🎯 DEVELOPMENT ENVIRONMENT SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "✅ Created files:"
echo "   - .env.development (centralized dev config)"
echo "   - podman-compose.development.yml (dev containers)"
echo "   - nginx.dev.conf (dev nginx config)"
echo "   - prometheus/prometheus.dev.yml (dev monitoring)"
echo "   - dev.sh (development helper script)"
echo ""
echo "🚀 Quick Start:"
echo "   1. Customize .env.development with your credentials"
echo "   2. Copy .env.local.template to .env.local (optional personal overrides)"
echo "   3. Run: ./dev.sh up"
echo ""
echo "🔗 Development Services:"
echo "   - Frontend:          http://localhost"
echo "   - Backend APIs:      http://localhost/api"
echo "   - GraphQL:           http://localhost/graphql"
echo "   - Grafana:           http://localhost:3000"
echo "   - Prometheus:        http://localhost:9090"
echo "   - Database Admin:    http://localhost:8080"
echo "   - Redis Admin:       http://localhost:8081"
echo "   - Email Testing:     http://localhost:8025"
echo ""
echo "📚 Documentation:"
echo "   - Run: ./dev.sh (shows all available commands)"
echo "   - Development tools included for easy debugging"
echo "   - Hot reload enabled for faster development"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Update GitHub/Google OAuth credentials in .env.development"
echo "   2. Add your Gemini API key"
echo "   3. Start coding! 🎉"
EOF

chmod +x setup-development.sh

echo "✅ Development environment setup script created!"
echo ""
echo "📋 To get started:"
echo "   1. Run: ./setup-development.sh"
echo "   2. Customize .env.development"
echo "   3. Run: ./dev.sh up"
