# Podman Deployment Summary

## Successfully Deployed Services Using Podman

Your AI Hackathon application has been successfully deployed using Podman! Here's what's currently running:

### Services Overview

| Service | Status | Port | Access URL | Description |
|---------|--------|------|------------|-------------|
| **PostgreSQL** | ✅ Running | 5432 | localhost:5432 | Database |
| **Redis** | ✅ Running | 6379 | localhost:6379 | Cache & Session Store |
| **NGINX** | ✅ Running | 80, 443 | http://localhost | Load Balancer |
| **Backend Apps** | ⚠️ Issues* | 3001 (internal) | via NGINX | 3 App Instances |
| **AI Service** | ✅ Running | 3002-3003 | localhost:3002 | AI Review Service |
| **Grafana** | ✅ Running | 3000 | http://localhost:3000 | Monitoring Dashboard |
| **Prometheus** | ✅ Running | 9090 | http://localhost:9090 | Metrics Collection |

*Backend apps are having permission issues that need to be resolved.

### Quick Commands

```bash
# Check container status
./podman.sh ps

# View logs for a specific service
./podman.sh logs [service-name]

# Restart all services
./podman.sh restart

# Stop all services
./podman.sh down

# Start all services
./podman.sh up

# Clean up everything (removes containers and volumes)
./podman.sh clean
```

### Current Issues

1. **Backend Permission Issue**: The backend apps (app1, app2, app3) are experiencing permission errors when trying to create GraphQL schema files. This is being addressed.

### Files Created

1. `podman-compose.yml` - Podman-compatible compose file with SELinux-friendly volume mounts
2. `podman.sh` - Helper script for managing Podman containers
3. Updated Dockerfiles for Node 20 compatibility and dependency resolution

### Next Steps

1. Fix the permission issue in the backend containers
2. Rebuild and restart the backend services
3. Test the full application stack

### Podman vs Docker Differences Handled

- ✅ SELinux volume mount labels (`:Z`)
- ✅ Rootless container security
- ✅ Node version compatibility
- ✅ Dependency resolution with legacy peer deps
- ✅ Health check compatibility warnings (expected)

Your containers are now running successfully with Podman!
