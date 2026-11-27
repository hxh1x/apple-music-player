import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Album, ArtistMini, Playlist, Song, UserPlaylist } from "../types/jiosaavn";

export interface LibraryState {
  likedSongs: Song[];
  savedAlbums: Album[];
  savedPlaylists: Playlist[];
  followedArtists: ArtistMini[];
  recentlyPlayed: Song[];
  userPlaylists: UserPlaylist[];
  language: string;
  theme: "dark" | "light";
}

function mergeById<T extends { id: string }>(primary: T[], secondary: T[]): T[] {
  const seen = new Set(primary.map((item) => item.id));
  return [...primary, ...secondary.filter((item) => !seen.has(item.id))];
}

function persistAll(state: LibraryState) {
  localStorage.setItem("am_liked_songs", JSON.stringify(state.likedSongs));
  localStorage.setItem("am_saved_albums", JSON.stringify(state.savedAlbums));
  localStorage.setItem("am_saved_playlists", JSON.stringify(state.savedPlaylists));
  localStorage.setItem("am_followed_artists", JSON.stringify(state.followedArtists));
  localStorage.setItem("am_recently_played", JSON.stringify(state.recentlyPlayed));
  localStorage.setItem("am_user_playlists", JSON.stringify(state.userPlaylists));
  localStorage.setItem("am_language", state.language);
  localStorage.setItem("am_theme", state.theme);
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const initialState: LibraryState = {
  likedSongs: loadJson<Song[]>("am_liked_songs", []),
  savedAlbums: loadJson<Album[]>("am_saved_albums", []),
  savedPlaylists: loadJson<Playlist[]>("am_saved_playlists", []),
  followedArtists: loadJson<ArtistMini[]>("am_followed_artists", []),
  recentlyPlayed: loadJson<Song[]>("am_recently_played", []),
  userPlaylists: loadJson<UserPlaylist[]>("am_user_playlists", []),
  language: localStorage.getItem("am_language") || "english,hindi",
  theme: (localStorage.getItem("am_theme") as "dark" | "light") || "dark",
};

const librarySlice = createSlice({
  name: "library",
  initialState,
  reducers: {
    toggleLikeSong(state, action: PayloadAction<Song>) {
      const exists = state.likedSongs.some((s) => s.id === action.payload.id);
      if (exists) {
        state.likedSongs = state.likedSongs.filter((s) => s.id !== action.payload.id);
      } else {
        state.likedSongs.unshift(action.payload);
      }
      localStorage.setItem("am_liked_songs", JSON.stringify(state.likedSongs));
    },
    toggleSaveAlbum(state, action: PayloadAction<Album>) {
      const exists = state.savedAlbums.some((a) => a.id === action.payload.id);
      if (exists) {
        state.savedAlbums = state.savedAlbums.filter((a) => a.id !== action.payload.id);
      } else {
        const { songs: _songs, ...summary } = action.payload;
        state.savedAlbums.unshift(summary);
      }
      localStorage.setItem("am_saved_albums", JSON.stringify(state.savedAlbums));
    },
    toggleSavePlaylist(state, action: PayloadAction<Playlist>) {
      const exists = state.savedPlaylists.some((p) => p.id === action.payload.id);
      if (exists) {
        state.savedPlaylists = state.savedPlaylists.filter((p) => p.id !== action.payload.id);
      } else {
        const { songs: _songs, ...summary } = action.payload;
        state.savedPlaylists.unshift(summary);
      }
      localStorage.setItem("am_saved_playlists", JSON.stringify(state.savedPlaylists));
    },
    toggleFollowArtist(state, action: PayloadAction<ArtistMini>) {
      const exists = state.followedArtists.some((a) => a.id === action.payload.id);
      if (exists) {
        state.followedArtists = state.followedArtists.filter((a) => a.id !== action.payload.id);
      } else {
        state.followedArtists.unshift(action.payload);
      }
      localStorage.setItem("am_followed_artists", JSON.stringify(state.followedArtists));
    },
    addRecentlyPlayed(state, action: PayloadAction<Song>) {
      state.recentlyPlayed = [
        action.payload,
        ...state.recentlyPlayed.filter((s) => s.id !== action.payload.id),
      ].slice(0, 30);
      localStorage.setItem("am_recently_played", JSON.stringify(state.recentlyPlayed));
    },
    createPlaylist(state, action: PayloadAction<{ name: string; initialSong?: Song }>) {
      const newPl: UserPlaylist = {
        id: `local-${Date.now()}`,
        name: action.payload.name.trim() || "Untitled Playlist",
        createdAt: Date.now(),
        songs: action.payload.initialSong ? [action.payload.initialSong] : [],
      };
      state.userPlaylists.unshift(newPl);
      localStorage.setItem("am_user_playlists", JSON.stringify(state.userPlaylists));
    },
    addSongToPlaylist(state, action: PayloadAction<{ playlistId: string; song: Song }>) {
      const pl = state.userPlaylists.find((p) => p.id === action.payload.playlistId);
      if (pl && !pl.songs.some((s) => s.id === action.payload.song.id)) {
        pl.songs.push(action.payload.song);
        localStorage.setItem("am_user_playlists", JSON.stringify(state.userPlaylists));
      }
    },
    removeSongFromPlaylist(state, action: PayloadAction<{ playlistId: string; songId: string }>) {
      const pl = state.userPlaylists.find((p) => p.id === action.payload.playlistId);
      if (pl) {
        pl.songs = pl.songs.filter((s) => s.id !== action.payload.songId);
        localStorage.setItem("am_user_playlists", JSON.stringify(state.userPlaylists));
      }
    },
    deleteUserPlaylist(state, action: PayloadAction<string>) {
      state.userPlaylists = state.userPlaylists.filter((p) => p.id !== action.payload);
      localStorage.setItem("am_user_playlists", JSON.stringify(state.userPlaylists));
    },
    setLanguage(state, action: PayloadAction<string>) {
      state.language = action.payload;
      localStorage.setItem("am_language", action.payload);
    },
    toggleTheme(state) {
      state.theme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("am_theme", state.theme);
    },
    hydrateFromCloud(state, action: PayloadAction<Partial<LibraryState>>) {
      const cloud = action.payload;
      state.likedSongs = cloud.likedSongs || [];
      state.savedAlbums = cloud.savedAlbums || [];
      state.savedPlaylists = cloud.savedPlaylists || [];
      state.followedArtists = cloud.followedArtists || [];
      state.recentlyPlayed = (cloud.recentlyPlayed || []).slice(0, 30);
      state.userPlaylists = cloud.userPlaylists || [];
      if (cloud.language) state.language = cloud.language;
      if (cloud.theme === "dark" || cloud.theme === "light") state.theme = cloud.theme;
      persistAll(state);
    },
    mergeWithCloud(state, action: PayloadAction<Partial<LibraryState>>) {
      const cloud = action.payload;
      state.likedSongs = mergeById(cloud.likedSongs || [], state.likedSongs);
      state.savedAlbums = mergeById(cloud.savedAlbums || [], state.savedAlbums);
      state.savedPlaylists = mergeById(cloud.savedPlaylists || [], state.savedPlaylists);
      state.followedArtists = mergeById(cloud.followedArtists || [], state.followedArtists);
      state.recentlyPlayed = mergeById(cloud.recentlyPlayed || [], state.recentlyPlayed).slice(0, 30);
      state.userPlaylists = mergeById(cloud.userPlaylists || [], state.userPlaylists);
      if (cloud.language) state.language = cloud.language;
      if (cloud.theme === "dark" || cloud.theme === "light") state.theme = cloud.theme;
      persistAll(state);
    },
  },
});

export const LibraryActions = librarySlice.actions;
export default librarySlice.reducer;
