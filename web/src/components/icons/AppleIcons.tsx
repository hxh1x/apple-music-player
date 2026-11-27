import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { filled?: boolean };

export const AppleMusicLogo = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19.665 3.124c-.258-.23-.614-.303-.94-.195l-9.5 2.75A1 1 0 0 0 8.5 6.64v8.817A3.24 3.24 0 0 0 6.75 15C4.955 15 3.5 16.343 3.5 18s1.455 3 3.25 3S10 19.657 10 18V9.776l8.5-2.46v6.141a3.24 3.24 0 0 0-1.75-.457c-1.795 0-3.25 1.343-3.25 3s1.455 3 3.25 3 3.25-1.343 3.25-3V4a1 1 0 0 0-.335-.876Z" />
  </svg>
);

export const HomeIcon = ({ filled, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-9.5Z" />
  </svg>
);

export const BrowseIcon = ({ filled, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2" fill={filled ? "currentColor" : "none"} />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" fill={filled ? "currentColor" : "none"} />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" fill={filled ? "currentColor" : "none"} />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" fill={filled ? "currentColor" : "none"} />
  </svg>
);

export const ChartsIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 19h16M7 16v-5M12 16V6M17 16v-8" />
  </svg>
);

export const SearchIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const LibraryIcon = ({ filled, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 6h16M6 3h12" />
    <rect x="3" y="9" width="18" height="12" rx="2.5" fill={filled ? "currentColor" : "none"} />
  </svg>
);

export const PlayIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M7.5 5.25a1 1 0 0 1 1.52-.853l10.5 6.75a1 1 0 0 1 0 1.706l-10.5 6.75A1 1 0 0 1 7.5 18.75V5.25Z" />
  </svg>
);

export const PauseIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <rect x="6" y="4.5" width="4.2" height="15" rx="1.4" />
    <rect x="13.8" y="4.5" width="4.2" height="15" rx="1.4" />
  </svg>
);

export const NextIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M5.2 6.2a.9.9 0 0 1 1.38-.76l8.2 5.45V6.2a.9.9 0 0 1 1.8 0v11.6a.9.9 0 0 1-1.8 0v-4.69l-8.2 5.45a.9.9 0 0 1-1.38-.76V6.2Z" />
  </svg>
);

export const PrevIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.8 6.2a.9.9 0 0 0-1.38-.76l-8.2 5.45V6.2a.9.9 0 0 0-1.8 0v11.6a.9.9 0 0 0 1.8 0v-4.69l8.2 5.45a.9.9 0 0 0 1.38-.76V6.2Z" />
  </svg>
);

export const ShuffleIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </svg>
);

export const RepeatIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m17 2 4 4-4 4" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <path d="m7 22-4-4 4-4" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </svg>
);

export const VolumeIcon = ({ level, muted, ...props }: IconProps & { level: number; muted: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
    {muted || level === 0 ? (
      <path d="m22 9-6 6M16 9l6 6" />
    ) : level < 0.5 ? (
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    ) : (
      <>
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9.5 9.5 0 0 1 0 13" />
      </>
    )}
  </svg>
);

export const HeartIcon = ({ filled, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 20.5s-7.5-4.6-9.5-9.2C1 7.8 3.2 4.5 6.7 4.5c2 0 3.7 1.1 5.3 2.9 1.6-1.8 3.3-2.9 5.3-2.9 3.5 0 5.7 3.3 4.2 6.8-2 4.6-9.5 9.2-9.5 9.2Z" />
  </svg>
);

export const QueueIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 6h16M4 12h10M4 18h10M18 12v6M15 15h6" />
  </svg>
);

export const LyricsIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 3V7a2 2 0 0 1 2-2Z" />
    <path d="M8.5 10h7M8.5 14h4.5" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const MoreIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="5" cy="12" r="1.75" />
    <circle cx="12" cy="12" r="1.75" />
    <circle cx="19" cy="12" r="1.75" />
  </svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
);

export const SunIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

export const MoonIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

export const ExpandIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

export const InfinityIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8Z" />
  </svg>
);

export const DownloadIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);

export const CloseIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export const UserIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0" />
  </svg>
);

export const CloudSyncIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 18a4.6 4.4 0 0 1 0-9 5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1" />
    <path d="m9 15 3-3 3 3M12 12v9" />
  </svg>
);
