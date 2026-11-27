FROM oven/bun:1-slim AS builder
WORKDIR /build

# Install & build React/Vite frontend
COPY web/package.json web/bun.lock* ./web/
RUN cd web && bun install --ignore-scripts
COPY web ./web
RUN cd web && bun run build

# Install API runtime dependencies
COPY api/package.json ./api/
RUN cd api && bun install --production --ignore-scripts
COPY api ./api

FROM oven/bun:1-slim
WORKDIR /app

# Install FFmpeg for MP3 transcoding
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/api ./api
COPY --from=builder /build/web/dist ./public

ENV NODE_ENV=production
ENV PUBLIC_DIR=/app/public
ENV PORT=10000

WORKDIR /app/api
EXPOSE 10000

CMD ["bun", "run", "src/server.ts"]
