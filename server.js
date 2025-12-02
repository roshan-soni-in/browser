const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn, execSync } = require('child_process');
const http = require('http');

const app = express();

const PORT = process.env.PORT || 8000;
const CHROME_PORT = 9222;

let chromeProcess = null;
let chromeReady = false;

/* ------------------------------------------------------
   🔍 1. Find Chrome Executable (Playwright path)
------------------------------------------------------ */
function findChrome() {
  try {
    const chromePath = execSync(
      'find /ms-playwright -type f -name "chrome" | head -n 1'
    )
      .toString()
      .trim();

    if (!chromePath) throw new Error('Chrome binary not found');

    console.log("✓ Found Chrome:", chromePath);
    return chromePath;

  } catch (err) {
    console.error("✗ Could not locate Chrome:", err);
    process.exit(1);
  }
}

/* ------------------------------------------------------
   ❤️ 2. Check if Chrome is accepting DevTools connections
------------------------------------------------------ */
async function checkChrome() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${CHROME_PORT}/json/version`, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on("error", () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/* ------------------------------------------------------
   🚀 3. Start Chrome / Ultra-Optimized Flags (Low RAM)
------------------------------------------------------ */
async function startChrome() {
  const chromePath = findChrome();

  console.log("🚀 Launching optimized Chrome...");

  chromeProcess = spawn(chromePath, [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-background-networking",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-hang-monitor",
    "--disable-popup-blocking",
    "--disable-sync",
    "--disable-translate",
    "--disable-crash-reporter",
    "--disable-notifications",
    "--disable-ipc-flooding-protection",
    "--disable-renderer-backgrounding",
    "--disable-background-timer-throttling",
    "--metrics-recording-only",
    "--mute-audio",

    // 🧠 MASSIVE memory reductions:
    "--single-process",      
    "--no-zygote",

    // Lower memory JS engine
    "--js-flags=--max-old-space-size=128",

    "--remote-debugging-address=0.0.0.0",
    `--remote-debugging-port=${CHROME_PORT}`,

    "--window-size=1280,720",
  ]);

  chromeProcess.stderr.on("data", (data) => {
    const msg = data.toString();
    if (!msg.includes("dbus") && !msg.includes("Gtk")) {
      console.log("[Chrome]", msg.trim());
    }
  });

  chromeProcess.on("exit", () => {
    console.error("✗ Chrome exited unexpectedly!");
    chromeReady = false;
  });

  // Wait for Chrome to boot
  for (let i = 0; i < 40; i++) {
    if (await checkChrome()) {
      console.log("✓ Chrome is ready on port", CHROME_PORT);
      chromeReady = true;
      return;
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 500));
  }

  console.error("\n✗ Chrome failed to start");
  process.exit(1);
}

/* ------------------------------------------------------
   ⚡ 4. Auto-Heal — Restart Chrome if it dies
------------------------------------------------------ */
setInterval(async () => {
  if (!chromeReady) {
    console.log("\n⚠ Chrome not ready — restarting...");
    await startChrome();
  }
}, 5000);

/* ------------------------------------------------------
   🔁 5. Reverse Proxy → Chrome DevTools
------------------------------------------------------ */
async function startProxy() {
  console.log("\n🌐 Starting Chrome DevTools proxy on port", PORT);

  const proxy = createProxyMiddleware({
    target: `http://127.0.0.1:${CHROME_PORT}`,
    changeOrigin: false,
    ws: true,
    secure: false,
    logLevel: "warn",
  });

  app.get("/health", (req, res) => {
    res.json({
      status: chromeReady ? "ready" : "starting",
      chrome: chromeReady,
      timestamp: Date.now(),
    });
  });

  // All endpoints → Chrome DevTools
  app.use("/", proxy);

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log("✓ Proxy online at : " + PORT);
    console.log("✓ DevTools → /json/version");
  });

  server.on("upgrade", (req, socket, head) => {
    proxy.upgrade(req, socket, head);
  });
}

/* ------------------------------------------------------
   🛑 6. Graceful Shutdown
------------------------------------------------------ */
function shutdown() {
  console.log("\n🛑 Shutting down...");
  if (chromeProcess) chromeProcess.kill("SIGTERM");
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

/* ------------------------------------------------------
   🧩 7. BOOT
------------------------------------------------------ */
(async () => {
  await startChrome();
  await startProxy();
})();
  console.log("🚀 Launching optimized Chrome...");

  chromeProcess = spawn(chromePath, [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-background-networking",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-hang-monitor",
    "--disable-popup-blocking",
    "--disable-sync",
    "--disable-translate",
    "--disable-crash-reporter",
    "--disable-notifications",
    "--disable-ipc-flooding-protection",
    "--disable-renderer-backgrounding",
    "--disable-background-timer-throttling",
    "--metrics-recording-only",
    "--mute-audio",

    // 🧠 MASSIVE memory reductions:
    "--single-process",      
    "--no-zygote",

    // Lower memory JS engine
    "--js-flags=--max-old-space-size=128",

    "--remote-debugging-address=0.0.0.0",
    `--remote-debugging-port=${CHROME_PORT}`,

    "--window-size=1280,720",
  ]);

  chromeProcess.stderr.on("data", (data) => {
    const msg = data.toString();
    if (!msg.includes("dbus") && !msg.includes("Gtk")) {
      console.log("[Chrome]", msg.trim());
    }
  });

  chromeProcess.on("exit", () => {
    console.error("✗ Chrome exited unexpectedly!");
    chromeReady = false;
  });

  // Wait for Chrome to boot
  for (let i = 0; i < 40; i++) {
    if (await checkChrome()) {
      console.log("✓ Chrome is ready on port", CHROME_PORT);
      chromeReady = true;
      return;
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 500));
  }

  console.error("\n✗ Chrome failed to start");
  process.exit(1);
}

/* ------------------------------------------------------
   ⚡ 4. Auto-Heal — Restart Chrome if it dies
------------------------------------------------------ */
setInterval(async () => {
  if (!chromeReady) {
    console.log("\n⚠ Chrome not ready — restarting...");
    await startChrome();
  }
}, 5000);

/* ------------------------------------------------------
   🔁 5. Reverse Proxy → Chrome DevTools
------------------------------------------------------ */
async function startProxy() {
  console.log("\n🌐 Starting Chrome DevTools proxy on port", PORT);

  const proxy = createProxyMiddleware({
    target: `http://127.0.0.1:${CHROME_PORT}`,
    changeOrigin: false,
    ws: true,
    secure: false,
    logLevel: "warn",
  });

  app.get("/health", (req, res) => {
    res.json({
      status: chromeReady ? "ready" : "starting",
      chrome: chromeReady,
      timestamp: Date.now(),
    });
  });

  // All endpoints → Chrome DevTools
  app.use("/", proxy);

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log("✓ Proxy online at : " + PORT);
    console.log("✓ DevTools → /json/version");
  });

  server.on("upgrade", (req, socket, head) => {
    proxy.upgrade(req, socket, head);
  });
}

/* ------------------------------------------------------
   🛑 6. Graceful Shutdown
------------------------------------------------------ */
function shutdown() {
  console.log("\n🛑 Shutting down...");
  if (chromeProcess) chromeProcess.kill("SIGTERM");
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

/* ------------------------------------------------------
   🧩 7. BOOT
------------------------------------------------------ */
(async () => {
  await startChrome();
  await startProxy();
})();    });
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
