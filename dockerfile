FROM debian:stable-slim

RUN apt-get update && apt-get install -y \
  chromium \
  chromium-driver \
  ca-certificates \
  fonts-liberation \
  libnss3 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libgbm1 \
  libasound2 \
  libx11-xcb1 \
  && apt-get clean

EXPOSE 9222

CMD ["chromium", \
    "--headless", \
    "--disable-gpu", \
    "--no-sandbox", \
    "--disable-dev-shm-usage", \
    "--remote-debugging-address=0.0.0.0", \
    "--remote-debugging-port=9222"]
