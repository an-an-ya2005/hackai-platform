#!/bin/bash

# =============================================================================
# AI Hackathon - Universal Container Management Script
# =============================================================================
# Supports both development and production environments
# =============================================================================

set -e

# Default to development
ENVIRONMENT=${ENVIRONMENT:-development}
COMPOSE_FILE=""

# Determine which compose file to use
case "$ENVIRONMENT" in
    dev|development)
        COMPOSE_FILE="podman-compose.development.yml"
        ;;
    prod|production)
        COMPOSE_FILE="podman-compose.production.yml"
        ;;
    legacy)
        COMPOSE_FILE="podman-compose.yml"
        ;;
    *)
        echo "❌ Unknown environment: $ENVIRONMENT"
        echo "Available environments: development, production, legacy"
        exit 1
        ;;
esac

# Function to show environment info
show_env_info() {
    echo "🌍 Environment: $ENVIRONMENT"
    echo "📄 Compose file: $COMPOSE_FILE"
    echo ""
}

# Function to show available services
show_services() {
    case "$ENVIRONMENT" in
        development)
            echo "🔗 Development Services:"
            echo "   Frontend:          http://localhost"
            echo "   Backend APIs:      http://localhost/api"  
            echo "   GraphQL:           http://localhost/graphql"
            echo "   Grafana:           http://localhost:3000 (admin/admin)"
            echo "   Prometheus:        http://localhost:9090"
            echo "   Database Admin:    http://localhost:8080"
            echo "   Redis Admin:       http://localhost:8081"
            echo "   Email Testing:     http://localhost:8025"
            ;;
        production)
            echo "🔗 Production Services:"
            echo "   Frontend:          https://yourdomain.com"
            echo "   Backend APIs:      https://yourdomain.com/api"
            echo "   Grafana:           https://yourdomain.com/grafana"
            echo "   Prometheus:        https://yourdomain.com/prometheus"
            ;;
        legacy)
            echo "🔗 Legacy Services:"
            echo "   Frontend:          http://localhost"
            echo "   Backend APIs:      http://localhost/api"
            echo "   Grafana:           http://localhost:3000 (admin/admin)"
            echo "   Prometheus:        http://localhost:9090"
            ;;
    esac
    echo ""
}

case "$1" in
    up)
        show_env_info
        echo "🚀 Starting services with Podman..."
        podman-compose -f "$COMPOSE_FILE" up -d
        echo ""
        echo "✅ Services started successfully!"
        show_services
        ;;
    down)
        show_env_info
        echo "🛑 Stopping services..."
        podman-compose -f "$COMPOSE_FILE" down
        echo "✅ Services stopped!"
        ;;
    restart)
        show_env_info
        echo "🔄 Restarting services..."
        podman-compose -f "$COMPOSE_FILE" restart
        echo "✅ Services restarted!"
        ;;
    ps)
        show_env_info
        echo "📋 Running containers:"
        podman-compose -f "$COMPOSE_FILE" ps
        ;;
    logs)
        show_env_info
        if [ -z "$2" ]; then
            echo "📜 Showing logs for all services..."
            podman-compose -f "$COMPOSE_FILE" logs -f
        else
            echo "📜 Showing logs for $2..."
            podman-compose -f "$COMPOSE_FILE" logs -f "$2"
        fi
        ;;
    build)
        show_env_info
        if [ -z "$2" ]; then
            echo "🔨 Building all services..."
            podman-compose -f "$COMPOSE_FILE" build
        else
            echo "🔨 Building $2..."
            podman-compose -f "$COMPOSE_FILE" build "$2"
        fi
        ;;
    pull)
        show_env_info
        echo "⬇️ Pulling latest images..."
        podman-compose -f "$COMPOSE_FILE" pull
        ;;
    clean)
        show_env_info
        echo "🧹 Cleaning up containers and volumes..."
        read -p "⚠️  This will remove all containers and volumes. Continue? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            podman-compose -f "$COMPOSE_FILE" down -v
            podman system prune -f
            podman volume prune -f
            echo "✅ Cleanup completed!"
        else
            echo "❌ Cleanup cancelled."
        fi
        ;;
    status)
        show_env_info
        echo "📊 Service Status:"
        podman-compose -f "$COMPOSE_FILE" ps --format table
        ;;
    shell)
        show_env_info
        if [ -z "$2" ]; then
            echo "❌ Please specify a service name"
            echo "Usage: $0 shell <service-name>"
            exit 1
        fi
        echo "🐚 Opening shell in $2..."
        podman-compose -f "$COMPOSE_FILE" exec "$2" /bin/sh
        ;;
    exec)
        show_env_info
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "❌ Please specify service and command"
            echo "Usage: $0 exec <service-name> <command>"
            exit 1
        fi
        service_name="$2"
        shift 2
        echo "⚡ Executing command in $service_name..."
        podman-compose -f "$COMPOSE_FILE" exec "$service_name" "$@"
        ;;
    env)
        case "$2" in
            dev|development)
                export ENVIRONMENT=development
                echo "🔄 Switched to development environment"
                ;;
            prod|production)
                export ENVIRONMENT=production
                echo "🔄 Switched to production environment"
                ;;
            legacy)
                export ENVIRONMENT=legacy
                echo "🔄 Switched to legacy environment"
                ;;
            *)
                echo "Current environment: $ENVIRONMENT"
                echo "Available environments: development, production, legacy"
                echo ""
                echo "To switch: $0 env <environment>"
                echo "Or set: export ENVIRONMENT=<environment>"
                ;;
        esac
        ;;
    *)
        echo "🚀 AI Hackathon - Container Management"
        echo "====================================="
        echo ""
        echo "Current environment: $ENVIRONMENT"
        echo "Compose file: $COMPOSE_FILE"
        echo ""
        echo "Environment Control:"
        echo "  env [dev|prod|legacy]   Switch environment or show current"
        echo ""
        echo "Container Management:"
        echo "  up                      Start all services"
        echo "  down                    Stop all services"
        echo "  restart                 Restart all services"
        echo "  ps                      Show running containers"
        echo "  status                  Show detailed service status"
        echo ""
        echo "Logs & Monitoring:"
        echo "  logs [service]          Show logs (all or specific service)"
        echo ""
        echo "Building & Updates:"
        echo "  build [service]         Build containers (all or specific)"
        echo "  pull                    Pull latest images"
        echo ""
        echo "Maintenance:"
        echo "  clean                   Remove containers and volumes"
        echo "  shell <service>         Open shell in container"
        echo "  exec <service> <cmd>    Execute command in container"
        echo ""
        echo "Environment Variables:"
        echo "  ENVIRONMENT=development|production|legacy"
        echo ""
        echo "Examples:"
        echo "  ENVIRONMENT=production $0 up        # Start production"
        echo "  $0 env dev && $0 up                 # Switch to dev and start"
        echo "  $0 logs backend                     # Show backend logs"
        echo "  $0 shell postgres                   # Database shell"
        echo "  $0 exec app1 npm test               # Run tests"
        echo ""
        show_services
        ;;
esac
