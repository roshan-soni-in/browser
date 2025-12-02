FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# Set working directory
WORKDIR /app

# Expose Koyeb's required port
EXPOSE 8000

# Start Chromium in headless mode listening on 0.0.0.0
CMD ["/usr/bin/chromium-browser", \
    "--headless=new", \
    "--no-sandbox", \
    "--disable-gpu", \
    "--disable-dev-shm-usage", \
    "--disable-software-rasterizer", \
    "--disable-extensions", \
    "--remote-debugging-address=0.0.0.0", \
    "--remote-debugging-port=8000", \
    "--disable-background-networking", \
    "--disable-ipc-flooding-protection", \
    "--window-size=1920,1080", \
    "--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"]
