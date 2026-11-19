# mobile_app/Dockerfile

# ---------- dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- build ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Heap limit for `next build`, in MB. 1.5 GB was too small for this app (the
# build died with "JavaScript heap out of memory"). The build machine needs
# this much free RAM + swap, so on a small VPS add swap or build in CI instead.
ARG BUILD_MEMORY_MB=3072
ENV NODE_OPTIONS=--max-old-space-size=${BUILD_MEMORY_MB}
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* values are baked into the JS at build time. They come from
# --build-arg (CI) or, when building on a machine that has mobile_app/.env,
# from that file. Server-only secrets are NOT set here: pass them at runtime.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID
ARG NEXT_PUBLIC_RAZORPAY_PLAN_ID_STARTER
ARG NEXT_PUBLIC_RAZORPAY_PLAN_ID_PRO
ARG NEXT_PUBLIC_RAZORPAY_PLAN_ID_CROISSIX
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_FRONTEND_URL=${NEXT_PUBLIC_FRONTEND_URL}
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID=${NEXT_PUBLIC_RAZORPAY_KEY_ID}
ENV NEXT_PUBLIC_RAZORPAY_PLAN_ID_STARTER=${NEXT_PUBLIC_RAZORPAY_PLAN_ID_STARTER}
ENV NEXT_PUBLIC_RAZORPAY_PLAN_ID_PRO=${NEXT_PUBLIC_RAZORPAY_PLAN_ID_PRO}
ENV NEXT_PUBLIC_RAZORPAY_PLAN_ID_CROISSIX=${NEXT_PUBLIC_RAZORPAY_PLAN_ID_CROISSIX}

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