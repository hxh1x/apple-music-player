# Deploying Online on Render (Free Plan)

This project is pre-configured for **1-click deployment on Render's Free Plan** using [render.yaml](render.yaml) and [Dockerfile](Dockerfile).

It packages the React/Vite Apple Music frontend, the `sumitkolhe/jiosaavn-api` Hono/Bun server, `ffmpeg` (for 320kbps MP3 downloads with ID3 tags, cover art & lyrics), and SQLite account sync into a single Render Web Service.

## Steps to Deploy on Render Free Plan

1. **Push this folder to a GitHub repository** (including `api/`, `web/`, `Dockerfile`, `.dockerignore`, and `render.yaml`; `.tools/` and `node_modules/` are ignored by `.dockerignore`).
2. Sign in at **[https://dashboard.render.com](https://dashboard.render.com)**.
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository — Render automatically detects `render.yaml` with `plan: free`.
5. Click **Apply** and wait ~2–3 minutes for the Docker build to finish.
6. Open your live URL (e.g. `https://apple-music-jiosaavn.onrender.com`) on any phone, desktop, or enter it into **Car Setup** in the Android Auto app!

## Important Render Free Plan Notes
- **Cold Starts**: Render Free Web Services sleep after **15 minutes** of inactivity; the first request after sleeping takes ~30–50 seconds to wake up.
- **Account Persistence**: Render's Free Plan uses an ephemeral filesystem, so the local SQLite database (`api/data/music.db`) resets whenever the service redeploys or spins down from sleep. For permanent cloud account storage across sleeps/deploys, attach a Render Disk (paid tier) or connect an external database.
