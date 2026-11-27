import { useEffect, useMemo, useRef, useState } from "react";
import { decodeText, getArtistLabel, jiosaavnApi } from "../../lib/jiosaavn";
import type { LyricsData, Song } from "../../types/jiosaavn";
import { seekAudio } from "../audio/AudioEngine";

interface LyricsViewProps {
  song: Song;
  currentTime: number;
  variant?: "fullscreen" | "drawer";
}

const LyricsView = ({ song, currentTime, variant = "fullscreen" }: LyricsViewProps) => {
  const [data, setData] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const activeLineRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let active = true;
    setData(null);
    setLoading(true);
    jiosaavnApi
      .getSongLyrics(song.id, {
        title: decodeText(song.name),
        artist: getArtistLabel(song),
        album: decodeText(song.album?.name),
        duration: song.duration,
      })
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [song.id]);

  const syncedLines = data?.synced || null;

  const activeIndex = useMemo(() => {
    if (!syncedLines?.length) return -1;
    let idx = -1;
    for (let i = 0; i < syncedLines.length; i++) {
      if (currentTime + 0.25 >= syncedLines[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [syncedLines, currentTime]);

  useEffect(() => {
    if (activeIndex >= 0 && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#fa243c] border-t-transparent" />
        <p className="text-xs opacity-60">Loading lyrics...</p>
      </div>
    );
  }

  if (!data || (!syncedLines?.length && !data.lyrics)) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4 space-y-2">
        <p className="text-base font-bold opacity-85">Lyrics Not Available</p>
        <p className="text-xs opacity-55 max-w-xs">
          No synced or plain lyrics were found for this track yet.
        </p>
      </div>
    );
  }

  if (syncedLines && syncedLines.length > 0) {
    return (
      <div className="space-y-3 py-8 px-1">
        {syncedLines.map((line, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          return (
            <button
              key={`${line.time}-${i}`}
              ref={isActive ? activeLineRef : undefined}
              type="button"
              onClick={() => seekAudio(line.time)}
              className={`block w-full text-left rounded-xl px-3 py-1.5 transition-all duration-300 ${
                variant === "fullscreen"
                  ? "text-2xl sm:text-3xl font-bold leading-snug"
                  : "text-base font-bold leading-snug"
              } ${
                isActive
                  ? variant === "fullscreen"
                    ? "text-white scale-[1.01] opacity-100"
                    : "text-[#fa243c] opacity-100"
                  : isPast
                  ? "opacity-35 hover:opacity-75"
                  : "opacity-55 hover:opacity-85"
              }`}
            >
              {line.text}
            </button>
          );
        })}
        <p className="pt-4 px-3 text-[11px] opacity-40">
          Tap any line to jump to that moment
        </p>
      </div>
    );
  }

  // Plain HTML lyrics fallback
  return (
    <div
      className={`py-4 px-2 space-y-3 font-semibold leading-relaxed ${
        variant === "fullscreen"
          ? "text-xl sm:text-2xl text-white/90"
          : "text-sm text-zinc-800 dark:text-zinc-100"
      }`}
      dangerouslySetInnerHTML={{ __html: data.lyrics }}
    />
  );
};

export default LyricsView;
