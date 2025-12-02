FROM mcr.microsoft.com/playwright:v1.49.0-jammy

EXPOSE 8000

CMD ["chromium", \
    "--headless=new", \
    "--no-sandbox", \
    "--disable-gpu", \
    "--disable-dev-shm-usage", \
    "--remote-debugging-address=0.0.0.0", \
    "--remote-debugging-port=8000"]
