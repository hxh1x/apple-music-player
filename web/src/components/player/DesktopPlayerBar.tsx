import { Range, Root, Thumb, Track } from "@radix-ui/react-slider";
import { Link } from "react-router-dom";
import {
  decodeText,
  formatDuration,
  getArtistLabel,
  getBestImage,
} from "../../lib/jiosaavn";
import { DownloadActions } from "../../store/downloadSlice";
import { LibraryActions } from "../../store/librarySlice";
import { PlayerActions, playNext, playPrevious } from "../../store/playerSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { seekAudio } from "../audio/AudioEngine";
import {
  AppleMusicLogo,
  DownloadIcon,
  ExpandIcon,
  HeartIcon,
  LyricsIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  QueueIcon,
  RepeatIcon,
  ShuffleIcon,
  VolumeIcon,
} from "../icons/AppleIcons";

const DesktopPlayerBar = () => {
  const dispatch = useAppDispatch();
  const {
    currentSong,
    isPlaying,
    isLoading,
    volume,
    isMuted,
    shuffle,
    repeat,
    currentTime,
    duration,
    quality,
    rightPanel,
  } = useAppSelector((s) => s.player);
  const likedSongs = useAppSelector((s) => s.library.likedSongs);

  const isLiked = currentSong ? likedSongs.some((s) => s.id === currentSong.id) : false;
  const maxDuration = duration || currentSong?.duration || 0;

  return (
    <header className="hidden md:flex sticky top-0 z-30 h-16 items-center justify-between gap-4 border-b border-black/[0.07] dark:border-white/[0.08] bg-white/80 dark:bg-[#1c1c1e]/80 px-5 backdrop-blur-2xl select-none">
      {/* Left: Transport Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => dispatch(PlayerActions.toggleShuffle())}
          aria-label="Shuffle"
          className={`p-1.5 rounded-lg transition-colors ${
            shuffle
              ? "text-[#fa243c] bg-[#fa243c]/10"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <ShuffleIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => dispatch(playPrevious())}
          disabled={!currentSong}
          aria-label="Previous"
          className="p-1.5 text-zinc-800 dark:text-zinc-200 hover:text-[#fa243c] disabled:opacity-40"
        >
          <PrevIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => dispatch(PlayerActions.togglePlay())}
          disabled={!currentSong}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
        >
          {isLoading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : isPlaying ? (
            <PauseIcon className="h-4 w-4" />
          ) : (
            <PlayIcon className="h-4 w-4 ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => dispatch(playNext())}
          disabled={!currentSong}
          aria-label="Next"
          className="p-1.5 text-zinc-800 dark:text-zinc-200 hover:text-[#fa243c] disabled:opacity-40"
        >
          <NextIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => dispatch(PlayerActions.cycleRepeat())}
          aria-label="Repeat"
          className={`relative p-1.5 rounded-lg transition-colors ${
            repeat !== "off"
              ? "text-[#fa243c] bg-[#fa243c]/10"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <RepeatIcon className="h-4 w-4" />
          {repeat === "one" && (
            <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold">1</span>
          )}
        </button>
      </div>

      {/* Center: Iconic Apple Music LCD Pill */}
      <div className="flex flex-1 max-w-xl items-center gap-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-zinc-100/90 dark:bg-black/40 px-3 py-1.5">
        {currentSong ? (
          <>
            <button
              type="button"
              onClick={() => dispatch(PlayerActions.setNowPlayingOpen(true))}
              className="relative shrink-0 group"
              title="Open Now Playing"
            >
              <img
                src={getBestImage(currentSong.image, "150x150")}
                alt={decodeText(currentSong.name)}
                className="h-10 w-10 rounded-lg object-cover shadow"
              />
            </button>

            <div className="min-w-0 flex-1 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex items-center gap-1.5">
                  <Link
                    to={`/song/${currentSong.id}`}
                    className="truncate text-xs font-semibold text-zinc-900 dark:text-white hover:underline"
                  >
                    {decodeText(currentSong.name)}
                  </Link>
                  <span className="text-xs text-zinc-400">—</span>
                  <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {getArtistLabel(currentSong)}
                  </span>
                </div>
                <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-300">
                  {quality.replace("kbps", " kbps")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] tabular-nums text-zinc-400 w-8">
                  {formatDuration(currentTime)}
                </span>
                <Root
                  min={0}
                  max={maxDuration || 100}
                  step={0.5}
                  value={[Math.min(currentTime, maxDuration || 100)]}
                  onValueChange={([v]) => seekAudio(v)}
                  className="relative flex h-3 flex-1 touch-none items-center cursor-pointer group"
                >
                  <Track className="relative h-1 w-full grow rounded-full bg-zinc-300 dark:bg-white/15">
                    <Range className="absolute h-full rounded-full bg-[#fa243c]" />
                  </Track>
                  <Thumb className="block h-2.5 w-2.5 rounded-full bg-[#fa243c] opacity-0 group-hover:opacity-100 transition-opacity shadow" />
                </Root>
                <span className="text-[10px] tabular-nums text-zinc-400 w-8 text-right">
                  {formatDuration(maxDuration)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dispatch(LibraryActions.toggleLikeSong(currentSong))}
              aria-label="Like current track"
              className={`p-1 rounded-full ${
                isLiked ? "text-[#fa243c]" : "text-zinc-400 hover:text-[#fa243c]"
              }`}
            >
              <HeartIcon filled={isLiked} className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex w-full items-center justify-center gap-2 py-2 text-zinc-400">
            <AppleMusicLogo className="h-4 w-4 text-[#fa243c]" />
            <span className="text-xs font-medium">Apple Music · Powered by JioSaavn</span>
          </div>
        )}
      </div>

      {/* Right: Volume + Lyrics + Queue + Expand */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-2 w-28">
          <button
            type="button"
            onClick={() => dispatch(PlayerActions.toggleMute())}
            aria-label="Mute"
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
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
            <Track className="relative h-1 w-full grow rounded-full bg-zinc-300 dark:bg-white/20">
              <Range className="absolute h-full rounded-full bg-zinc-700 dark:bg-white" />
            </Track>
            <Thumb className="block h-3 w-3 rounded-full bg-white shadow border border-black/15" />
          </Root>
        </div>

        <button
          type="button"
          onClick={() => dispatch(PlayerActions.setRightPanel("lyrics"))}
          aria-label="Lyrics"
          className={`p-1.5 rounded-lg transition-colors ${
            rightPanel === "lyrics"
              ? "bg-[#fa243c]/15 text-[#fa243c]"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <LyricsIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => dispatch(PlayerActions.setRightPanel("queue"))}
          aria-label="Playing Next Queue"
          className={`p-1.5 rounded-lg transition-colors ${
            rightPanel === "queue"
              ? "bg-[#fa243c]/15 text-[#fa243c]"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <QueueIcon className="h-4 w-4" />
        </button>

        {currentSong && (
          <>
            <button
              type="button"
              onClick={() => dispatch(DownloadActions.openSongDownload(currentSong))}
              aria-label="Download current song"
              title="Download with cover & tags"
              className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-[#fa243c]"
            >
              <DownloadIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => dispatch(PlayerActions.setNowPlayingOpen(true))}
              aria-label="Full screen player"
              className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              <ExpandIcon className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default DesktopPlayerBar;
