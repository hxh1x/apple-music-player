import { Range, Root, Thumb, Track } from "@radix-ui/react-slider";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  decodeText,
  formatDuration,
  getArtistLabel,
  getBestImage,
} from "../../lib/jiosaavn";
import { DownloadActions } from "../../store/downloadSlice";
import { LibraryActions } from "../../store/librarySlice";
import { PlayerActions, playNext, playPrevious, playSong } from "../../store/playerSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { seekAudio } from "../audio/AudioEngine";
import {
  ChevronDownIcon,
  DownloadIcon,
  HeartIcon,
  InfinityIcon,
  LyricsIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  PrevIcon,
  QueueIcon,
  RepeatIcon,
  ShuffleIcon,
  TrashIcon,
  VolumeIcon,
} from "../icons/AppleIcons";
import LyricsView from "./LyricsView";

type MobileTab = "player" | "lyrics" | "queue";
type DesktopRightTab = "lyrics" | "queue";

const NowPlayingModal = () => {
  const dispatch = useAppDispatch();
  const {
    isNowPlayingOpen,
    currentSong,
    queue,
    isPlaying,
    isLoading,
    volume,
    isMuted,
    shuffle,
    repeat,
    autoplay,
    quality,
    currentTime,
    duration,
  } = useAppSelector((s) => s.player);
  const { likedSongs, userPlaylists } = useAppSelector((s) => s.library);

  const [mobileTab, setMobileTab] = useState<MobileTab>("player");
  const [desktopTab, setDesktopTab] = useState<DesktopRightTab>("lyrics");
  const [playlistMenu, setPlaylistMenu] = useState(false);

  if (!currentSong) return null;

  const isLiked = likedSongs.some((s) => s.id === currentSong.id);
  const artwork = getBestImage(currentSong.image, "500x500");
  const maxDuration = duration || currentSong.duration || 0;
  const remaining = Math.max(0, maxDuration - currentTime);

  const renderQueuePanel = () => (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">
          Playing Next ({queue.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => dispatch(PlayerActions.toggleAutoplay())}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              autoplay ? "bg-[#fa243c] text-white" : "bg-white/10 text-white/70"
            }`}
          >
            <InfinityIcon className="h-3.5 w-3.5" />
            Autoplay
          </button>
          {queue.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch(PlayerActions.clearQueue())}
              className="text-xs text-[#fa243c] font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {queue.length === 0 ? (
        <p className="text-sm text-white/55 py-12 text-center">
          No queued songs. {autoplay ? "Autoplay will queue similar tracks." : ""}
        </p>
      ) : (
        <div className="space-y-1.5">
          {queue.map((song, idx) => (
            <div
              key={`${song.id}-${idx}`}
              onClick={() => dispatch(playSong({ song, queue: queue.slice(idx + 1) }))}
              className="group flex items-center gap-3 rounded-xl bg-white/5 hover:bg-white/15 p-2.5 cursor-pointer transition-colors"
            >
              <img
                src={getBestImage(song.image, "150x150")}
                alt=""
                className="h-11 w-11 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{decodeText(song.name)}</p>
                <p className="truncate text-xs text-white/60">{getArtistLabel(song)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(PlayerActions.removeFromQueue(idx));
                }}
                className="p-1.5 text-white/50 hover:text-white opacity-70 group-hover:opacity-100"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderScrubberAndControls = (compact = false) => (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* Progress Scrubber */}
      <div className="space-y-1">
        <Root
          min={0}
          max={maxDuration || 100}
          step={0.5}
          value={[Math.min(currentTime, maxDuration || 100)]}
          onValueChange={([v]) => seekAudio(v)}
          className="relative flex h-4 w-full touch-none items-center cursor-pointer"
        >
          <Track className="relative h-1.5 w-full grow rounded-full bg-white/25">
            <Range className="absolute h-full rounded-full bg-white" />
          </Track>
          <Thumb className="block h-3.5 w-3.5 rounded-full bg-white shadow-lg" />
        </Root>
        <div className="flex justify-between text-[11px] tabular-nums text-white/60">
          <span>{formatDuration(currentTime)}</span>
          <span>-{formatDuration(remaining)}</span>
        </div>
      </div>

      {/* Transport Buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => dispatch(PlayerActions.toggleShuffle())}
          className={`p-2 rounded-full ${
            shuffle ? "text-[#fa243c]" : "text-white/70 hover:text-white"
          }`}
        >
          <ShuffleIcon className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => dispatch(playPrevious())}
          className="p-2 text-white hover:scale-105 active:scale-95 transition-transform"
        >
          <PrevIcon className={compact ? "h-7 w-7" : "h-8 w-8"} />
        </button>

        <button
          type="button"
          onClick={() => dispatch(PlayerActions.togglePlay())}
          className={`flex items-center justify-center rounded-full bg-white text-black shadow-2xl hover:scale-105 active:scale-95 transition-transform ${
            compact ? "h-14 w-14" : "h-16 w-16"
          }`}
        >
          {isLoading ? (
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : isPlaying ? (
            <PauseIcon className={compact ? "h-7 w-7" : "h-8 w-8"} />
          ) : (
            <PlayIcon className={`${compact ? "h-7 w-7" : "h-8 w-8"} ml-1`} />
          )}
        </button>

        <button
          type="button"
          onClick={() => dispatch(playNext())}
          className="p-2 text-white hover:scale-105 active:scale-95 transition-transform"
        >
          <NextIcon className={compact ? "h-7 w-7" : "h-8 w-8"} />
        </button>

        <button
          type="button"
          onClick={() => dispatch(PlayerActions.cycleRepeat())}
          className={`relative p-2 rounded-full ${
            repeat !== "off" ? "text-[#fa243c]" : "text-white/70 hover:text-white"
          }`}
        >
          <RepeatIcon className="h-5 w-5" />
          {repeat === "one" && (
            <span className="absolute top-0 right-0 text-[10px] font-bold">1</span>
          )}
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => dispatch(PlayerActions.toggleMute())}
          className="text-white/70 hover:text-white"
        >
          <VolumeIcon level={volume} muted={isMuted} className="h-4 w-4" />
        </button>
        <Root
          min={0}
          max={1}
          step={0.02}
          value={[isMuted ? 0 : volume]}
          onValueChange={([v]) => dispatch(PlayerActions.setVolume(v))}
          className="relative flex h-4 w-full touch-none items-center cursor-pointer"
        >
          <Track className="relative h-1 w-full grow rounded-full bg-white/25">
            <Range className="absolute h-full rounded-full bg-white" />
          </Track>
          <Thumb className="block h-3 w-3 rounded-full bg-white shadow" />
        </Root>
      </div>
    </div>
  );

  const renderTrackActions = () => (
    <div className="flex items-center gap-2 shrink-0 relative">
      <button
        type="button"
        onClick={() => dispatch(DownloadActions.openSongDownload(currentSong))}
        aria-label="Download song"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white"
      >
        <DownloadIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => dispatch(LibraryActions.toggleLikeSong(currentSong))}
        aria-label="Like"
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 ${
          isLiked ? "text-[#fa243c]" : "text-white"
        }`}
      >
        <HeartIcon filled={isLiked} className="h-5 w-5" />
      </button>

      {userPlaylists.length > 0 && (
        <button
          type="button"
          onClick={() => setPlaylistMenu((v) => !v)}
          aria-label="Add to playlist"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      )}

      {playlistMenu && (
        <div className="absolute right-0 bottom-11 z-30 w-48 rounded-2xl border border-white/15 bg-zinc-900/95 p-1.5 shadow-2xl backdrop-blur-2xl text-xs">
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
                    song: currentSong,
                  })
                );
                setPlaylistMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-[#fa243c]"
            >
              <span className="truncate">{pl.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isNowPlayingOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 280 }}
          className="fixed inset-0 z-50 flex flex-col h-[100dvh] w-full bg-[#0b0b0d] text-white overflow-hidden select-none isolate"
        >
          {/* Ambient Blurred Artwork Backdrop */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <img
              src={artwork}
              alt=""
              className="h-full w-full scale-150 object-cover blur-3xl opacity-45 saturate-150"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/45 to-black/85" />
          </div>

          {/* Top Bar */}
          <div className="relative z-10 shrink-0 flex items-center justify-between px-5 sm:px-8 pt-4 pb-2">
            <button
              type="button"
              onClick={() => dispatch(PlayerActions.setNowPlayingOpen(false))}
              aria-label="Close Now Playing"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md"
            >
              <ChevronDownIcon className="h-5 w-5" />
            </button>

            <div className="text-center min-w-0 px-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
                Playing From
              </p>
              <p className="truncate text-xs font-semibold text-white/90">
                {decodeText(currentSong.album?.name) || "JioSaavn"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-md">
                {quality.replace("kbps", " kbps")}
              </span>
            </div>
          </div>

          {/* DESKTOP SPLIT-SCREEN LAYOUT (Fits 100vh cleanly, lyrics on right) */}
          <div className="relative z-10 hidden md:grid md:grid-cols-12 flex-1 min-h-0 max-w-6xl w-full mx-auto px-8 pb-6 pt-2 gap-8 lg:gap-12 items-center">
            {/* Left Column: Artwork + Metadata + Controls */}
            <div className="md:col-span-5 flex flex-col justify-center gap-4 min-h-0 h-full max-h-[680px]">
              <div className="flex justify-center">
                <motion.div
                  animate={{ scale: isPlaying ? 1 : 0.94 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="h-[36vh] max-h-[340px] aspect-square rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
                >
                  <img
                    src={artwork}
                    alt={decodeText(currentSong.name)}
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/song/${currentSong.id}`}
                    onClick={() => dispatch(PlayerActions.setNowPlayingOpen(false))}
                    className="block truncate text-xl font-bold tracking-tight hover:underline"
                  >
                    {decodeText(currentSong.name)}
                  </Link>
                  <p className="truncate text-sm text-white/70">
                    {getArtistLabel(currentSong)}
                  </p>
                </div>
                {renderTrackActions()}
              </div>

              {renderScrubberAndControls(true)}
            </div>

            {/* Right Column: Full-Height Scrollable Synced Lyrics & Queue */}
            <div className="md:col-span-7 flex flex-col h-full min-h-0 rounded-3xl bg-black/25 border border-white/10 backdrop-blur-md overflow-hidden">
              <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/10">
                <div className="flex gap-1 rounded-xl bg-white/10 p-1">
                  <button
                    type="button"
                    onClick={() => setDesktopTab("lyrics")}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      desktopTab === "lyrics"
                        ? "bg-white text-black shadow"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    <LyricsIcon className="h-3.5 w-3.5" />
                    Lyrics
                  </button>
                  <button
                    type="button"
                    onClick={() => setDesktopTab("queue")}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      desktopTab === "queue"
                        ? "bg-white text-black shadow"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    <QueueIcon className="h-3.5 w-3.5" />
                    Playing Next ({queue.length})
                  </button>
                </div>

                <Link
                  to={`/song/${currentSong.id}`}
                  onClick={() => dispatch(PlayerActions.setNowPlayingOpen(false))}
                  className="text-xs font-semibold text-white/65 hover:text-white"
                >
                  Song Info →
                </Link>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
                {desktopTab === "lyrics" ? (
                  <LyricsView
                    song={currentSong}
                    currentTime={currentTime}
                    variant="fullscreen"
                  />
                ) : (
                  renderQueuePanel()
                )}
              </div>
            </div>
          </div>

          {/* MOBILE LAYOUT (< md): Fits 100dvh cleanly and scrolls when needed */}
          <div className="relative z-10 md:hidden flex-1 min-h-0 flex flex-col">
            {mobileTab === "player" ? (
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-2 flex flex-col justify-between gap-4">
                <div className="flex flex-col items-center gap-4 my-auto">
                  <motion.div
                    animate={{ scale: isPlaying ? 1 : 0.94 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className="w-[min(70vw,34dvh)] max-w-[270px] aspect-square rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.65)] shrink-0"
                  >
                    <img
                      src={artwork}
                      alt={decodeText(currentSong.name)}
                      className="h-full w-full object-cover"
                    />
                  </motion.div>

                  <div className="w-full flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-bold tracking-tight">
                        {decodeText(currentSong.name)}
                      </h2>
                      <p className="truncate text-xs text-white/70">
                        {getArtistLabel(currentSong)}
                      </p>
                    </div>
                    {renderTrackActions()}
                  </div>

                  <div className="w-full">{renderScrubberAndControls(true)}</div>
                </div>
              </div>
            ) : mobileTab === "lyrics" ? (
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-2">
                <LyricsView
                  song={currentSong}
                  currentTime={currentTime}
                  variant="fullscreen"
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-2">
                {renderQueuePanel()}
              </div>
            )}

            {/* Compact Pinned Mobile Bottom Bar */}
            <div className="shrink-0 border-t border-white/10 bg-black/35 backdrop-blur-xl px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2.5">
              {mobileTab !== "player" && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={getBestImage(currentSong.image, "150x150")}
                      alt=""
                      className="h-9 w-9 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">
                        {decodeText(currentSong.name)}
                      </p>
                      <p className="truncate text-[11px] text-white/60">
                        {getArtistLabel(currentSong)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => dispatch(PlayerActions.togglePlay())}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black"
                  >
                    {isPlaying ? (
                      <PauseIcon className="h-4 w-4" />
                    ) : (
                      <PlayIcon className="h-4 w-4 ml-0.5" />
                    )}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMobileTab(mobileTab === "lyrics" ? "player" : "lyrics")
                  }
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold ${
                    mobileTab === "lyrics"
                      ? "bg-white text-black"
                      : "bg-white/10 text-white"
                  }`}
                >
                  <LyricsIcon className="h-4 w-4" />
                  Lyrics
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMobileTab(mobileTab === "queue" ? "player" : "queue")
                  }
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold ${
                    mobileTab === "queue"
                      ? "bg-white text-black"
                      : "bg-white/10 text-white"
                  }`}
                >
                  <QueueIcon className="h-4 w-4" />
                  Up Next
                </button>
                <Link
                  to={`/song/${currentSong.id}`}
                  onClick={() => dispatch(PlayerActions.setNowPlayingOpen(false))}
                  className="rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold"
                >
                  Info
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NowPlayingModal;
