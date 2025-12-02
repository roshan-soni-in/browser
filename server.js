const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn, execSync } = require('child_process');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 8000;
const CHROME_PORT = 9222;

let chromeProcess = null;
let isReady = false;

// Find Chrome executable
function findChrome() {
  try {
    const chromePath = execSync('find /ms-playwright -name chrome -type f | head -n 1')
      .toString()
      .trim();
    console.log('✓ Found Chrome at:', chromePath);
    return chromePath;
  } catch (error) {
    console.error('✗ Failed to find Chrome executable:', error);
    process.exit(1);
  }
}

// Check if Chrome is responding
function checkChromeHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${CHROME_PORT}/json/version`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Start Chrome process
async function startChrome() {
  const chromePath = findChrome();
  
  console.log('Starting Chrome browser...');
  
  chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-software-rasterizer',
    '--disable-extensions',
    '--disable-dbus',
    '--disable-background-networking',
    '--disable-ipc-flooding-protection',
    '--disable-default-apps',
    '--disable-sync',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--remote-debugging-address=127.0.0.1',
    '--window-size=1920,1080',
    '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  ]);

  chromeProcess.stdout.on('data', (data) => {
    console.log('[Chrome]', data.toString().trim());
  });

  chromeProcess.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    // Only log important messages, skip D-Bus warnings
    if (!msg.includes('dbus') && !msg.includes('bus.cc')) {
      console.log('[Chrome]', msg);
    }
  });

  chromeProcess.on('error', (error) => {
    console.error('✗ Chrome process error:', error);
    process.exit(1);
  });

  chromeProcess.on('exit', (code, signal) => {
    console.log(`Chrome process exited with code ${code} and signal ${signal}`);
    if (!isReady) {
      console.error('Chrome failed to start properly');
      process.exit(1);
    }
  });

  // Wait for Chrome to be ready
  console.log('Waiting for Chrome to start...');
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (await checkChromeHealth()) {
      console.log('✓ Chrome is ready!');
      isReady = true;
      return;
    }
    process.stdout.write('.');
  }
  
  console.error('\n✗ Chrome failed to start within 30 seconds');
  process.exit(1);
}

// Start the proxy server
async function startProxyServer() {
  console.log(`\nStarting proxy server on port ${PORT}...`);
  
  // Create proxy middleware
  const proxy = createProxyMiddleware({
    target: `http://127.0.0.1:${CHROME_PORT}`,
    changeOrigin: true,
    ws: true,
    logLevel: 'info',
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
      }
      res.end('Proxy error: ' + err.message);
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`→ ${req.method} ${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`← ${proxyRes.statusCode} ${req.url}`);
    }
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      chrome: isReady ? 'ready' : 'starting',
      timestamp: new Date().toISOString()
    });
  });
  
  // Apply proxy to all other routes
  app.use('/', proxy);
  
  // Start HTTP server
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('✓ Proxy server listening on 0.0.0.0:' + PORT);
    console.log('✓ Forwarding to Chrome on 127.0.0.1:' + CHROME_PORT);
    console.log('✓ Health check: http://0.0.0.0:' + PORT + '/health');
    console.log('✓ Chrome DevTools: http://0.0.0.0:' + PORT + '/json/version');
    console.log('\n🚀 Ready to accept connections!\n');
  });
  
  // Handle WebSocket upgrades
  server.on('upgrade', (req, socket, head) => {
    console.log('WebSocket upgrade:', req.url);
    proxy.upgrade(req, socket, head);
  });
}

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down gracefully...');
  if (chromeProcess) {
    chromeProcess.kill('SIGTERM');
    setTimeout(() => {
      if (chromeProcess && !chromeProcess.killed) {
        chromeProcess.kill('SIGKILL');
      }
    }, 5000);
  }
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Main execution
(async () => {
  try {
    await startChrome();
    await startProxyServer();
  } catch (error) {
    console.error('✗ Fatal error:', error);
    process.exit(1);
  }
})();