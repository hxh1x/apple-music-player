import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  DownloadIcon,
  PlayIcon,
  SearchIcon,
} from "../components/icons/AppleIcons";
import HorizontalCarousel from "../components/music/HorizontalCarousel";
import MediaCard from "../components/music/MediaCard";
import TrackRow from "../components/music/TrackRow";
import { decodeText, getBestImage, jiosaavnApi } from "../lib/jiosaavn";
import { AuthActions } from "../store/authSlice";
import { DownloadActions } from "../store/downloadSlice";
import { playSong } from "../store/playerSlice";
import { useAppDispatch, useAppSelector } from "../store/store";
import type { Album, ArtistMini, HomeData, Song } from "../types/jiosaavn";

interface SimpleAlbumCard {
  id: string;
  name: string;
  image: Song["image"];
  artists?: Song["artists"];
  subtitle?: string;
}

const Home = () => {
  const dispatch = useAppDispatch();
  const { recentlyPlayed, savedAlbums, followedArtists } = useAppSelector(
    (s) => s.library
  );
  const currentSong = useAppSelector((s) => s.player.currentSong);

  const [similarSongs, setSimilarSongs] = useState<Song[]>([]);
  const [similarAlbums, setSimilarAlbums] = useState<SimpleAlbumCard[]>([]);
  const [similarArtists, setSimilarArtists] = useState<ArtistMini[]>([]);
  const [fallbackHome, setFallbackHome] = useState<HomeData | null>(null);
  const [starterSongs, setStarterSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);

  // Unique songs from history (currentSong first if playing)
  const historySongs = useMemo(() => {
    const list: Song[] = [];
    const seen = new Set<string>();
    if (currentSong) {
      seen.add(currentSong.id);
      list.push(currentSong);
    }
    for (const s of recentlyPlayed) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        list.push(s);
      }
    }
    return list;
  }, [currentSong, recentlyPlayed]);

  // Recently Played Albums extracted from played tracks + saved albums
  const recentAlbums = useMemo<SimpleAlbumCard[]>(() => {
    const map = new Map<string, SimpleAlbumCard>();
    for (const s of historySongs) {
      if (s.album?.id && s.album?.name && !map.has(s.album.id)) {
        map.set(s.album.id, {
          id: s.album.id,
          name: s.album.name,
          image: s.image,
          artists: s.artists,
        });
      }
    }
    for (const a of savedAlbums) {
      if (!map.has(a.id)) {
        map.set(a.id, {
          id: a.id,
          name: a.name,
          image: a.image,
          artists: a.artists,
        });
      }
    }
    return Array.from(map.values());
  }, [historySongs, savedAlbums]);

  // Artists from recent plays + followed artists
  const recentArtists = useMemo<ArtistMini[]>(() => {
    const map = new Map<string, ArtistMini>();
    for (const s of historySongs) {
      for (const a of s.artists?.primary || []) {
        if (a.id && !map.has(a.id)) {
          map.set(a.id, a);
        }
      }
    }
    for (const a of followedArtists) {
      if (a.id && !map.has(a.id)) {
        map.set(a.id, a);
      }
    }
    return Array.from(map.values());
  }, [historySongs, followedArtists]);

  const seedSongIds = historySongs
    .slice(0, 3)
    .map((s) => s.id)
    .join(",");
  const seedArtistIds = recentArtists
    .slice(0, 3)
    .map((a) => a.id)
    .join(",");

  useEffect(() => {
    if (!seedSongIds && !seedArtistIds) {
      setSimilarSongs([]);
      setSimilarAlbums([]);
      setSimilarArtists([]);
      return;
    }

    let active = true;
    setLoading(true);

    const songPromises = seedSongIds
      ? seedSongIds
          .split(",")
          .map((id) => jiosaavnApi.getSongSuggestions(id, 14).catch(() => [] as Song[]))
      : [];

    const artistPromises = seedArtistIds
      ? seedArtistIds
          .split(",")
          .map((id) => jiosaavnApi.getArtistById(id).catch(() => null))
      : [];

    Promise.all([Promise.all(songPromises), Promise.all(artistPromises)])
      .then(([songGroups, artistDetails]) => {
        if (!active) return;

        // Deduplicate similar songs
        const playedSet = new Set(historySongs.map((s) => s.id));
        const songMap = new Map<string, Song>();
        for (const group of songGroups) {
          for (const s of group) {
            if (!playedSet.has(s.id) && !songMap.has(s.id)) {
              songMap.set(s.id, s);
            }
          }
        }
        const mergedSongs = Array.from(songMap.values());
        setSimilarSongs(mergedSongs);

        // Build Similar Albums from artist topAlbums + albums of suggested songs
        const recentAlbumIds = new Set(recentAlbums.map((a) => a.id));
        const albumMap = new Map<string, SimpleAlbumCard>();

        for (const ad of artistDetails) {
          if (!ad) continue;
          for (const al of (ad.topAlbums || []) as Album[]) {
            if (al.id && !recentAlbumIds.has(al.id) && !albumMap.has(al.id)) {
              albumMap.set(al.id, {
                id: al.id,
                name: al.name,
                image: al.image,
                artists: al.artists,
                subtitle: al.year ? String(al.year) : "Album",
              });
            }
          }
        }
        for (const s of mergedSongs) {
          if (
            s.album?.id &&
            s.album?.name &&
            !recentAlbumIds.has(s.album.id) &&
            !albumMap.has(s.album.id)
          ) {
            albumMap.set(s.album.id, {
              id: s.album.id,
              name: s.album.name,
              image: s.image,
              artists: s.artists,
            });
          }
        }
        setSimilarAlbums(Array.from(albumMap.values()));

        // Build Similar Artists from artistDetails.similarArtists (fallback to recentArtists)
        const recentArtistSet = new Set(recentArtists.map((a) => a.id));
        const simArtistMap = new Map<string, ArtistMini>();
        for (const ad of artistDetails) {
          if (!ad) continue;
          for (const sa of ad.similarArtists || []) {
            if (sa.id && !recentArtistSet.has(sa.id) && !simArtistMap.has(sa.id)) {
              simArtistMap.set(sa.id, {
                id: sa.id,
                name: sa.name,
                image: sa.image,
                type: "artist",
                url: sa.url,
              });
            }
          }
        }
        setSimilarArtists(Array.from(simArtistMap.values()));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [seedSongIds, seedArtistIds]);

  const playList = (songs: Song[]) => {
    if (!songs.length) return;
    dispatch(playSong({ song: songs[0], queue: songs.slice(1) }));
  };

  const hasContent =
    historySongs.length > 0 ||
    recentAlbums.length > 0 ||
    recentArtists.length > 0;

  // When a visitor opens a fresh browser/domain with empty local history, load starter songs/albums/artists
  useEffect(() => {
    if (hasContent) return;
    let active = true;
    setLoading(true);
    jiosaavnApi
      .getHome(
        "hindi,english,punjabi,tamil,telugu,marathi,bengali,kannada,malayalam,gujarati"
      )
      .then(async (data) => {
        if (!active) return;
        setFallbackHome(data);
        const songIds = [...data.trending, ...data.albums]
          .filter((i) => i.type === "song")
          .map((i) => i.id);
        const uniqueIds = Array.from(new Set(songIds)).slice(0, 16);
        if (uniqueIds.length) {
          const songs = await jiosaavnApi.getSongsByIds(uniqueIds);
          if (active && songs.length) {
            setStarterSongs(songs);
            return;
          }
        }
        const searchFallback = await jiosaavnApi.searchSongs("top hits", 0, 16);
        if (active) setStarterSongs(searchFallback.results || []);
      })
      .catch(async () => {
        try {
          const searchFallback = await jiosaavnApi.searchSongs("top hits", 0, 16);
          if (active) setStarterSongs(searchFallback.results || []);
        } catch {
          // ignore
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [hasContent]);

  return (
    <div className="space-y-9">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Listen Now
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Your recent albums, artists, and personalized similar recommendations
          </p>
        </div>
        <Link
          to="/search"
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 px-4 py-2 text-xs font-semibold hover:border-[#fa243c] transition-colors"
        >
          <SearchIcon className="h-3.5 w-3.5 text-[#fa243c]" />
          Search Music
        </Link>
      </div>

      {!hasContent ? (
        <div className="space-y-9">
          <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-zinc-100/80 dark:bg-zinc-900/70 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Start Listening or Sign In to Sync
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Play any song below to build your Recently Played Albums, Artists &amp;
                Similar recommendations — or sign in to sync history from another device.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dispatch(AuthActions.openModal())}
              className="shrink-0 rounded-xl bg-[#fa243c] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#e01e35]"
            >
              Sign In / Sync
            </button>
          </section>

          {fallbackHome?.artists && fallbackHome.artists.length > 0 && (
            <HorizontalCarousel title="Artists">
              {fallbackHome.artists.map((ar) => (
                <MediaCard
                  key={ar.id}
                  id={ar.id}
                  title={ar.name}
                  subtitle="Artist"
                  type="artist"
                  image={ar.image}
                />
              ))}
            </HorizontalCarousel>
          )}

          {fallbackHome?.albums && fallbackHome.albums.length > 0 && (
            <HorizontalCarousel title="Albums">
              {fallbackHome.albums
                .filter((i) => i.type === "album")
                .map((al) => (
                  <MediaCard
                    key={al.id}
                    id={al.id}
                    title={al.name}
                    subtitle={al.subtitle || al.language}
                    type="album"
                    image={al.image}
                    artists={al.artists}
                  />
                ))}
            </HorizontalCarousel>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Popular Songs</h2>
              {starterSongs.length > 0 && (
                <button
                  type="button"
                  onClick={() => playList(starterSongs)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#fa243c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#e01e35]"
                >
                  <PlayIcon className="h-3.5 w-3.5" />
                  Play All
                </button>
              )}
            </div>
            {loading && starterSongs.length === 0 ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="h-14 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                {starterSongs.map((song, idx) => (
                  <TrackRow
                    key={song.id}
                    song={song}
                    index={idx}
                    queueContext={starterSongs}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <>
          {/* 1. Recently Played Albums */}
          {recentAlbums.length > 0 && (
            <HorizontalCarousel
              title="Recently Played Albums"
              subtitle="Albums from your listening history"
            >
              {recentAlbums.map((al) => (
                <MediaCard
                  key={al.id}
                  id={al.id}
                  title={al.name}
                  subtitle={al.subtitle}
                  type="album"
                  image={al.image}
                  artists={al.artists}
                />
              ))}
            </HorizontalCarousel>
          )}

          {/* 2. Similar Albums For You */}
          {similarAlbums.length > 0 ? (
            <HorizontalCarousel
              title="Similar Albums"
              subtitle="Albums matching your recent listens"
            >
              {similarAlbums.map((al) => (
                <MediaCard
                  key={al.id}
                  id={al.id}
                  title={al.name}
                  subtitle={al.subtitle}
                  type="album"
                  image={al.image}
                  artists={al.artists}
                />
              ))}
            </HorizontalCarousel>
          ) : (
            loading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-6 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex gap-4 overflow-hidden">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="w-44 h-44 shrink-0 rounded-xl bg-zinc-200 dark:bg-zinc-800"
                    />
                  ))}
                </div>
              </div>
            )
          )}

          {/* 3. Your Artists */}
          {recentArtists.length > 0 && (
            <HorizontalCarousel
              title="Your Artists"
              subtitle="Artists you recently listened to"
            >
              {recentArtists.map((ar) => (
                <MediaCard
                  key={ar.id}
                  id={ar.id}
                  title={ar.name}
                  subtitle="Artist"
                  type="artist"
                  image={ar.image}
                />
              ))}
            </HorizontalCarousel>
          )}

          {/* 4. Similar Artists */}
          {similarArtists.length > 0 && (
            <HorizontalCarousel
              title="Similar Artists"
              subtitle="Artists like the ones you play"
            >
              {similarArtists.map((sa) => (
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

          {/* 5. Recently Played Songs */}
          {historySongs.length > 0 && (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    Recently Played Songs
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                    {historySongs.length}{" "}
                    {historySongs.length === 1 ? "track" : "tracks"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => playList(historySongs)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#fa243c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#e01e35]"
                  >
                    <PlayIcon className="h-3.5 w-3.5" />
                    Play All
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch(
                        DownloadActions.openCollectionDownload({
                          title: "Recently Played",
                          coverUrl: getBestImage(historySongs[0]?.image, "500x500"),
                          songs: historySongs,
                        })
                      )
                    }
                    className="flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/15 px-3.5 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <DownloadIcon className="h-3.5 w-3.5 text-[#fa243c]" />
                    Download
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                {historySongs.slice(0, 12).map((song, idx) => (
                  <TrackRow
                    key={`${song.id}-${idx}`}
                    song={song}
                    index={idx}
                    queueContext={historySongs}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 6. Similar Songs */}
          {similarSongs.length > 0 && (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    Similar Songs
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                    Based on {decodeText(historySongs[0]?.name) || "your history"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => playList(similarSongs)}
                  className="flex items-center gap-1.5 rounded-xl bg-zinc-200/80 dark:bg-white/10 px-4 py-2 text-xs font-semibold hover:bg-zinc-300/80 dark:hover:bg-white/15"
                >
                  <PlayIcon className="h-3.5 w-3.5 text-[#fa243c]" />
                  Play Mix
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                {similarSongs.slice(0, 16).map((song, idx) => (
                  <TrackRow
                    key={`${song.id}-${idx}`}
                    song={song}
                    index={idx}
                    queueContext={similarSongs}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
