# Stage 1: Build stage
FROM node:22-slim AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies required for build
RUN npm install

# Build arguments for public client configuration (Vite embeds these at build-time)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_DATABASE_ID

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_FIREBASE_DATABASE_ID=$VITE_FIREBASE_DATABASE_ID

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

# Security: Non-root container user
USER node

# Expose container port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
