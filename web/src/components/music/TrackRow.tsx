import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import {
  decodeText,
  formatDuration,
  getArtistLabel,
  getBestImage,
} from "../../lib/jiosaavn";
import { DownloadActions } from "../../store/downloadSlice";
import { LibraryActions } from "../../store/librarySlice";
import { PlayerActions, playSong } from "../../store/playerSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import type { Song } from "../../types/jiosaavn";
import { DownloadIcon, HeartIcon, MoreIcon, PauseIcon, PlayIcon, PlusIcon } from "../icons/AppleIcons";

interface TrackRowProps {
  song: Song;
  index: number;
  queueContext?: Song[];
  showArtwork?: boolean;
  showAlbum?: boolean;
}

const TrackRow = ({
  song,
  index,
  queueContext,
  showArtwork = true,
  showAlbum = true,
}: TrackRowProps) => {
  const dispatch = useAppDispatch();
  const { currentSong, isPlaying } = useAppSelector((s) => s.player);
  const { likedSongs, userPlaylists } = useAppSelector((s) => s.library);
  const [menuOpen, setMenuOpen] = useState(false);

  const isCurrent = currentSong?.id === song.id;
  const isLiked = likedSongs.some((s) => s.id === song.id);
  const title = decodeText(song.name);
  const artistText = getArtistLabel(song);
  const albumName = decodeText(song.album?.name);

  const handlePlay = () => {
    if (isCurrent) {
      dispatch(PlayerActions.togglePlay());
      return;
    }
    const remaining = queueContext ? queueContext.slice(index + 1) : undefined;
    dispatch(playSong({ song, queue: remaining }));
  };

  const handleLike = (e: MouseEvent) => {
    e.stopPropagation();
    dispatch(LibraryActions.toggleLikeSong(song));
  };

  return (
    <div
      onClick={handlePlay}
      className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2 cursor-pointer transition-colors ${
        isCurrent
          ? "bg-[#fa243c]/10 dark:bg-[#fa243c]/15"
          : "hover:bg-zinc-200/70 dark:hover:bg-white/[0.06]"
      }`}
    >
      {/* Index or Playing Equalizer */}
      <div className="w-6 shrink-0 flex items-center justify-center text-xs font-medium text-zinc-400">
        {isCurrent && isPlaying ? (
          <div className="flex items-end gap-[2px] h-3.5">
            <span className="w-[3px] h-full bg-[#fa243c] rounded-full eq-bar-1 origin-bottom" />
            <span className="w-[3px] h-full bg-[#fa243c] rounded-full eq-bar-2 origin-bottom" />
            <span className="w-[3px] h-full bg-[#fa243c] rounded-full eq-bar-3 origin-bottom" />
          </div>
        ) : (
          <>
            <span className="group-hover:hidden tabular-nums">
              {isCurrent ? (
                <PlayIcon className="h-3.5 w-3.5 text-[#fa243c]" />
              ) : (
                index + 1
              )}
            </span>
            <span className="hidden group-hover:flex text-zinc-900 dark:text-white">
              {isCurrent && isPlaying ? (
                <PauseIcon className="h-3.5 w-3.5 text-[#fa243c]" />
              ) : (
                <PlayIcon className="h-3.5 w-3.5 text-[#fa243c]" />
              )}
            </span>
          </>
        )}
      </div>

      {showArtwork && (
        <img
          src={getBestImage(song.image, "150x150")}
          alt={title}
          loading="lazy"
          className="h-11 w-11 shrink-0 rounded-lg object-cover bg-zinc-200 dark:bg-zinc-800 shadow-sm"
        />
      )}

      {/* Title & Artist */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`truncate text-sm font-medium ${
              isCurrent
                ? "text-[#fa243c]"
                : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {title}
          </span>
          {song.explicitContent && (
            <span className="shrink-0 rounded-[3px] bg-zinc-400/25 px-1 text-[9px] font-bold text-zinc-500 dark:text-zinc-300">
              E
            </span>
          )}
        </div>
        <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {song.artists?.primary?.length ? (
            song.artists.primary.slice(0, 3).map((a, idx) => (
              <span key={`${a.id}-${idx}`}>
                {idx > 0 && ", "}
                <Link
                  to={`/artist/${a.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  {decodeText(a.name)}
                </Link>
              </span>
            ))
          ) : (
            <span>{artistText}</span>
          )}
        </div>
      </div>

      {/* Album (desktop) */}
      {showAlbum && albumName && (
        <div className="hidden lg:block w-48 truncate text-xs text-zinc-500 dark:text-zinc-400">
          {song.album?.id ? (
            <Link
              to={`/album/${song.album.id}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              {albumName}
            </Link>
          ) : (
            albumName
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleLike}
          aria-label={isLiked ? "Unlike song" : "Like song"}
          className={`p-1.5 rounded-full transition-opacity ${
            isLiked
              ? "text-[#fa243c] opacity-100"
              : "text-zinc-400 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 hover:text-[#fa243c]"
          }`}
        >
          <HeartIcon filled={isLiked} className="h-4 w-4" />
        </button>

        <span className="w-10 text-right text-xs tabular-nums text-zinc-400">
          {formatDuration(song.duration)}
        </span>

        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            aria-label="Track options"
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
          >
            <MoreIcon className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseLeave={() => setMenuOpen(false)}
              className="absolute right-0 top-8 z-50 w-52 rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 p-1.5 shadow-2xl backdrop-blur-2xl text-xs"
            >
              <button
                type="button"
                onClick={() => {
                  dispatch(PlayerActions.playNextInQueue(song));
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-zinc-800 dark:text-zinc-100 hover:bg-[#fa243c] hover:text-white"
              >
                Play Next
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch(PlayerActions.addToQueue(song));
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-zinc-800 dark:text-zinc-100 hover:bg-[#fa243c] hover:text-white"
              >
                Add to Queue
              </button>
              <Link
                to={`/song/${song.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-zinc-800 dark:text-zinc-100 hover:bg-[#fa243c] hover:text-white"
              >
                Go to Song Details
              </Link>
              <button
                type="button"
                onClick={() => {
                  dispatch(DownloadActions.openSongDownload(song));
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-zinc-800 dark:text-zinc-100 hover:bg-[#fa243c] hover:text-white"
              >
                <DownloadIcon className="h-3.5 w-3.5 shrink-0" />
                Download MP3 (Cover &amp; Lyrics)
              </button>
              {userPlaylists.length > 0 && (
                <div className="my-1 border-t border-black/10 dark:border-white/10 pt-1">
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Add to Playlist
                  </p>
                  {userPlaylists.map((pl) => (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => {
                        dispatch(
                          LibraryActions.addSongToPlaylist({
                            playlistId: pl.id,
                            song,
                          })
                        );
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-left text-zinc-700 dark:text-zinc-200 hover:bg-[#fa243c] hover:text-white"
                    >
                      <PlusIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{pl.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackRow;
