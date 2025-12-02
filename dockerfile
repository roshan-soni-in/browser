FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# Install Node.js and dependencies
RUN apt-get update && \
    apt-get install -y nodejs npm && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create package.json for proxy server
RUN echo '{\n\
  "name": "chrome-proxy",\n\
  "version": "1.0.0",\n\
  "dependencies": {\n\
    "express": "^4.18.2",\n\
    "http-proxy-middleware": "^2.0.6"\n\
  }\n\
}' > package.json

# Install Node.js dependencies
RUN npm install

# Create proxy server
RUN echo "const express = require('\''express'\'');\n\
const { createProxyMiddleware } = require('\''http-proxy-middleware'\'');\n\
const { spawn } = require('\''child_process'\'');\n\
\n\
const app = express();\n\
const PORT = process.env.PORT || 8000;\n\
const CHROME_PORT = 9222;\n\
\n\
// Find and start Chrome\n\
const { execSync } = require('\''child_process'\'');\n\
const chromePath = execSync('\''find /ms-playwright -name chrome -type f | head -n 1'\'').toString().trim();\n\
\n\
console.log('\''Starting Chrome at:'\'', chromePath);\n\
\n\
const chrome = spawn(chromePath, [\n\
  '\''--headless=new'\'',\n\
  '\''--no-sandbox'\'',\n\
  '\''--disable-gpu'\'',\n\
  '\''--disable-dev-shm-usage'\'',\n\
  '\''--disable-software-rasterizer'\'',\n\
  '\''--disable-extensions'\'',\n\
  '\''--disable-dbus'\'',\n\
  '\''--remote-debugging-port='\'' + CHROME_PORT,\n\
  '\''--disable-background-networking'\'',\n\
  '\''--disable-ipc-flooding-protection'\'',\n\
  '\''--window-size=1920,1080'\''\n\
], {\n\
  stdio: '\''inherit'\''\n\
});\n\
\n\
// Wait for Chrome to start\n\
setTimeout(() => {\n\
  console.log('\''Chrome started, starting proxy server on port'\'', PORT);\n\
  \n\
  // Proxy all requests to Chrome\n\
  app.use('\''/'\'', createProxyMiddleware({\n\
    target: '\''http://127.0.0.1:'\'' + CHROME_PORT,\n\
    changeOrigin: true,\n\
    ws: true,\n\
    logLevel: '\''info'\''\n\
  }));\n\
  \n\
  const server = app.listen(PORT, '\''0.0.0.0'\'', () => {\n\
    console.log('\''Proxy server listening on 0.0.0.0:'\'' + PORT);\n\
    console.log('\''Access Chrome DevTools at: http://localhost:'\'' + PORT);\n\
  });\n\
  \n\
  // Handle WebSocket upgrades\n\
  server.on('\''upgrade'\'', (req, socket, head) => {\n\
    console.log('\''WebSocket upgrade request:'\'', req.url);\n\
  });\n\
}, 3000);\n\
\n\
// Cleanup on exit\n\
process.on('\''SIGTERM'\'', () => {\n\
  console.log('\''Shutting down...'\'');\n\
  chrome.kill();\n\
  process.exit(0);\n\
});\n\
" > server.js

# Expose Koyeb's required port
EXPOSE 8000

# Start the proxy server
CMD ["node", "server.js"]\n\
echo "Starting socat proxy on 0.0.0.0:8000 -> 127.0.0.1:9222"\n\
\n\
# Forward port 8000 to Chrome'\''s debugging port\n\
exec socat TCP-LISTEN:8000,bind=0.0.0.0,fork TCP:127.0.0.1:9222\n\
' > /app/start-chrome.sh && chmod +x /app/start-chrome.sh

# Expose Koyeb's required port
EXPOSE 8000

# Run the startup script
CMD ["/app/start-chrome.sh"]
