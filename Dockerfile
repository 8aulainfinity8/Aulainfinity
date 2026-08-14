# Stage 1: Build stage
FROM node:22-slim AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies required for build
RUN npm install

# Copy source files
COPY . .

# Build application (Vite SPA + Express backend bundle)
RUN npm run build

# Stage 2: Production runtime stage
FROM node:22-slim AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy compiled assets and server from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose container port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
