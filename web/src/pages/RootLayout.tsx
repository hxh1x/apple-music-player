import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AccountModal from "../components/auth/AccountModal";
import AudioEngine from "../components/audio/AudioEngine";
import DownloadModal from "../components/download/DownloadModal";
import {
  AppleMusicLogo,
  MoonIcon,
  SunIcon,
  UserIcon,
} from "../components/icons/AppleIcons";
import DesktopSidebar from "../components/layout/DesktopSidebar";
import MobileNav from "../components/layout/MobileNav";
import DesktopPlayerBar from "../components/player/DesktopPlayerBar";
import MobileMiniPlayer from "../components/player/MobileMiniPlayer";
import NowPlayingModal from "../components/player/NowPlayingModal";
import RightDrawer from "../components/player/RightDrawer";
import {
  AuthActions,
  restoreSession,
  syncLibraryToCloud,
} from "../store/authSlice";
import { LibraryActions } from "../store/librarySlice";
import { useAppDispatch, useAppSelector } from "../store/store";

const RootLayout = () => {
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const library = useAppSelector((s) => s.library);
  const { theme } = library;
  const currentSong = useAppSelector((s) => s.player.currentSong);
  const { user, token } = useAppSelector((s) => s.auth);

  const restoredRef = useRef(false);
  const lastSnapshotRef = useRef<string>("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Restore user session & pull cloud library on startup
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if (token) {
      dispatch(restoreSession()).then(() => {
        lastSnapshotRef.current = JSON.stringify(library);
      });
    }
  }, [dispatch, token]);

  // Auto-sync library changes to cloud when signed in (debounced 900ms)
  useEffect(() => {
    if (!user || !token) return;
    const serialized = JSON.stringify(library);
    if (!lastSnapshotRef.current) {
      lastSnapshotRef.current = serialized;
      return;
    }
    if (serialized === lastSnapshotRef.current) return;

    const timer = setTimeout(() => {
      lastSnapshotRef.current = serialized;
      dispatch(syncLibraryToCloud());
    }, 900);

    return () => clearTimeout(timer);
  }, [library, user, token, dispatch]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex">
      <AudioEngine />
      <DesktopSidebar />

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <DesktopPlayerBar />

        {/* Mobile Top Bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-white/85 dark:bg-black/85 px-4 py-3 backdrop-blur-2xl">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#fa243c] to-[#ff375f] text-white">
              <AppleMusicLogo className="h-4 w-4" />
            </span>
            <span className="text-base font-bold tracking-tight">Music</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch(LibraryActions.toggleTheme())}
              aria-label="Toggle theme"
              className="rounded-full p-1.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
            >
              {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => dispatch(AuthActions.openModal())}
              aria-label="Account and sync"
              className="flex h-7 items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-900 px-2.5 text-[11px] font-semibold text-zinc-800 dark:text-zinc-100 border border-black/10 dark:border-white/10"
            >
              <UserIcon className="h-3.5 w-3.5 text-[#fa243c]" />
              {user ? <span className="max-w-[64px] truncate">{user.username}</span> : <span>Sign In</span>}
            </button>
          </div>
        </header>

        <div className="flex flex-1 min-w-0">
          <main
            className={`flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full ${
              currentSong ? "pb-36 md:pb-12" : "pb-24 md:pb-12"
            }`}
          >
            <Outlet />
          </main>
          <RightDrawer />
        </div>
      </div>

      <MobileMiniPlayer />
      <MobileNav />
      <NowPlayingModal />
      <DownloadModal />
      <AccountModal />
    </div>
  );
};

export default RootLayout;
