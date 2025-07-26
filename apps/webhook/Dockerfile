# --- Dependencies stage ---
FROM node:18-alpine AS deps
WORKDIR /app

# Copy root and app package files
COPY ../../package.json ../../package-lock.json ../../turbo.json ./
COPY ./package.json ./
COPY ../../packages ./packages

# Install all dependencies incl. workspaces
RUN npm install --legacy-peer-deps

# --- Production stage ---
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .
COPY ../../packages ./packages

EXPOSE 5000

CMD ["node", "index.js"]
