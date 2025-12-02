FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# Install socat for port forwarding
RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create a startup script to run Chrome and forward the port
RUN echo '#!/bin/bash\n\
# Find Chrome executable\n\
CHROME_PATH=$(find /ms-playwright -name chrome -type f | head -n 1)\n\
if [ -z "$CHROME_PATH" ]; then\n\
  echo "Chrome executable not found"\n\
  exit 1\n\
fi\n\
\n\
echo "Starting Chrome at: $CHROME_PATH"\n\
\n\
# Start Chrome in the background\n\
"$CHROME_PATH" \\\n\
  --headless=new \\\n\
  --no-sandbox \\\n\
  --disable-gpu \\\n\
  --disable-dev-shm-usage \\\n\
  --disable-software-rasterizer \\\n\
  --disable-extensions \\\n\
  --remote-debugging-port=9222 \\\n\
  --disable-background-networking \\\n\
  --disable-ipc-flooding-protection \\\n\
  --disable-dbus \\\n\
  --window-size=1920,1080 \\\n\
  --user-agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" &\n\
\n\
# Wait for Chrome to start\n\
sleep 2\n\
\n\
echo "Starting socat proxy on 0.0.0.0:8000 -> 127.0.0.1:9222"\n\
\n\
# Forward port 8000 to Chrome'\''s debugging port\n\
exec socat TCP-LISTEN:8000,bind=0.0.0.0,fork TCP:127.0.0.1:9222\n\
' > /app/start-chrome.sh && chmod +x /app/start-chrome.sh

# Expose Koyeb's required port
EXPOSE 8000

# Run the startup script
CMD ["/app/start-chrome.sh"]
