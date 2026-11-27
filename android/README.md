# Apple Music JioSaavn — Android & Android Auto App

This native Android project (`android/`) integrates **Jetpack Media3 (`MediaLibraryService` + `ExoPlayer`)** with the `sumitkolhe/jiosaavn-api` backend and cross-device Account Sync so you can browse, search by voice/touch, and play your music directly on **Android Auto** in your car.

## Features
- **Android Auto Car Interface (`MusicAutoService`)**:
  - Browse tree: **Listen Now** (synced Listening History), **Liked Songs**, **Playlists** (personal & saved), and **Albums**.
  - **Voice & Keyboard Search** on the car head unit (`/api/search/songs`).
  - **Auto-Radio Queue**: Automatically queues similar songs via `/api/songs/{id}/suggestions` when a song finishes.
  - **Cover Art & Metadata** on your car dashboard (`320kbps` AAC streaming).
- **Phone Companion App (`MainActivity`)**:
  - **Car Setup** button to enter your API Server URL + Account credentials (syncs your account directly to Android Auto).
  - Full mobile Apple Music WebView.

## Building the APK
Because Java JDK / Android SDK are not pre-installed on this Windows machine, build the APK using either **Android Studio** or **GitHub Actions**:

### Option A: Android Studio (Windows / macOS)
1. Open the `android/` folder in **Android Studio** (Giraffe or newer).
2. Let Gradle sync & download dependencies (`Media3 1.4.1`, `OkHttp`).
3. Click **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
4. Install `app/build/outputs/apk/debug/app-debug.apk` on your Android phone.

### Option B: GitHub Actions (No local SDK needed)
Push this repository to GitHub; `.github/workflows/android-apk.yml` builds `app-debug.apk` automatically as a downloadable workflow artifact.

## Using with Android Auto
1. On your Android phone, open **Settings -> Connected devices -> Connection preferences -> Android Auto**, tap **Version** 10 times to enable **Developer mode**, open the `⋮` menu -> **Developer settings**, and enable **Unknown sources**.
2. Connect your phone to the same Wi-Fi (or host `api/` & `web/` on a public HTTPS domain).
3. Open **Apple Music JioSaavn** on your phone, tap **Car Setup**, enter:
   - **API Server URL**: `http://<YOUR-PC-LAN-IP>:3000` (e.g. `http://10.170.204.167:3000`)
   - **Web App URL**: `http://<YOUR-PC-LAN-IP>:5173`
   - **Account Email/Username & Password**
4. Plug into your car (or open Android Auto Desktop Head Unit) and select **Apple Music JioSaavn**.
