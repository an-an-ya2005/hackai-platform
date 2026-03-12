#!/bin/bash

# =============================================================================
# AI Hackathon - Production Environment Setup Script
# =============================================================================
# This script helps you set up a secure production environment
# =============================================================================

set -e

echo "🚀 AI Hackathon - Production Environment Setup"
echo "=============================================="

# Create directories
echo "📁 Creating directory structure..."
mkdir -p secrets
mkdir -p ssl
mkdir -p postgres/init
mkdir -p prometheus/rules
mkdir -p grafana/provisioning/dashboards
mkdir -p grafana/provisioning/datasources
mkdir -p grafana/dashboards
mkdir -p redis

# Generate secure passwords
echo "🔐 Generating secure credentials..."

# Generate strong passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
GRAFANA_PASSWORD=$(openssl rand -base64 16)
GRAFANA_SECRET_KEY=$(openssl rand -base64 64)
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)

# Save secrets to files
echo "$POSTGRES_PASSWORD" > secrets/postgres_password.txt
echo "$GRAFANA_PASSWORD" > secrets/grafana_password.txt
echo "$GRAFANA_SECRET_KEY" > secrets/grafana_secret_key.txt

# Set proper permissions
chmod 600 secrets/*

echo "✅ Generated secure credentials:"
echo "   - PostgreSQL password: *** (saved to secrets/postgres_password.txt)"
echo "   - Redis password: *** (saved to .env.production)"
echo "   - Grafana password: *** (saved to secrets/grafana_password.txt)"
echo "   - JWT secret: *** (saved to .env.production)"

# Update .env.production with generated passwords
echo "📝 Updating .env.production with generated credentials..."

if [ -f ".env.production" ]; then
    # Create backup
    cp .env.production .env.production.backup
    
    # Replace placeholders with actual values
    sed -i.bak \
        -e "s/REPLACE_WITH_SECURE_DB_PASSWORD/$POSTGRES_PASSWORD/g" \
        -e "s/REPLACE_WITH_SECURE_REDIS_PASSWORD/$REDIS_PASSWORD/g" \
        -e "s/REPLACE_WITH_SECURE_GRAFANA_PASSWORD/$GRAFANA_PASSWORD/g" \
        -e "s/REPLACE_WITH_SECURE_GRAFANA_SECRET_KEY/$GRAFANA_SECRET_KEY/g" \
        -e "s/REPLACE_WITH_SECURE_JWT_SECRET_MINIMUM_64_CHARACTERS_LONG/$JWT_SECRET/g" \
        -e "s/REPLACE_WITH_SECURE_SESSION_SECRET_64_CHARS/$SESSION_SECRET/g" \
        .env.production
    
    rm .env.production.bak
    echo "✅ Updated .env.production with generated credentials"
else
    echo "❌ .env.production not found! Please create it first."
    exit 1
fi

# Create basic nginx config
echo "🌐 Creating basic nginx production config..."
cat > nginx.prod.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server app1:3001;
        server app2:3001;
        server app3:3001;
    }

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL Configuration (you need to add your certificates)
        ssl_certificate /etc/ssl/yourdomain.crt;
        ssl_certificate_key /etc/ssl/yourdomain.key;

        # Frontend
        location / {
            proxy_pass http://frontend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Monitoring (restrict access)
        location /grafana/ {
            proxy_pass http://grafana:3000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            # Add IP restrictions here
        }
    }
}
EOF

# Create basic Prometheus config
echo "📊 Creating Prometheus production config..."
cat > prometheus/prometheus.prod.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "/etc/prometheus/rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'backend'
    static_configs:
      - targets: ['app1:3001', 'app2:3001', 'app3:3001']

  - job_name: 'ai-service'
    static_configs:
      - targets: ['ai-service:3002']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF

# Create .gitignore for security
echo "🔒 Creating/updating .gitignore for security..."
cat >> .gitignore << 'EOF'

# Production secrets and configuration
.env.production
.env.local
secrets/
ssl/
*.key
*.crt
*.pem

# Backup files
*.backup
*.bak
EOF

# Instructions
echo ""
echo "🎯 NEXT STEPS:"
echo "=============="
echo ""
echo "1. 🔑 CONFIGURE CREDENTIALS:"
echo "   - Edit .env.production and replace remaining placeholders:"
echo "     * GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET"
echo "     * GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
echo "     * GEMINI_API_KEY"
echo "     * Your domain name (yourdomain.com)"
echo ""
echo "2. 🌐 SSL CERTIFICATES:"
echo "   - Add your SSL certificates to the ssl/ directory"
echo "   - Update nginx.prod.conf with correct certificate paths"
echo ""
echo "3. 🗄️ DATABASE CHOICE:"
echo "   - Choose between Neon DB (cloud) or containerized PostgreSQL"
echo "   - Update DATABASE_URL in .env.production accordingly"
echo ""
echo "4. 🚀 DEPLOY:"
echo "   - podman-compose -f podman-compose.production.yml up -d"
echo ""
echo "5. 🔒 SECURITY:"
echo "   - Never commit .env.production to git"
echo "   - Store secrets in a proper secrets manager"
echo "   - Review and harden network security"
echo ""
echo "Generated credentials are saved in:"
echo "- secrets/ directory (for Docker secrets)"
echo "- .env.production (for environment variables)"
echo ""
echo "⚠️  IMPORTANT: Backup your secrets securely!"

echo ""
echo "✅ Production environment setup complete!"
