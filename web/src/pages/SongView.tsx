import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DownloadIcon, HeartIcon, PlayIcon } from "../components/icons/AppleIcons";
import HorizontalCarousel from "../components/music/HorizontalCarousel";
import MediaCard from "../components/music/MediaCard";
import {
  decodeText,
  formatCompactNumber,
  formatDuration,
  getArtistLabel,
  getBestImage,
  jiosaavnApi,
} from "../lib/jiosaavn";
import { DownloadActions } from "../store/downloadSlice";
import { LibraryActions } from "../store/librarySlice";
import { playSong } from "../store/playerSlice";
import { useAppDispatch, useAppSelector } from "../store/store";
import type { Song } from "../types/jiosaavn";

const SongView = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const likedSongs = useAppSelector((s) => s.library.likedSongs);

  const [song, setSong] = useState<Song | null>(null);
  const [suggestions, setSuggestions] = useState<Song[]>([]);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setLyrics(null);

    jiosaavnApi
      .getSongById(id)
      .then((res) => {
        if (!active) return;
        const found = res[0] || null;
        setSong(found);
        if (found) {
          jiosaavnApi
            .getSongSuggestions(found.id, 12)
            .then((s) => active && setSuggestions(s))
            .catch(() => {});
          jiosaavnApi
            .getSongLyrics(found.id, {
              title: decodeText(found.name),
              artist: getArtistLabel(found),
              album: decodeText(found.album?.name),
              duration: found.duration,
            })
            .then((l) => active && setLyrics(l.lyrics))
            .catch(() => {});
        }
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
      <div className="flex justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#fa243c] border-t-transparent" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
        <p className="font-semibold text-red-500">Song not found</p>
      </div>
    );
  }

  const isLiked = likedSongs.some((s) => s.id === song.id);
  const plays = formatCompactNumber(song.playCount);

  return (
    <div className="space-y-8">
      <section className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
        <img
          src={getBestImage(song.image, "500x500")}
          alt={decodeText(song.name)}
          className="h-56 w-56 sm:h-64 sm:w-64 rounded-2xl object-cover shadow-2xl"
        />
        <div className="flex-1 min-w-0 text-center sm:text-left space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#fa243c]">
              Song
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mt-1">
              {decodeText(song.name)}
            </h1>
            <p className="text-base font-medium text-[#fa243c] mt-1">
              {getArtistLabel(song)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {[
                song.album?.name ? decodeText(song.album.name) : null,
                song.year,
                formatDuration(song.duration),
                plays ? `${plays} plays` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button
              type="button"
              onClick={() => dispatch(playSong({ song, queue: suggestions }))}
              className="flex items-center gap-2 rounded-xl bg-[#fa243c] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#e01e35]"
            >
              <PlayIcon className="h-4 w-4" />
              Play Now
            </button>
            <button
              type="button"
              onClick={() => dispatch(DownloadActions.openSongDownload(song))}
              className="flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10"
            >
              <DownloadIcon className="h-4 w-4 text-[#fa243c]" />
              Download
            </button>
            <button
              type="button"
              onClick={() => dispatch(LibraryActions.toggleLikeSong(song))}
              className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                isLiked
                  ? "border-[#fa243c]/40 bg-[#fa243c]/10 text-[#fa243c]"
                  : "border-black/10 dark:border-white/15"
              }`}
            >
              <HeartIcon filled={isLiked} className="h-4 w-4" />
              {isLiked ? "Liked" : "Like"}
            </button>
            {song.album?.id && (
              <Link
                to={`/album/${song.album.id}`}
                className="rounded-xl border border-black/10 dark:border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10"
              >
                View Album
              </Link>
            )}
          </div>
        </div>
      </section>

      {lyrics && (
        <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-zinc-100/70 dark:bg-zinc-900/60 p-6 space-y-3">
          <h2 className="text-lg font-bold">Lyrics</h2>
          <div
            className="text-base leading-relaxed text-zinc-700 dark:text-zinc-200"
            dangerouslySetInnerHTML={{ __html: lyrics }}
          />
        </section>
      )}

      {suggestions.length > 0 && (
        <HorizontalCarousel title="You Might Also Like">
          {suggestions.map((s) => (
            <MediaCard
              key={s.id}
              id={s.id}
              title={s.name}
              type="song"
              image={s.image}
              artists={s.artists}
              explicit={s.explicitContent}
            />
          ))}
        </HorizontalCarousel>
      )}
    </div>
  );
};

export default SongView;
