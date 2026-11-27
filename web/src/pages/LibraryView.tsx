import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { DownloadIcon, PlayIcon, PlusIcon, TrashIcon } from "../components/icons/AppleIcons";
import MediaCard from "../components/music/MediaCard";
import TrackRow from "../components/music/TrackRow";
import { getBestImage } from "../lib/jiosaavn";
import { DownloadActions } from "../store/downloadSlice";
import { LibraryActions } from "../store/librarySlice";
import { playSong } from "../store/playerSlice";
import { useAppDispatch, useAppSelector } from "../store/store";

type LibraryTab = "songs" | "playlists" | "albums" | "artists" | "recent";

const LibraryView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const {
    likedSongs,
    savedAlbums,
    savedPlaylists,
    followedArtists,
    recentlyPlayed,
    userPlaylists,
  } = useAppSelector((s) => s.library);

  const selectedPlaylistId = searchParams.get("playlist");
  const urlTab = (searchParams.get("tab") as LibraryTab) || "songs";
  const [newPlName, setNewPlName] = useState("");

  const activeUserPlaylist = userPlaylists.find((p) => p.id === selectedPlaylistId);

  const handleCreatePlaylist = (e: FormEvent) => {
    e.preventDefault();
    if (!newPlName.trim()) return;
    dispatch(LibraryActions.createPlaylist({ name: newPlName }));
    setNewPlName("");
  };

  if (activeUserPlaylist) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/[0.07] dark:border-white/[0.08] pb-4">
          <div>
            <button
              type="button"
              onClick={() => setSearchParams({ tab: "playlists" })}
              className="text-xs font-semibold text-[#fa243c] hover:underline mb-1"
            >
              ← Back to Library
            </button>
            <h1 className="text-3xl font-bold tracking-tight">
              {activeUserPlaylist.name}
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              {activeUserPlaylist.songs.length} Songs · Personal Playlist
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!activeUserPlaylist.songs.length}
              onClick={() =>
                dispatch(
                  playSong({
                    song: activeUserPlaylist.songs[0],
                    queue: activeUserPlaylist.songs.slice(1),
                  })
                )
              }
              className="flex items-center gap-2 rounded-xl bg-[#fa243c] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <PlayIcon className="h-4 w-4" />
              Play All
            </button>
            <button
              type="button"
              disabled={!activeUserPlaylist.songs.length}
              onClick={() =>
                dispatch(
                  DownloadActions.openCollectionDownload({
                    title: activeUserPlaylist.name,
                    coverUrl: getBestImage(activeUserPlaylist.songs[0]?.image, "500x500"),
                    songs: activeUserPlaylist.songs,
                  })
                )
              }
              className="flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
            >
              <DownloadIcon className="h-4 w-4 text-[#fa243c]" />
              Download Playlist
            </button>
            <button
              type="button"
              onClick={() => {
                dispatch(LibraryActions.deleteUserPlaylist(activeUserPlaylist.id));
                setSearchParams({ tab: "playlists" });
              }}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {activeUserPlaylist.songs.length === 0 ? (
          <p className="text-sm text-zinc-400 py-10 text-center">
            This playlist is empty. Click the ··· menu on any song to add it here.
          </p>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
            {activeUserPlaylist.songs.map((song, idx) => (
              <TrackRow
                key={song.id}
                song={song}
                index={idx}
                queueContext={activeUserPlaylist.songs}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const tabs: { key: LibraryTab; label: string; count: number }[] = [
    { key: "songs", label: "Liked Songs", count: likedSongs.length },
    {
      key: "playlists",
      label: "Playlists",
      count: userPlaylists.length + savedPlaylists.length,
    },
    { key: "albums", label: "Albums", count: savedAlbums.length },
    { key: "artists", label: "Artists", count: followedArtists.length },
    { key: "recent", label: "Recent", count: recentlyPlayed.length },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Library</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSearchParams({ tab: t.key })}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              urlTab === t.key
                ? "bg-[#fa243c] text-white"
                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {urlTab === "songs" && (
        <div className="space-y-3">
          {likedSongs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  dispatch(playSong({ song: likedSongs[0], queue: likedSongs.slice(1) }))
                }
                className="flex items-center gap-2 rounded-xl bg-[#fa243c] px-5 py-2 text-xs font-semibold text-white"
              >
                <PlayIcon className="h-3.5 w-3.5" />
                Play Liked Songs
              </button>
              <button
                type="button"
                onClick={() =>
                  dispatch(
                    DownloadActions.openCollectionDownload({
                      title: "Liked Songs",
                      coverUrl: getBestImage(likedSongs[0]?.image, "500x500"),
                      songs: likedSongs,
                    })
                  )
                }
                className="flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/15 px-4 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10"
              >
                <DownloadIcon className="h-3.5 w-3.5 text-[#fa243c]" />
                Download All ({likedSongs.length})
              </button>
            </div>
          )}
          {likedSongs.length === 0 ? (
            <p className="text-sm text-zinc-400 py-12 text-center">
              Tap the heart icon on any song to save it to your library.
            </p>
          ) : (
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
              {likedSongs.map((song, idx) => (
                <TrackRow
                  key={song.id}
                  song={song}
                  index={idx}
                  queueContext={likedSongs}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {urlTab === "playlists" && (
        <div className="space-y-6">
          <form onSubmit={handleCreatePlaylist} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newPlName}
              onChange={(e) => setNewPlName(e.target.value)}
              placeholder="Create a new playlist..."
              className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 px-3.5 py-2 text-sm focus:border-[#fa243c] focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-[#fa243c] px-4 py-2 text-sm font-semibold text-white"
            >
              <PlusIcon className="h-4 w-4" />
              Create
            </button>
          </form>

          {userPlaylists.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold">Your Playlists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {userPlaylists.map((pl) => (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => setSearchParams({ playlist: pl.id })}
                    className="text-left rounded-2xl border border-black/10 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 p-4 hover:border-[#fa243c] transition-colors"
                  >
                    <p className="font-bold truncate">{pl.name}</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {pl.songs.length} songs
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {savedPlaylists.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold">Saved JioSaavn Playlists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {savedPlaylists.map((pl) => (
                  <MediaCard
                    key={pl.id}
                    id={pl.id}
                    title={pl.name}
                    subtitle={pl.songCount ? `${pl.songCount} Songs` : "Playlist"}
                    type="playlist"
                    image={pl.image}
                    size="lg"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {urlTab === "albums" &&
        (savedAlbums.length === 0 ? (
          <p className="text-sm text-zinc-400 py-12 text-center">No saved albums yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {savedAlbums.map((a) => (
              <MediaCard
                key={a.id}
                id={a.id}
                title={a.name}
                type="album"
                image={a.image}
                artists={a.artists}
                size="lg"
              />
            ))}
          </div>
        ))}

      {urlTab === "artists" &&
        (followedArtists.length === 0 ? (
          <p className="text-sm text-zinc-400 py-12 text-center">No followed artists yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {followedArtists.map((ar) => (
              <MediaCard
                key={ar.id}
                id={ar.id}
                title={ar.name}
                subtitle="Artist"
                type="artist"
                image={ar.image}
                size="lg"
              />
            ))}
          </div>
        ))}

      {urlTab === "recent" &&
        (recentlyPlayed.length === 0 ? (
          <p className="text-sm text-zinc-400 py-12 text-center">
            Songs you play will appear here.
          </p>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
            {recentlyPlayed.map((song, idx) => (
              <TrackRow
                key={song.id}
                song={song}
                index={idx}
                queueContext={recentlyPlayed}
              />
            ))}
          </div>
        ))}
    </div>
  );
};

export default LibraryView;
