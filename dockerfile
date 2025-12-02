FROM debian:stable-slim

RUN apt-get update && apt-get install -y \
  chromium \
  ca-certificates \
  fonts-liberation \
  libnss3 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libgbm1 \
  libasound2 \
  libx11-xcb1 \
  --no-install-recommends && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# Koyeb health check / external port
EXPOSE 8000

CMD ["chromium", \
    "--headless=new", \
    "--no-sandbox", \
    "--disable-gpu", \
    "--disable-dev-shm-usage", \
    "--remote-debugging-address=0.0.0.0", \
    "--remote-debugging-port=8000", \
    "--hide-scrollbars"]
