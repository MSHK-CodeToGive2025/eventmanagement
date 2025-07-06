# Build arguments for platform
ARG TARGETPLATFORM
ARG BUILDPLATFORM

# Stage 1: Build the React app
FROM --platform=$TARGETPLATFORM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application with environment variables
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npx vite build

# Stage 2: Serve the app using Nginx
FROM --platform=$TARGETPLATFORM nginx:alpine AS production

# Copy custom nginx configuration for SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built app from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 