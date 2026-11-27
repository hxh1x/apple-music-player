import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { HeartIcon, PlayIcon } from "../components/icons/AppleIcons";
import HorizontalCarousel from "../components/music/HorizontalCarousel";
import MediaCard from "../components/music/MediaCard";
import TrackRow from "../components/music/TrackRow";
import {
  decodeText,
  formatCompactNumber,
  getBestImage,
  jiosaavnApi,
} from "../lib/jiosaavn";
import { LibraryActions } from "../store/librarySlice";
import { playSong } from "../store/playerSlice";
import { useAppDispatch, useAppSelector } from "../store/store";
import type { ArtistDetail } from "../types/jiosaavn";

const ArtistView = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const followedArtists = useAppSelector((s) => s.library.followedArtists);

  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);
    jiosaavnApi
      .getArtistById(id)
      .then((data) => {
        if (active) setArtist(data);
      })
      .catch((err) => {
        if (active) setError(err?.message || "Failed to load artist");
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
        <div className="h-64 w-full rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
        <p className="font-semibold text-red-500">{error || "Artist not found"}</p>
      </div>
    );
  }

  const topSongs = artist.topSongs || [];
  const isFollowed = followedArtists.some((a) => a.id === artist.id);
  const followers = formatCompactNumber(artist.followerCount || artist.fanCount);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-zinc-900 text-white">
        <img
          src={getBestImage(artist.image, "500x500")}
          alt=""
          className="absolute inset-0 h-full w-full object-cover scale-125 blur-3xl opacity-45"
        />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8 bg-gradient-to-t from-black/75 via-black/35 to-transparent">
          <img
            src={getBestImage(artist.image, "500x500")}
            alt={decodeText(artist.name)}
            className="h-36 w-36 sm:h-44 sm:w-44 rounded-full object-cover shadow-2xl border-2 border-white/20"
          />
          <div className="text-center sm:text-left space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#ff375f]">
                Artist
              </span>
              {artist.isVerified && (
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold">
                  Verified
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
              {decodeText(artist.name)}
            </h1>
            {followers && (
              <p className="text-xs sm:text-sm text-white/70">
                {followers} Listeners · {artist.dominantLanguage || "Music"}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (topSongs.length) {
                    dispatch(playSong({ song: topSongs[0], queue: topSongs.slice(1) }));
                  }
                }}
                disabled={!topSongs.length}
                className="flex items-center gap-2 rounded-full bg-[#fa243c] px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[#e01e35] disabled:opacity-50"
              >
                <PlayIcon className="h-4 w-4" />
                Play Top Songs
              </button>
              <button
                type="button"
                onClick={() =>
                  dispatch(
                    LibraryActions.toggleFollowArtist({
                      id: artist.id,
                      name: artist.name,
                      image: artist.image,
                      type: "artist",
                      url: artist.url,
                    })
                  )
                }
                className={`flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                  isFollowed
                    ? "border-white bg-white text-black"
                    : "border-white/30 bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <HeartIcon filled={isFollowed} className="h-4 w-4" />
                {isFollowed ? "Following" : "Follow"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {topSongs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Top Songs</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 divide-y divide-black/[0.04] dark:divide-white/[0.05]">
            {topSongs.slice(0, 12).map((song, idx) => (
              <TrackRow
                key={song.id}
                song={song}
                index={idx}
                queueContext={topSongs}
                showAlbum={false}
              />
            ))}
          </div>
        </section>
      )}

      {artist.topAlbums && artist.topAlbums.length > 0 && (
        <HorizontalCarousel title="Albums">
          {artist.topAlbums.map((a) => (
            <MediaCard
              key={a.id}
              id={a.id}
              title={a.name}
              subtitle={a.year ? String(a.year) : "Album"}
              type="album"
              image={a.image}
            />
          ))}
        </HorizontalCarousel>
      )}

      {artist.singles && artist.singles.length > 0 && (
        <HorizontalCarousel title="Singles & EPs">
          {artist.singles.map((s) => (
            <MediaCard
              key={s.id}
              id={s.id}
              title={s.name}
              subtitle={s.year || "Single"}
              type="song"
              image={s.image}
            />
          ))}
        </HorizontalCarousel>
      )}

      {artist.similarArtists && artist.similarArtists.length > 0 && (
        <HorizontalCarousel title="Similar Artists">
          {artist.similarArtists.map((sa) => (
            <MediaCard
              key={sa.id}
              id={sa.id}
              title={sa.name}
              subtitle="Artist"
              type="artist"
              image={sa.image}
            />
          ))}
        </HorizontalCarousel>
      )}
    </div>
  );
};

export default ArtistView;
