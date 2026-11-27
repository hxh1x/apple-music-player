import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { decodeText, getArtistLabel, getBestImage } from "../../lib/jiosaavn";
import { playCollection, playSong } from "../../store/playerSlice";
import { useAppDispatch } from "../../store/store";
import type { ImageLink } from "../../types/jiosaavn";
import { PlayIcon } from "../icons/AppleIcons";

export interface MediaCardProps {
  id: string;
  title: string;
  subtitle?: string;
  type: "song" | "album" | "playlist" | "artist" | string;
  image?: ImageLink[] | string | null;
  explicit?: boolean;
  artists?: { primary?: Array<{ id: string; name: string; image: ImageLink[] }> };
  size?: "sm" | "md" | "lg" | "full";
}

const MediaCard = ({
  id,
  title,
  subtitle,
  type,
  image,
  explicit,
  artists,
  size = "md",
}: MediaCardProps) => {
  const dispatch = useAppDispatch();
  const normalizedType =
    type === "album" || type === "playlist" || type === "artist" || type === "song"
      ? type
      : "playlist";
  const isArtist = normalizedType === "artist";
  const imgUrl = getBestImage(image, "500x500");
  const displayTitle = decodeText(title);
  const displaySubtitle =
    decodeText(subtitle) || (artists ? getArtistLabel({ artists }) : normalizedType);

  const widthClass =
    size === "full"
      ? "w-full"
      : size === "lg"
      ? "w-44 sm:w-52 md:w-56"
      : size === "sm"
      ? "w-32 sm:w-36"
      : "w-36 sm:w-44 md:w-[184px]";

  const handleQuickPlay = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (normalizedType === "song") {
      dispatch(playSong({ song: { id } }));
    } else if (
      normalizedType === "album" ||
      normalizedType === "playlist" ||
      normalizedType === "artist"
    ) {
      dispatch(playCollection({ type: normalizedType, id }));
    }
  };

  return (
    <Link
      to={`/${normalizedType}/${id}`}
      className={`${widthClass} shrink-0 snap-start group flex flex-col gap-2 select-none`}
    >
      <div
        className={`relative aspect-square w-full overflow-hidden bg-zinc-200 dark:bg-zinc-900 shadow-md transition-transform duration-300 group-hover:scale-[1.02] ${
          isArtist ? "rounded-full" : "rounded-xl"
        }`}
      >
        <img
          src={imgUrl}
          alt={displayTitle}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className={`absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors ${
            isArtist ? "rounded-full" : "rounded-xl"
          }`}
        />
        <button
          type="button"
          onClick={handleQuickPlay}
          aria-label={`Play ${displayTitle}`}
          className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black shadow-lg backdrop-blur-md opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-[#fa243c] hover:text-white active:scale-95"
        >
          <PlayIcon className="h-4 w-4 ml-0.5" />
        </button>
      </div>

      <div className={`px-0.5 ${isArtist ? "text-center" : ""}`}>
        <div className="flex items-center gap-1">
          <p className="truncate text-[13px] sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-[#fa243c] transition-colors">
            {displayTitle}
          </p>
          {explicit && (
            <span className="shrink-0 rounded-[3px] bg-zinc-500/30 px-1 text-[9px] font-bold uppercase text-zinc-600 dark:text-zinc-300">
              E
            </span>
          )}
        </div>
        {displaySubtitle && (
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {displaySubtitle}
          </p>
        )}
      </div>
    </Link>
  );
};

export default MediaCard;
