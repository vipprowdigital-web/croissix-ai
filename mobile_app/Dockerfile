# mobile_app/Dockerfile

# ---------- dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ---------- build ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Clean old builds
RUN rm -rf .next

# Build app
RUN npm run build

# ---------- production ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only necessary files (optimized)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]