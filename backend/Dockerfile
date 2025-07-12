# Build arguments for platform
ARG TARGETPLATFORM
ARG BUILDPLATFORM

# Use Node.js LTS version for AMD64 platform
FROM --platform=$TARGETPLATFORM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose the port your app runs on
EXPOSE 3001

# Start the application
CMD ["npm", "start"] 