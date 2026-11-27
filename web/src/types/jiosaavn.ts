export interface ImageLink {
  quality: string;
  url: string;
}

export interface DownloadLink {
  quality: string;
  url: string;
}

export type AudioQuality = "320kbps" | "160kbps" | "96kbps";

export interface ArtistMini {
  id: string;
  name: string;
  role?: string;
  image: ImageLink[];
  type?: string;
  url?: string;
}

export interface Song {
  id: string;
  name: string;
  type: string;
  year: string | null;
  releaseDate: string | null;
  duration: number | null;
  label: string | null;
  explicitContent: boolean;
  playCount: number | null;
  language: string;
  hasLyrics: boolean;
  lyricsId: string | null;
  url: string;
  copyright: string | null;
  album: {
    id: string | null;
    name: string | null;
    url: string | null;
  } | null;
  artists: {
    primary: ArtistMini[];
    featured?: ArtistMini[];
    all?: ArtistMini[];
  };
  image: ImageLink[];
  downloadUrl: DownloadLink[];
}

export interface Album {
  id: string;
  name: string;
  description?: string;
  year: number | string | null;
  type: string;
  playCount?: number | null;
  language?: string;
  explicitContent?: boolean;
  artists?: {
    primary: ArtistMini[];
    featured?: ArtistMini[];
    all?: ArtistMini[];
  };
  songCount?: number | null;
  url?: string;
  image: ImageLink[];
  songs?: Song[] | null;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string | null;
  year?: number | null;
  type: string;
  playCount?: number | null;
  language?: string;
  explicitContent?: boolean;
  songCount?: number | null;
  url?: string;
  image: ImageLink[];
  songs?: Song[] | null;
  artists?: ArtistMini[] | null;
}

export interface ArtistDetail {
  id: string;
  name: string;
  url: string;
  type: string;
  image: ImageLink[];
  followerCount: number | null;
  fanCount: string | null;
  isVerified: boolean | null;
  dominantLanguage: string | null;
  dominantType: string | null;
  bio: Array<{ text: string | null; title: string | null; sequence: number | null }> | null;
  availableLanguages: string[];
  topSongs: Song[] | null;
  topAlbums: Album[] | null;
  singles: Song[] | null;
  similarArtists?: Array<{
    id: string;
    name: string;
    url: string;
    image: ImageLink[];
    type: string;
  }> | null;
}

export interface HomeItem {
  id: string;
  name: string;
  subtitle: string;
  type: string;
  url: string;
  language: string;
  year: string | null;
  explicitContent: boolean;
  songCount: number | null;
  duration: number | null;
  album: { id: string | null; name: string | null; url: string | null } | null;
  artists: { primary: ArtistMini[] };
  image: ImageLink[];
  downloadUrl: DownloadLink[];
}

export interface HomeData {
  trending: HomeItem[];
  charts: HomeItem[];
  albums: HomeItem[];
  playlists: HomeItem[];
  artists?: HomeItem[];
  freshHits: HomeItem[];
  genresMoods: HomeItem[];
  decades: HomeItem[];
}

export interface GlobalSearchItem {
  id: string;
  title: string;
  image: ImageLink[];
  url?: string;
  type: string;
  description?: string;
  primaryArtists?: string;
  singers?: string;
  album?: string;
  artist?: string;
  language?: string;
}

export interface GlobalSearchData {
  topQuery: { results: GlobalSearchItem[] };
  songs: { results: GlobalSearchItem[] };
  albums: { results: GlobalSearchItem[] };
  artists: { results: GlobalSearchItem[] };
  playlists: { results: GlobalSearchItem[] };
}

export interface SearchPaged<T> {
  total: number;
  start: number;
  results: T[];
}

export interface SyncedLyricLine {
  time: number;
  text: string;
}

export interface LyricsData {
  synced?: SyncedLyricLine[] | null;
  lyrics: string;
  snippet: string;
  copyright: string;
  source?: "lrclib" | "jiosaavn";
}

export interface UserPlaylist {
  id: string;
  name: string;
  createdAt: number;
  songs: Song[];
}
