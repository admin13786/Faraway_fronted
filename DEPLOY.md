# Faraway Web Frontend Deployment

This repository is the Vue/Vite web frontend. It can be built directly on a Linux cloud server with Docker.

Start the backend first, because this web container proxies `/api`, `/media`, and `/health` to `faraway-backend:8000` through the Docker network `faraway-net`.

## Build and run

```bash
git clone https://github.com/admin13786/Faraway_fronted.git
cd Faraway_fronted
cp .env.example .env
docker compose up -d --build
```

Open:

```text
http://SERVER_IP:8080
```

Health check through the web proxy:

```bash
curl http://127.0.0.1:8080/health
```

## Notes

- Keep `VITE_API_BASE_URL` empty for Docker deployment. The browser calls same-origin `/api`, and Nginx proxies it to the backend container.
- If the backend is not in Docker, set `BACKEND_UPSTREAM` to the backend host and port, for example `10.26.6.117:8088`.
