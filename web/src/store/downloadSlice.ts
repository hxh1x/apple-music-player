import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Song } from "../types/jiosaavn";

export type DownloadTarget =
  | { kind: "song"; song: Song }
  | {
      kind: "collection";
      title: string;
      subtitle?: string;
      coverUrl: string;
      songs: Song[];
    };

interface DownloadState {
  target: DownloadTarget | null;
}

const initialState: DownloadState = {
  target: null,
};

const downloadSlice = createSlice({
  name: "download",
  initialState,
  reducers: {
    openSongDownload(state, action: PayloadAction<Song>) {
      state.target = { kind: "song", song: action.payload };
    },
    openCollectionDownload(
      state,
      action: PayloadAction<{
        title: string;
        subtitle?: string;
        coverUrl: string;
        songs: Song[];
      }>
    ) {
      state.target = { kind: "collection", ...action.payload };
    },
    closeDownloadModal(state) {
      state.target = null;
    },
  },
});

export const DownloadActions = downloadSlice.actions;
export default downloadSlice.reducer;
