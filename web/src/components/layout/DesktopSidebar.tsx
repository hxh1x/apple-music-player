import { useState, type FormEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthActions } from "../../store/authSlice";
import { LibraryActions } from "../../store/librarySlice";
import { PlayerActions } from "../../store/playerSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import type { AudioQuality } from "../../types/jiosaavn";
import {
  AppleMusicLogo,
  HomeIcon,
  LibraryIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
  UserIcon,
} from "../icons/AppleIcons";

const DesktopSidebar = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { userPlaylists, theme, likedSongs } = useAppSelector((s) => s.library);
  const { quality } = useAppSelector((s) => s.player);
  const { user, syncStatus } = useAppSelector((s) => s.auth);

  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newPlName, setNewPlName] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleCreatePlaylist = (e: FormEvent) => {
    e.preventDefault();
    if (!newPlName.trim()) return;
    dispatch(LibraryActions.createPlaylist({ name: newPlName }));
    setNewPlName("");
    setCreating(false);
    navigate("/library?tab=playlists");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-colors ${
      isActive
        ? "bg-black/[0.08] dark:bg-white/[0.12] text-[#fa243c]"
        : "text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
    }`;

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-black/[0.07] dark:border-white/[0.08] bg-zinc-100/80 dark:bg-[#161618]/90 backdrop-blur-2xl h-screen sticky top-0 select-none">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <NavLink to="/" className="flex items-center gap-2 text-zinc-900 dark:text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#fa243c] to-[#ff375f] text-white shadow-sm">
            <AppleMusicLogo className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold tracking-tight">Music</span>
        </NavLink>
        <button
          type="button"
          onClick={() => dispatch(LibraryActions.toggleTheme())}
          aria-label="Toggle theme"
          className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
        >
          {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
        </button>
      </div>

      {/* Quick Search */}
      <form onSubmit={handleSearch} className="px-3 pb-3">
        <div className="relative flex items-center">
          <SearchIcon className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.07] py-1.5 pl-8 pr-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-[#fa243c] focus:outline-none"
          />
        </div>
      </form>

      {/* Main Nav */}
      <div className="flex-1 overflow-y-auto px-3 space-y-5">
        <div className="space-y-0.5">
          <NavLink to="/" end className={navLinkClass}>
            {({ isActive }) => (
              <>
                <HomeIcon filled={isActive} className="h-4 w-4" />
                Listen Now
              </>
            )}
          </NavLink>
          <NavLink to="/search" className={navLinkClass}>
            <SearchIcon className="h-4 w-4" />
            Search
          </NavLink>
        </div>

        {/* Library */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Library
          </p>
          <NavLink to="/library" end className={navLinkClass}>
            {({ isActive }) => (
              <>
                <LibraryIcon filled={isActive} className="h-4 w-4" />
                <span className="flex-1">Your Library</span>
                {likedSongs.length > 0 && (
                  <span className="text-[11px] text-zinc-400">{likedSongs.length}</span>
                )}
              </>
            )}
          </NavLink>
        </div>

        {/* Custom Playlists */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Playlists
            </p>
            <button
              type="button"
              onClick={() => setCreating((v) => !v)}
              aria-label="New playlist"
              className="rounded-md p-0.5 text-zinc-400 hover:text-[#fa243c]"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {creating && (
            <form onSubmit={handleCreatePlaylist} className="px-2 py-1">
              <input
                autoFocus
                type="text"
                value={newPlName}
                onChange={(e) => setNewPlName(e.target.value)}
                placeholder="Playlist name..."
                className="w-full rounded-lg border border-[#fa243c]/50 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-900 dark:text-white focus:outline-none"
              />
            </form>
          )}

          {userPlaylists.length === 0 ? (
            <p className="px-3 py-1 text-xs text-zinc-400">No playlists yet</p>
          ) : (
            userPlaylists.map((pl) => (
              <NavLink
                key={pl.id}
                to={`/library?playlist=${pl.id}`}
                className="flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              >
                <span className="truncate">{pl.name}</span>
                <span className="text-[10px] text-zinc-400">{pl.songs.length}</span>
              </NavLink>
            ))
          )}
        </div>
      </div>

      {/* Footer Settings: Account + Language + Audio Quality */}
      <div className="border-t border-black/[0.07] dark:border-white/[0.08] p-3 space-y-2.5 text-xs">
        <button
          type="button"
          onClick={() => dispatch(AuthActions.openModal())}
          className="flex w-full items-center gap-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.07] px-2.5 py-2 text-left hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition-colors"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fa243c] to-[#ff375f] text-white text-[11px] font-bold uppercase">
            {user ? user.username.slice(0, 2) : <UserIcon className="h-3.5 w-3.5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-zinc-900 dark:text-white">
              {user ? user.username : "Sign In"}
            </p>
            <p className="truncate text-[10px] text-zinc-400">
              {user
                ? syncStatus === "syncing"
                  ? "Syncing..."
                  : "Synced across devices"
                : "Sync across devices"}
            </p>
          </div>
        </button>

        <div className="flex items-center justify-between gap-2">
          <span className="text-zinc-400">Audio</span>
          <div className="flex rounded-md border border-black/10 dark:border-white/10 overflow-hidden">
            {(["320kbps", "160kbps", "96kbps"] as AudioQuality[]).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => dispatch(PlayerActions.setQuality(q))}
                className={`px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                  quality === q
                    ? "bg-[#fa243c] text-white"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {q.replace("kbps", "")}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
