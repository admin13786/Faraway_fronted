# Faraway Web Frontend

Vue 3 + Vite web client for the Faraway backend.

## Run

```bash
npm install
npm run dev -- --port 5174
```

Open:

```text
http://127.0.0.1:5174
```

## Backend URL

By default the web app calls:

```text
http://127.0.0.1:8000
```

Override it with:

```bash
$env:VITE_API_BASE_URL="http://your-backend-host:8000"
npm run dev -- --port 5174
```

## Build

```bash
npm run build
```
