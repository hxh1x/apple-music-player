import { decodeText, getArtistLabel, getBestImage } from "../../lib/jiosaavn";
import { PlayerActions, playNext } from "../../store/playerSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { NextIcon, PauseIcon, PlayIcon } from "../icons/AppleIcons";

const MobileMiniPlayer = () => {
  const dispatch = useAppDispatch();
  const { currentSong, isPlaying, isLoading, currentTime, duration } = useAppSelector(
    (s) => s.player
  );

  if (!currentSong) return null;

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      onClick={() => dispatch(PlayerActions.setNowPlayingOpen(true))}
      className="md:hidden fixed bottom-[64px] inset-x-2.5 z-40 overflow-hidden rounded-2xl border border-black/10 dark:border-white/15 bg-white/90 dark:bg-zinc-900/90 shadow-2xl backdrop-blur-2xl cursor-pointer active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center gap-3 px-3 py-2">
        <img
          src={getBestImage(currentSong.image, "150x150")}
          alt={decodeText(currentSong.name)}
          className="h-11 w-11 rounded-xl object-cover shadow"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
            {decodeText(currentSong.name)}
          </p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {getArtistLabel(currentSong)}
          </p>
        </div>

        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => dispatch(PlayerActions.togglePlay())}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#fa243c] border-t-transparent" />
            ) : isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5 ml-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => dispatch(playNext())}
            aria-label="Next track"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
          >
            <NextIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Subtle hairline progress bar */}
      <div className="h-[2px] w-full bg-zinc-200 dark:bg-white/10">
        <div
          className="h-full bg-[#fa243c] transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default MobileMiniPlayer;
