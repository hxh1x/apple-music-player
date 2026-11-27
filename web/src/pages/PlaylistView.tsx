import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DownloadIcon, HeartIcon, PlayIcon, ShuffleIcon } from "../components/icons/AppleIcons";
import TrackRow from "../components/music/TrackRow";
import { decodeText, getBestImage, jiosaavnApi } from "../lib/jiosaavn";
import { DownloadActions } from "../store/downloadSlice";
import { LibraryActions } from "../store/librarySlice";
import { playSong } from "../store/playerSlice";
import { useAppDispatch, useAppSelector } from "../store/store";
import type { Playlist } from "../types/jiosaavn";

const PlaylistView = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const savedPlaylists = useAppSelector((s) => s.library.savedPlaylists);

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);
    jiosaavnApi
      .getPlaylistById(id, 0, 60)
      .then((data) => {
        if (active) setPlaylist(data);
      })
      .catch((err) => {
        if (active) setError(err?.message || "Failed to load playlist");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end">
          <div className="h-56 w-56 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-3 flex-1 w-full">
            <div className="h-8 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-5 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
        <p className="font-semibold text-red-500">{error || "Playlist not found"}</p>
      </div>
    );
  }

  const songs = playlist.songs || [];
  const isSaved = savedPlaylists.some((p) => p.id === playlist.id);

  const handlePlayAll = (shuffled = false) => {
    if (!songs.length) return;
    const list = shuffled ? [...songs].sort(() => Math.random() - 0.5) : songs;
    dispatch(playSong({ song: list[0], queue: list.slice(1) }));
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
        <img
          src={getBestImage(playlist.image, "500x500")}
          alt={decodeText(playlist.name)}
          className="h-56 w-56 sm:h-64 sm:w-64 shrink-0 rounded-2xl object-cover shadow-2xl"
        />

        <div className="flex-1 min-w-0 text-center sm:text-left space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#fa243c]">
              Playlist
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mt-1">
              {decodeText(playlist.name)}
            </h1>
            {playlist.description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                {decodeText(playlist.description)}
              </p>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-1">
              {[playlist.language, `${songs.length} Songs`].filter(Boolean).join(" · ")}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
            <button
              type="button"
              onClick={() => handlePlayAll(false)}
              disabled={!songs.length}
              className="flex items-center gap-2 rounded-xl bg-[#fa243c] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#e01e35] active:scale-95 transition-all disabled:opacity-50"
            >
              <PlayIcon className="h-4 w-4" />
              Play
            </button>
            <button
              type="button"
              onClick={() => handlePlayAll(true)}
              disabled={!songs.length}
              className="flex items-center gap-2 rounded-xl bg-zinc-200/80 dark:bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-300/80 dark:hover:bg-white/15 active:scale-95 transition-all disabled:opacity-50"
            >
              <ShuffleIcon className="h-4 w-4 text-[#fa243c]" />
              Shuffle
            </button>
            <button
              type="button"
              onClick={() =>
                dispatch(
                  DownloadActions.openCollectionDownload({
                    title: playlist.name,
                    coverUrl: getBestImage(playlist.image, "500x500"),
                    songs,
                  })
                )
              }
              disabled={!songs.length}
              className="flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
            >
              <DownloadIcon className="h-4 w-4 text-[#fa243c]" />
              Download Playlist
            </button>
            <button
              type="button"
              onClick={() => dispatch(LibraryActions.toggleSavePlaylist(playlist))}
              className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                isSaved
                  ? "border-[#fa243c]/40 bg-[#fa243c]/10 text-[#fa243c]"
                  : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              <HeartIcon filled={isSaved} className="h-4 w-4" />
              {isSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </section>

      <section className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
        {songs.map((song, idx) => (
          <TrackRow
            key={`${song.id}-${idx}`}
            song={song}
            index={idx}
            queueContext={songs}
          />
        ))}
      </section>
    </div>
  );
};

export default PlaylistView;
