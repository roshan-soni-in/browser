FROM zenika/alpine-chrome:with-node

# Expose Chrome DevTools port
EXPOSE 9222

# Run Chrome headless with remote debugging enabled
CMD ["google-chrome-stable", \
    "--headless", \
    "--disable-gpu", \
    "--no-sandbox", \
    "--disable-dev-shm-usage", \
    "--remote-debugging-address=0.0.0.0", \
    "--remote-debugging-port=9222", \
    "--hide-scrollbars", \
    "--disable-web-security"]