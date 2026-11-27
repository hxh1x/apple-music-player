import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PlayIcon, SearchIcon } from "../components/icons/AppleIcons";
import HorizontalCarousel from "../components/music/HorizontalCarousel";
import MediaCard from "../components/music/MediaCard";
import TrackRow from "../components/music/TrackRow";
import { decodeText, getBestImage, jiosaavnApi } from "../lib/jiosaavn";
import { playCollection, playSong } from "../store/playerSlice";
import { useAppDispatch } from "../store/store";
import type {
  Album,
  ArtistMini,
  GlobalSearchData,
  Playlist,
  Song,
} from "../types/jiosaavn";

type SearchTab = "all" | "songs" | "albums" | "playlists" | "artists";

const QUICK_SEARCHES = [
  "Arijit Singh",
  "The Weeknd",
  "Taylor Swift",
  "Pritam",
  "Imagine Dragons",
  "Diljit Dosanjh",
  "Coldplay",
  "A.R. Rahman",
];

const SearchView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const urlQuery = searchParams.get("q") || "";
  const [input, setInput] = useState(urlQuery);
  const [tab, setTab] = useState<SearchTab>("all");

  const [loading, setLoading] = useState(false);
  const [globalData, setGlobalData] = useState<GlobalSearchData | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [artists, setArtists] = useState<ArtistMini[]>([]);

  useEffect(() => {
    setInput(urlQuery);
  }, [urlQuery]);

  // Debounce input -> URL param
  useEffect(() => {
    const t = setTimeout(() => {
      if (input.trim() !== urlQuery) {
        if (input.trim()) {
          setSearchParams({ q: input.trim() }, { replace: true });
        } else if (urlQuery) {
          setSearchParams({}, { replace: true });
        }
      }
    }, 350);
    return () => clearTimeout(t);
  }, [input, urlQuery, setSearchParams]);

  useEffect(() => {
    if (!urlQuery.trim()) {
      setGlobalData(null);
      setSongs([]);
      setAlbums([]);
      setPlaylists([]);
      setArtists([]);
      return;
    }
    let active = true;
    setLoading(true);
    Promise.all([
      jiosaavnApi.searchAll(urlQuery),
      jiosaavnApi.searchSongs(urlQuery, 0, 20),
      jiosaavnApi.searchAlbums(urlQuery, 0, 15),
      jiosaavnApi.searchPlaylists(urlQuery, 0, 15),
      jiosaavnApi.searchArtists(urlQuery, 0, 15),
    ])
      .then(([globalRes, songRes, albumRes, playlistRes, artistRes]) => {
        if (!active) return;
        setGlobalData(globalRes);
        setSongs(songRes.results || []);
        setAlbums(albumRes.results || []);
        setPlaylists(playlistRes.results || []);
        setArtists(artistRes.results || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [urlQuery]);

  const topResult = globalData?.topQuery?.results?.[0];

  const handlePlayTop = () => {
    if (!topResult) return;
    if (topResult.type === "song") {
      dispatch(playSong({ song: { id: topResult.id } }));
    } else if (
      topResult.type === "album" ||
      topResult.type === "playlist" ||
      topResult.type === "artist"
    ) {
      dispatch(playCollection({ type: topResult.type, id: topResult.id }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Search</h1>

        <div className="relative flex items-center">
          <SearchIcon className="pointer-events-none absolute left-3.5 h-4 w-4 text-zinc-400" />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Artists, Songs, Lyrics, and More"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 py-3 pl-10 pr-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-[#fa243c] focus:outline-none"
          />
        </div>
      </div>

      {/* Empty State: Trending Search Chips */}
      {!urlQuery.trim() && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-zinc-700 dark:text-zinc-200">
            Trending Searches
          </h2>
          <div className="flex flex-wrap gap-2">
            {QUICK_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setInput(term)}
                className="rounded-full border border-black/10 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 px-4 py-2 text-xs font-medium hover:bg-[#fa243c] hover:text-white hover:border-[#fa243c] transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {urlQuery.trim() && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(["all", "songs", "albums", "playlists", "artists"] as SearchTab[]).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors shrink-0 ${
                  tab === t
                    ? "bg-[#fa243c] text-white"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                {t}
              </button>
            )
          )}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#fa243c] border-t-transparent" />
        </div>
      )}

      {!loading && urlQuery.trim() && (
        <div className="space-y-8">
          {tab === "all" && (
            <>
              {/* Top Result + Top Songs Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {topResult && (
                  <div className="lg:col-span-5 space-y-3">
                    <h2 className="text-lg font-bold">Top Result</h2>
                    <Link
                      to={`/${topResult.type === "album" || topResult.type === "artist" || topResult.type === "song" ? topResult.type : "playlist"}/${topResult.id}`}
                      className="group flex items-center gap-4 rounded-2xl border border-black/10 dark:border-white/10 bg-zinc-100/80 dark:bg-zinc-900/80 p-4 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/80 transition-colors"
                    >
                      <img
                        src={getBestImage(topResult.image, "500x500")}
                        alt={decodeText(topResult.title)}
                        className={`h-24 w-24 object-cover shadow-lg ${
                          topResult.type === "artist" ? "rounded-full" : "rounded-xl"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="inline-block rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300 mb-1">
                          {topResult.type}
                        </span>
                        <h3 className="truncate text-lg font-bold">
                          {decodeText(topResult.title)}
                        </h3>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {decodeText(topResult.description || topResult.primaryArtists)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePlayTop();
                        }}
                        aria-label="Play top result"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fa243c] text-white shadow-lg hover:scale-105 transition-transform"
                      >
                        <PlayIcon className="h-5 w-5 ml-0.5" />
                      </button>
                    </Link>
                  </div>
                )}

                {songs.length > 0 && (
                  <div className={topResult ? "lg:col-span-7 space-y-2" : "lg:col-span-12 space-y-2"}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold">Songs</h2>
                      <button
                        type="button"
                        onClick={() => setTab("songs")}
                        className="text-xs font-semibold text-[#fa243c] hover:underline"
                      >
                        See All
                      </button>
                    </div>
                    <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                      {songs.slice(0, 5).map((song, idx) => (
                        <TrackRow
                          key={song.id}
                          song={song}
                          index={idx}
                          queueContext={songs}
                          showAlbum={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {albums.length > 0 && (
                <HorizontalCarousel title="Albums">
                  {albums.map((a) => (
                    <MediaCard
                      key={a.id}
                      id={a.id}
                      title={a.name}
                      type="album"
                      image={a.image}
                      artists={a.artists}
                      explicit={a.explicitContent}
                    />
                  ))}
                </HorizontalCarousel>
              )}

              {artists.length > 0 && (
                <HorizontalCarousel title="Artists">
                  {artists.map((ar) => (
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

              {playlists.length > 0 && (
                <HorizontalCarousel title="Playlists">
                  {playlists.map((pl) => (
                    <MediaCard
                      key={pl.id}
                      id={pl.id}
                      title={pl.name}
                      subtitle={pl.songCount ? `${pl.songCount} Songs` : "Playlist"}
                      type="playlist"
                      image={pl.image}
                    />
                  ))}
                </HorizontalCarousel>
              )}
            </>
          )}

          {tab === "songs" &&
            (songs.length > 0 ? (
              <div className="space-y-1">
                {songs.map((song, idx) => (
                  <TrackRow
                    key={song.id}
                    song={song}
                    index={idx}
                    queueContext={songs}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400 py-12 text-center">
                No songs found for &ldquo;{urlQuery}&rdquo;.
              </p>
            ))}

          {tab === "albums" &&
            (albums.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albums.map((a) => (
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
            ) : (
              <p className="text-sm text-zinc-400 py-12 text-center">
                No albums found for &ldquo;{urlQuery}&rdquo;.
              </p>
            ))}

          {tab === "playlists" &&
            (playlists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {playlists.map((pl) => (
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
            ) : (
              <p className="text-sm text-zinc-400 py-12 text-center">
                No playlists found for &ldquo;{urlQuery}&rdquo;.
              </p>
            ))}

          {tab === "artists" &&
            (artists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {artists.map((ar) => (
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
            ) : (
              <p className="text-sm text-zinc-400 py-12 text-center">
                No artists found for &ldquo;{urlQuery}&rdquo;.
              </p>
            ))}
        </div>
      )}
    </div>
  );
};

export default SearchView;
