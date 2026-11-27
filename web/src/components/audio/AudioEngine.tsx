import { useEffect, useRef } from "react";
import { decodeText, getArtistLabel, getBestImage, getStreamUrl } from "../../lib/jiosaavn";
import { PlayerActions, playNext, playPrevious } from "../../store/playerSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";

let audioElementRef: HTMLAudioElement | null = null;

export function seekAudio(seconds: number) {
  if (!audioElementRef || !Number.isFinite(seconds)) return;
  audioElementRef.currentTime = Math.max(0, seconds);
}

const AudioEngine = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const dispatch = useAppDispatch();
  const { currentSong, isPlaying, volume, isMuted, repeat, quality } = useAppSelector(
    (state) => state.player
  );

  const streamUrl = getStreamUrl(currentSong?.downloadUrl, quality);

  useEffect(() => {
    audioElementRef = audioRef.current;
    return () => {
      audioElementRef = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl) return;
    if (isPlaying) {
      const p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          dispatch(PlayerActions.setPlaying(false));
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, streamUrl, dispatch]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Update OS / Lock-Screen MediaSession controls
  useEffect(() => {
    if (!currentSong || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: decodeText(currentSong.name),
      artist: getArtistLabel(currentSong),
      album: decodeText(currentSong.album?.name) || "JioSaavn",
      artwork: [
        { src: getBestImage(currentSong.image, "150x150"), sizes: "150x150", type: "image/jpeg" },
        { src: getBestImage(currentSong.image, "500x500"), sizes: "500x500", type: "image/jpeg" },
      ],
    });
    navigator.mediaSession.setActionHandler("play", () => dispatch(PlayerActions.setPlaying(true)));
    navigator.mediaSession.setActionHandler("pause", () => dispatch(PlayerActions.setPlaying(false)));
    navigator.mediaSession.setActionHandler("nexttrack", () => dispatch(playNext()));
    navigator.mediaSession.setActionHandler("previoustrack", () => dispatch(playPrevious()));
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined) seekAudio(details.seekTime);
    });
  }, [currentSong, dispatch]);

  // Global keyboard shortcuts (Space = Play/Pause)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.code === "Space" && currentSong) {
        e.preventDefault();
        dispatch(PlayerActions.togglePlay());
      } else if (e.code === "ArrowRight" && e.shiftKey && audioRef.current) {
        seekAudio(audioRef.current.currentTime + 10);
      } else if (e.code === "ArrowLeft" && e.shiftKey && audioRef.current) {
        seekAudio(audioRef.current.currentTime - 10);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentSong, dispatch]);

  if (!streamUrl) return <audio ref={audioRef} />;

  return (
    <audio
      ref={audioRef}
      src={streamUrl}
      preload="auto"
      onTimeUpdate={(e) => {
        const el = e.currentTarget;
        dispatch(
          PlayerActions.setTime({
            currentTime: el.currentTime,
            duration: Number.isFinite(el.duration) ? el.duration : currentSong?.duration || 0,
          })
        );
      }}
      onLoadedMetadata={(e) => {
        const el = e.currentTarget;
        dispatch(
          PlayerActions.setTime({
            currentTime: el.currentTime,
            duration: Number.isFinite(el.duration) ? el.duration : currentSong?.duration || 0,
          })
        );
        if (isPlaying) {
          el.play().catch(() => {});
        }
      }}
      onEnded={() => {
        if (repeat === "one" && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        } else {
          dispatch(playNext());
        }
      }}
    />
  );
};

export default AudioEngine;
