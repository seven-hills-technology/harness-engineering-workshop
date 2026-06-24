# Backup runtime for the workshop app (api + web) when the native start won't
# build on the host — the classic Windows / mixed-arch pain with the
# better-sqlite3 and esbuild native addons. Everything below is installed and
# built INSIDE this Linux image, so the host toolchain never matters.
# Driven by docker-compose.yml; see the "Docker fallback" note in README.md.
FROM node:22-bookworm-slim

# Build tools so better-sqlite3 can compile from source if no prebuilt binary
# matches this image (prebuilts normally exist for linux/node22 — insurance).
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install against the manifests first so this layer caches across code edits.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install

# Copy the source so the image can also run standalone. In normal use compose
# bind-mounts the host repo over /app for live edits, while the Linux-built
# node_modules are preserved via anonymous volumes (see docker-compose.yml).
COPY . .

EXPOSE 8010 9010
