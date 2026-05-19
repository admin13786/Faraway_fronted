#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-$HOME/faraway-project}"
WEB_DIR="$APP_ROOT/web_frontend"
RELEASE_TAR="${1:-$APP_ROOT/web-release.tar.gz}"

log() {
  printf '\n==> %s\n' "$1"
}

require_file() {
  if [ ! -f "$1" ]; then
    echo "Missing file: $1" >&2
    exit 1
  fi
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1" >&2
    exit 1
  fi
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

require_cmd docker
require_file "$RELEASE_TAR"

log "Preparing web directory: $WEB_DIR"
mkdir -p "$WEB_DIR"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
tar -xzf "$RELEASE_TAR" -C "$TMP_DIR"

if [ ! -f "$TMP_DIR/Dockerfile" ] || [ ! -f "$TMP_DIR/docker-compose.yml" ]; then
  echo "Release package is not a web repository archive" >&2
  exit 1
fi

log "Syncing web source"
find "$WEB_DIR" -mindepth 1 -maxdepth 1 ! -name .env -exec rm -rf {} +
cp -a "$TMP_DIR"/. "$WEB_DIR"/

if [ ! -f "$WEB_DIR/.env" ]; then
  if [ -f "$WEB_DIR/.env.example" ]; then
    cp "$WEB_DIR/.env.example" "$WEB_DIR/.env"
  else
    touch "$WEB_DIR/.env"
  fi
fi

log "Ensuring shared docker network"
docker network inspect faraway-net >/dev/null 2>&1 || docker network create faraway-net

log "Building and restarting web only"
cd "$WEB_DIR"
compose up -d --build web

log "Web status"
compose ps web
docker inspect --format='{{.State.Health.Status}}' faraway-web 2>/dev/null || true
