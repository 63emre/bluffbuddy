# ==========================================================
# DOCKERFILE - BluffBuddy Backend
# ==========================================================
# @owner DEV1 (Infrastructure)
# @version v1.0.0
# @see docs/v0.1.0/09-Deployment.md
#
# Multi-stage build for production optimization
# ==========================================================

# TODO v0.1.1: Implement build stage
# - Use node:18-alpine as builder
# - Copy package*.json
# - Run npm ci
# - Copy source
# - Run npm run build

# TODO v0.1.2: Implement production stage
# - Use node:18-alpine
# - Copy only dist/ and node_modules
# - Set NODE_ENV=production
# - Expose port 3000
# - CMD ["node", "dist/main.js"]

# TODO v0.2.0: Add health check
# HEALTHCHECK --interval=30s --timeout=3s \
#   CMD wget -q --spider http://localhost:3000/health || exit 1
