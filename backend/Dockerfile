# backend\Dockerfile

FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy dependency files first (better caching)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# App runs on port 5000
EXPOSE 5000

# Start the server
CMD ["node", "src/server.js"]