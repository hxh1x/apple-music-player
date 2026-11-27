import { decodeText, getArtistLabel, getBestImage } from "../../lib/jiosaavn";
import { PlayerActions, playSong } from "../../store/playerSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { InfinityIcon, LyricsIcon, QueueIcon, TrashIcon } from "../icons/AppleIcons";
import LyricsView from "./LyricsView";

const RightDrawer = () => {
  const dispatch = useAppDispatch();
  const { rightPanel, currentSong, queue, autoplay, currentTime } = useAppSelector(
    (s) => s.player
  );

  if (rightPanel === "none") return null;

  return (
    <aside className="hidden md:flex w-80 shrink-0 flex-col border-l border-black/[0.07] dark:border-white/[0.08] bg-zinc-50/90 dark:bg-[#161618]/95 backdrop-blur-2xl h-[calc(100vh-4rem)] sticky top-16">
      <div className="flex items-center justify-between border-b border-black/[0.07] dark:border-white/[0.08] px-4 py-3">
        <div className="flex gap-1 rounded-xl bg-black/5 dark:bg-white/[0.07] p-1">
          <button
            type="button"
            onClick={() => {
              if (rightPanel !== "queue") dispatch(PlayerActions.setRightPanel("queue"));
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
              rightPanel === "queue"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <QueueIcon className="h-3.5 w-3.5" />
            Playing Next
          </button>
          <button
            type="button"
            onClick={() => {
              if (rightPanel !== "lyrics") dispatch(PlayerActions.setRightPanel("lyrics"));
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
              rightPanel === "lyrics"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <LyricsIcon className="h-3.5 w-3.5" />
            Lyrics
          </button>
        </div>

        <button
          type="button"
          onClick={() => dispatch(PlayerActions.closeRightPanel())}
          className="text-xs font-medium text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
        >
          Done
        </button>
      </div>

      {rightPanel === "queue" ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentSong && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Now Playing
              </p>
              <div className="flex items-center gap-3 rounded-xl bg-[#fa243c]/10 p-2.5">
                <img
                  src={getBestImage(currentSong.image, "150x150")}
                  alt={decodeText(currentSong.name)}
                  className="h-11 w-11 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#fa243c]">
                    {decodeText(currentSong.name)}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                    {getArtistLabel(currentSong)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Up Next ({queue.length})
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => dispatch(PlayerActions.toggleAutoplay())}
                title="Autoplay similar songs"
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  autoplay
                    ? "bg-[#fa243c]/15 text-[#fa243c]"
                    : "bg-black/5 dark:bg-white/10 text-zinc-400"
                }`}
              >
                <InfinityIcon className="h-3 w-3" />
                Autoplay
              </button>
              {queue.length > 0 && (
                <button
                  type="button"
                  onClick={() => dispatch(PlayerActions.clearQueue())}
                  className="text-[11px] text-[#fa243c] hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {queue.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">
              Queue is empty. {autoplay ? "Autoplay will queue similar tracks." : ""}
            </p>
          ) : (
            <div className="space-y-1">
              {queue.map((song, idx) => (
                <div
                  key={`${song.id}-${idx}`}
                  onClick={() =>
                    dispatch(playSong({ song, queue: queue.slice(idx + 1) }))
                  }
                  className="group flex items-center gap-2.5 rounded-xl p-2 hover:bg-black/5 dark:hover:bg-white/[0.06] cursor-pointer"
                >
                  <img
                    src={getBestImage(song.image, "150x150")}
                    alt={decodeText(song.name)}
                    className="h-10 w-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                      {decodeText(song.name)}
                    </p>
                    <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                      {getArtistLabel(song)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(PlayerActions.removeFromQueue(idx));
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-[#fa243c]"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {!currentSong ? (
            <p className="text-xs text-zinc-400 text-center py-10">
              Play a track to view its lyrics.
            </p>
          ) : (
            <LyricsView
              song={currentSong}
              currentTime={currentTime}
              variant="drawer"
            />
          )}
        </div>
      )}
    </aside>
  );
};

export default RightDrawer;
