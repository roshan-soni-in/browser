FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# Set working directory
WORKDIR /app

# Create a startup script to find and run Chromium
RUN echo '#!/bin/bash\n\
CHROME_PATH=$(find /ms-playwright -name chrome -type f | head -n 1)\n\
if [ -z "$CHROME_PATH" ]; then\n\
  echo "Chrome executable not found"\n\
  exit 1\n\
fi\n\
echo "Starting Chrome at: $CHROME_PATH"\n\
exec "$CHROME_PATH" \\\n\
  --headless=new \\\n\
  --no-sandbox \\\n\
  --disable-gpu \\\n\
  --disable-dev-shm-usage \\\n\
  --disable-software-rasterizer \\\n\
  --disable-extensions \\\n\
  --remote-debugging-address=0.0.0.0 \\\n\
  --remote-debugging-port=8000 \\\n\
  --disable-background-networking \\\n\
  --disable-ipc-flooding-protection \\\n\
  --window-size=1920,1080 \\\n\
  --user-agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"\n\
' > /app/start-chrome.sh && chmod +x /app/start-chrome.sh

# Expose Koyeb's required port
EXPOSE 8000

# Run the startup script
CMD ["/app/start-chrome.sh"]
