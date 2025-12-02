FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# Install Node.js (if not already present)
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY server.js ./

# Install dependencies
RUN npm install

# Expose port
EXPOSE 8000

# Start the server
CMD ["node", "server.js"]