import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { jiosaavnApi } from "../lib/jiosaavn";
import type { AudioQuality, Song } from "../types/jiosaavn";
import { LibraryActions } from "./librarySlice";
import type { RootState } from "./store";

const getStoredVolume = (): number => {
  const val = Number(localStorage.getItem("am_volume"));
  return Number.isFinite(val) && val >= 0 && val <= 1 ? val : 0.8;
};

const getStoredQuality = (): AudioQuality => {
  const q = localStorage.getItem("am_quality");
  if (q === "320kbps" || q === "160kbps" || q === "96kbps") return q;
  return "320kbps";
};

export type RepeatMode = "off" | "all" | "one";
export type RightPanelMode = "none" | "queue" | "lyrics";

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  history: Song[];
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  autoplay: boolean;
  quality: AudioQuality;
  currentTime: number;
  duration: number;
  isNowPlayingOpen: boolean;
  rightPanel: RightPanelMode;
  error: string | null;
}

const initialState: PlayerState = {
  currentSong: null,
  queue: [],
  history: [],
  isPlaying: false,
  isLoading: false,
  volume: getStoredVolume(),
  isMuted: false,
  shuffle: false,
  repeat: "off",
  autoplay: true,
  quality: getStoredQuality(),
  currentTime: 0,
  duration: 0,
  isNowPlayingOpen: false,
  rightPanel: "none",
  error: null,
};

export const playSong = createAsyncThunk<
  { song: Song; queue?: Song[] },
  { song: Song | { id: string }; queue?: Song[]; pushHistory?: boolean },
  { state: RootState }
>("player/playSong", async ({ song, queue }, { dispatch, getState }) => {
  const state = getState().player;
  let resolvedSong: Song;

  if ("downloadUrl" in song && song.downloadUrl?.length) {
    resolvedSong = song;
  } else {
    const fetched = await jiosaavnApi.getSongById(song.id);
    if (!fetched?.length) throw new Error("Song not found");
    resolvedSong = fetched[0];
  }

  dispatch(LibraryActions.addRecentlyPlayed(resolvedSong));

  if (queue) {
    return { song: resolvedSong, queue };
  }
  if (!state.queue.length && resolvedSong.id) {
    // Pre-populate queue with suggestions in background when starting a single song
    jiosaavnApi
      .getSongSuggestions(resolvedSong.id, 10)
      .then((suggestions) => {
        if (suggestions?.length) {
          dispatch(PlayerActions.appendSuggestionsIfEmpty(suggestions));
        }
      })
      .catch(() => {});
  }

  return { song: resolvedSong };
});

export const playCollection = createAsyncThunk<
  void,
  { type: "album" | "playlist" | "artist"; id: string; shuffle?: boolean },
  { dispatch: any }
>("player/playCollection", async ({ type, id, shuffle }, { dispatch }) => {
  let songs: Song[] = [];
  if (type === "album") {
    const album = await jiosaavnApi.getAlbumById(id);
    songs = album.songs || [];
  } else if (type === "playlist") {
    const playlist = await jiosaavnApi.getPlaylistById(id, 0, 50);
    songs = playlist.songs || [];
  } else {
    const artist = await jiosaavnApi.getArtistById(id);
    songs = artist.topSongs || [];
  }

  if (!songs.length) throw new Error("No playable tracks found");
  const list = shuffle ? [...songs].sort(() => Math.random() - 0.5) : songs;
  await dispatch(playSong({ song: list[0], queue: list.slice(1) }));
});

export const playNext = createAsyncThunk<void, void, { state: RootState }>(
  "player/playNext",
  async (_, { getState, dispatch }) => {
    const { currentSong, queue, history, shuffle, repeat, autoplay } = getState().player;
    if (!currentSong) return;

    if (queue.length > 0) {
      const idx = shuffle ? Math.floor(Math.random() * queue.length) : 0;
      const next = queue[idx];
      const remaining = queue.filter((_, i) => i !== idx);
      if (repeat === "all") {
        remaining.push(currentSong);
      }
      await dispatch(playSong({ song: next, queue: remaining }));
      return;
    }

    if (repeat === "all" && history.length > 0) {
      const restarted = [...history, currentSong];
      await dispatch(playSong({ song: restarted[0], queue: restarted.slice(1) }));
      return;
    }

    if (autoplay) {
      const suggestions = await jiosaavnApi.getSongSuggestions(currentSong.id, 10);
      const filtered = suggestions.filter((s) => s.id !== currentSong.id);
      if (filtered.length > 0) {
        await dispatch(playSong({ song: filtered[0], queue: filtered.slice(1) }));
        return;
      }
    }

    dispatch(PlayerActions.setPlaying(false));
  }
);

