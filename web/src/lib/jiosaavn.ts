import type {
  Album,
  ArtistDetail,
  ArtistMini,
  AudioQuality,
  DownloadLink,
  GlobalSearchData,
  HomeData,
  ImageLink,
  LyricsData,
  Playlist,
  SearchPaged,
  Song,
} from "../types/jiosaavn";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const lyricsCache = new Map<string, Promise<LyricsData>>();

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`);
  if (!res.ok) {
    throw new Error(`API error (${res.status})`);
  }
  const json = await res.json();
  if (json && json.success === false) {
    throw new Error(json.message || "Request failed");
  }
  return json.data as T;
}

export const jiosaavnApi = {
  getHome: (language = "english,hindi") =>
    apiGet<HomeData>(`/home?language=${encodeURIComponent(language)}`),

  searchAll: (query: string) =>
    apiGet<GlobalSearchData>(`/search?query=${encodeURIComponent(query)}`),

  searchSongs: (query: string, page = 0, limit = 20) =>
    apiGet<SearchPaged<Song>>(
      `/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    ),

  searchAlbums: (query: string, page = 0, limit = 16) =>
    apiGet<SearchPaged<Album>>(
      `/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    ),

  searchPlaylists: (query: string, page = 0, limit = 16) =>
    apiGet<SearchPaged<Playlist>>(
      `/search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    ),

  searchArtists: (query: string, page = 0, limit = 16) =>
    apiGet<SearchPaged<ArtistMini>>(
      `/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    ),

  getSongById: (id: string) => apiGet<Song[]>(`/songs/${encodeURIComponent(id)}`),

  getSongsByIds: (ids: string[]) =>
    apiGet<Song[]>(`/songs?ids=${encodeURIComponent(ids.join(","))}`),

  getSongSuggestions: (id: string, limit = 12) =>
    apiGet<Song[]>(`/songs/${encodeURIComponent(id)}/suggestions?limit=${limit}`),

  getSongLyrics: (
    id: string,
    meta?: { title?: string; artist?: string; album?: string; duration?: number | null }
  ) => {
    const cached = lyricsCache.get(id);
    if (cached) return cached;
    const params = new URLSearchParams();
    if (meta?.title) params.set("title", meta.title);
    if (meta?.artist) params.set("artist", meta.artist);
    if (meta?.album) params.set("album", meta.album);
    if (meta?.duration) params.set("duration", String(meta.duration));
    const qs = params.toString();
    const promise = apiGet<LyricsData>(
      `/songs/${encodeURIComponent(id)}/lyrics${qs ? `?${qs}` : ""}`
    ).catch((err) => {
      lyricsCache.delete(id);
      throw err;
    });
    lyricsCache.set(id, promise);
    return promise;
  },

  getAlbumById: (id: string) =>
    apiGet<Album>(`/albums?id=${encodeURIComponent(id)}`),

  getPlaylistById: (id: string, page = 0, limit = 50) =>
    apiGet<Playlist>(
      `/playlists?id=${encodeURIComponent(id)}&page=${page}&limit=${limit}`
    ),

  getArtistById: (id: string) =>
    apiGet<ArtistDetail>(`/artists/${encodeURIComponent(id)}`),

  getArtistSongs: (id: string, page = 0) =>
    apiGet<{ total: number; songs: Song[] }>(
      `/artists/${encodeURIComponent(id)}/songs?page=${page}`
    ),

  getArtistAlbums: (id: string, page = 0) =>
    apiGet<{ total: number; albums: Album[] }>(
      `/artists/${encodeURIComponent(id)}/albums?page=${page}`
    ),
};

const htmlEntityMap: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#039;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

export function decodeText(str?: string | null): string {
  if (!str) return "";
  return str.replace(/&(amp|quot|#039|apos|lt|gt);/g, (m) => htmlEntityMap[m] || m);
}

export function getBestImage(
  images?: ImageLink[] | string | null,
  preferred: "500x500" | "150x150" | "50x50" = "500x500"
): string {
  if (!images) {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%232c2c2e'/%3E%3Cstop offset='100%25' stop-color='%231c1c1e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='300' height='300' fill='url(%23g)'/%3E%3C/svg%3E";
  }
  if (typeof images === "string") return images.replace(/^http:\/\//, "https://");
  if (!images.length) {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%232c2c2e'/%3E%3Cstop offset='100%25' stop-color='%231c1c1e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='300' height='300' fill='url(%23g)'/%3E%3C/svg%3E";
  }
  const match = images.find((i) => i.quality === preferred);
  return (match || images[images.length - 1]).url.replace(/^http:\/\//, "https://");
}

export function getStreamUrl(
  downloadUrl?: DownloadLink[] | null,
  quality: AudioQuality = "320kbps"
): string | null {
  if (!downloadUrl?.length) return null;
  const order: AudioQuality[] =
    quality === "320kbps"
      ? ["320kbps", "160kbps", "96kbps"]
      : quality === "160kbps"
      ? ["160kbps", "320kbps", "96kbps"]
      : ["96kbps", "160kbps", "320kbps"];
  for (const q of order) {
    const found = downloadUrl.find((d) => d.quality === q);
    if (found?.url) return found.url.replace(/^http:\/\//, "https://");
  }
  return downloadUrl[downloadUrl.length - 1]?.url?.replace(/^http:\/\//, "https://") || null;
}

export function getArtistLabel(songOrItem?: {
  artists?: { primary?: ArtistMini[] };
  subtitle?: string;
} | null): string {
  const names = songOrItem?.artists?.primary?.map((a) => decodeText(a.name)).filter(Boolean);
  if (names && names.length > 0) return names.join(", ");
  return decodeText(songOrItem?.subtitle) || "Unknown Artist";
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds || !Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function formatCompactNumber(num?: number | string | null): string {
  if (num === null || num === undefined || num === "") return "";
  const n = typeof num === "string" ? Number(num) : num;
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, " ").trim();
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function downloadTaggedSong(
  song: Song,
  quality: AudioQuality,
  options?: {
    trackNumber?: number;
    totalTracks?: number;
    onProgress?: (percent: number) => void;
  }
): Promise<void> {
  const params = new URLSearchParams({ id: song.id, quality });
  if (options?.trackNumber) params.set("track", String(options.trackNumber));
  if (options?.totalTracks) params.set("total", String(options.totalTracks));

  const res = await fetch(`${API_BASE}/api/download/song?${params.toString()}`);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);

  const total = Number(res.headers.get("Content-Length") || 0);
  const reader = res.body?.getReader();

  let blob: Blob;
  if (reader && total > 0 && options?.onProgress) {
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loaded += value.length;
        options.onProgress(Math.min(100, Math.round((loaded / total) * 100)));
      }
    }
    blob = new Blob(chunks, { type: "audio/mpeg" });
  } else {
    blob = await res.blob();
    options?.onProgress?.(100);
  }

  const artist = getArtistLabel(song);
  const title = decodeText(song.name) || song.id;
  const prefix = options?.trackNumber
    ? `${String(options.trackNumber).padStart(2, "0")} - `
    : "";
  const filename = `${prefix}${sanitizeFilename(`${artist} - ${title}`) || song.id}.mp3`;
  triggerBlobDownload(blob, filename);
}

export async function downloadCollectionZip(
  title: string,
  songs: Song[],
  quality: AudioQuality
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/download/zip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      quality,
      songIds: songs.map((s) => s.id),
    }),
  });
  if (!res.ok) throw new Error(`ZIP download failed (${res.status})`);
  const blob = await res.blob();
  const safeTitle = sanitizeFilename(decodeText(title)) || "Playlist";
  triggerBlobDownload(blob, `${safeTitle}.zip`);
}
