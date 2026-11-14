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

# Keep the build inside a small VPS's memory. Raise the number if the VPS has
# more RAM (roughly: RAM minus ~512MB), lower it if the build still gets killed.
ENV NODE_OPTIONS=--max-old-space-size=1536
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* values are baked into the JS at build time. They come from
# --build-arg (CI) or, when building on a machine that has mobile_app/.env,
# from that file. Server-only secrets are NOT set here: pass them at runtime.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_KEY
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID
ARG NEXT_PUBLIC_RAZORPAY_PLAN_ID_STARTER
ARG NEXT_PUBLIC_RAZORPAY_PLAN_ID_PRO
ARG NEXT_PUBLIC_RAZORPAY_PLAN_ID_AGENCY
ARG NEXT_PUBLIC_RAZORPAY_PLAN_ID_CROISSIX
ARG NEXT_PUBLIC_RAZORPAY_PLAN_ID_TEST
ARG NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID
ARG NEXT_PUBLIC_RAZORPAY_TEST_PLAN_ID
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_FRONTEND_URL=${NEXT_PUBLIC_FRONTEND_URL}
ENV NEXT_PUBLIC_GOOGLE_MAPS_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_KEY}
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID=${NEXT_PUBLIC_RAZORPAY_KEY_ID}
ENV NEXT_PUBLIC_RAZORPAY_PLAN_ID_STARTER=${NEXT_PUBLIC_RAZORPAY_PLAN_ID_STARTER}
ENV NEXT_PUBLIC_RAZORPAY_PLAN_ID_PRO=${NEXT_PUBLIC_RAZORPAY_PLAN_ID_PRO}
ENV NEXT_PUBLIC_RAZORPAY_PLAN_ID_AGENCY=${NEXT_PUBLIC_RAZORPAY_PLAN_ID_AGENCY}
ENV NEXT_PUBLIC_RAZORPAY_PLAN_ID_CROISSIX=${NEXT_PUBLIC_RAZORPAY_PLAN_ID_CROISSIX}
ENV NEXT_PUBLIC_RAZORPAY_PLAN_ID_TEST=${NEXT_PUBLIC_RAZORPAY_PLAN_ID_TEST}
ENV NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID=${NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID}
ENV NEXT_PUBLIC_RAZORPAY_TEST_PLAN_ID=${NEXT_PUBLIC_RAZORPAY_TEST_PLAN_ID}

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