export const playPrevious = createAsyncThunk<void, void, { state: RootState }>(
  "player/playPrevious",
  async (_, { getState, dispatch }) => {
    const { history, currentSong, queue } = getState().player;
    if (!history.length) return;
    const prev = history[history.length - 1];
    dispatch(PlayerActions.popHistory());
    const nextQueue = currentSong ? [currentSong, ...queue] : queue;
    await dispatch(playSong({ song: prev, queue: nextQueue, pushHistory: false }));
  }
);

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    setPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload;
    },
    togglePlay(state) {
      if (state.currentSong) {
        state.isPlaying = !state.isPlaying;
      }
    },
    setVolume(state, action: PayloadAction<number>) {
      state.volume = Math.max(0, Math.min(1, action.payload));
      state.isMuted = false;
      localStorage.setItem("am_volume", String(state.volume));
    },
    toggleMute(state) {
      state.isMuted = !state.isMuted;
    },
    toggleShuffle(state) {
      state.shuffle = !state.shuffle;
    },
    cycleRepeat(state) {
      state.repeat =
        state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off";
    },
    toggleAutoplay(state) {
      state.autoplay = !state.autoplay;
    },
    setQuality(state, action: PayloadAction<AudioQuality>) {
      state.quality = action.payload;
      localStorage.setItem("am_quality", action.payload);
    },
    setTime(state, action: PayloadAction<{ currentTime: number; duration?: number }>) {
      state.currentTime = action.payload.currentTime;
      if (action.payload.duration !== undefined && Number.isFinite(action.payload.duration)) {
        state.duration = action.payload.duration;
      }
    },
    addToQueue(state, action: PayloadAction<Song>) {
      if (!state.currentSong) {
        state.currentSong = action.payload;
        state.isPlaying = true;
      } else {
        state.queue.push(action.payload);
      }
    },
    playNextInQueue(state, action: PayloadAction<Song>) {
      if (!state.currentSong) {
        state.currentSong = action.payload;
        state.isPlaying = true;
      } else {
        state.queue.unshift(action.payload);
      }
    },
    removeFromQueue(state, action: PayloadAction<number>) {
      state.queue.splice(action.payload, 1);
    },
    clearQueue(state) {
      state.queue = [];
    },
    appendSuggestionsIfEmpty(state, action: PayloadAction<Song[]>) {
      if (state.queue.length === 0 && state.currentSong) {
        state.queue = action.payload.filter((s) => s.id !== state.currentSong?.id);
      }
    },
    popHistory(state) {
      state.history.pop();
    },
    setNowPlayingOpen(state, action: PayloadAction<boolean>) {
      state.isNowPlayingOpen = action.payload;
    },
    setRightPanel(state, action: PayloadAction<RightPanelMode>) {
      state.rightPanel = state.rightPanel === action.payload ? "none" : action.payload;
    },
    closeRightPanel(state) {
      state.rightPanel = "none";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(playSong.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(playSong.fulfilled, (state, action) => {
        const pushHistory = action.meta.arg.pushHistory !== false;
        if (pushHistory && state.currentSong && state.currentSong.id !== action.payload.song.id) {
          state.history = [...state.history.slice(-24), state.currentSong];
        }
        state.currentSong = action.payload.song;
        if (action.payload.queue !== undefined) {
          state.queue = action.payload.queue;
        }
        state.currentTime = 0;
        state.duration = action.payload.song.duration || 0;
        state.isLoading = false;
        state.isPlaying = true;
      })
      .addCase(playSong.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Unable to play track";
      });
  },
});

export const PlayerActions = playerSlice.actions;
export default playerSlice.reducer;
