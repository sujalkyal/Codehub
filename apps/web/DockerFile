
# --- Dependencies stage ---
FROM node:18-alpine AS deps
WORKDIR /app

# Copy root and app package files
COPY ../../package.json ../../package-lock.json ../../turbo.json ./
COPY ./package.json ./
COPY ../../packages ./packages

# Install all dependencies incl. workspaces
RUN npm install --legacy-peer-deps

# --- Build stage ---
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .

RUN npm run build

# --- Production stage ---
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Only copy production build and minimal files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/packages ./packages

# If you use a custom server, copy it here (uncomment below)
# COPY --from=builder /app/server.js ./server.js

EXPOSE 3000

CMD ["npm", "start"]