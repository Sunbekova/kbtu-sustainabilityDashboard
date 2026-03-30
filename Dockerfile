# ─────────────────────────────────────────────────────────────────────────────
# KBTU Sustainable Campus Dashboard — Dockerfile
# Multi-stage build: Node build → nginx static serving
# Final image: ~25 MB, no Node runtime in production
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --silent

# Copy source and build
COPY . .

# Inject build-time env vars (React must see REACT_APP_* at build time)
ARG REACT_APP_ADMIN_PASSWORD=kbtu2024
ARG REACT_APP_GMAPS_KEY=
ARG REACT_APP_SHEETS_API_URL=
ARG PUBLIC_URL=

ENV REACT_APP_ADMIN_PASSWORD=$REACT_APP_ADMIN_PASSWORD
ENV REACT_APP_GMAPS_KEY=$REACT_APP_GMAPS_KEY
ENV REACT_APP_SHEETS_API_URL=$REACT_APP_SHEETS_API_URL
ENV PUBLIC_URL=$PUBLIC_URL

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/kbtu-dashboard.conf

# Copy built React app
COPY --from=builder /app/build /usr/share/nginx/html/kbtu-dashboard

# Expose the port (must match PORT in .env and nginx.conf)
EXPOSE 3010

# Health check — nginx serves the index.html
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3010/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
