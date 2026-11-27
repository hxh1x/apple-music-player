import { AnimatePresence, motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import {
  AuthActions,
  loginAccount,
  pullLibraryFromCloud,
  registerAccount,
  syncLibraryToCloud,
} from "../../store/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { CloseIcon, CloudSyncIcon, UserIcon } from "../icons/AppleIcons";

const AccountModal = () => {
  const dispatch = useAppDispatch();
  const { user, isModalOpen, isLoading, syncStatus, lastSyncedAt, error } =
    useAppSelector((s) => s.auth);
  const library = useAppSelector((s) => s.library);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!isModalOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "register") {
      dispatch(registerAccount({ username, email, password }));
    } else {
      dispatch(loginAccount({ identifier: email || username, password }));
    }
  };

  return (
    <AnimatePresence>
      <div
        onClick={() => dispatch(AuthActions.closeModal())}
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      >
        <motion.div
          initial={{ y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 32, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#1c1c1e] text-zinc-900 dark:text-white shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-black/[0.07] dark:border-white/[0.08] px-5 py-4">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-[#fa243c]" />
              <h2 className="text-base font-bold">
                {user ? "Your Account" : "Sign In for Cross-Device Sync"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => dispatch(AuthActions.closeModal())}
              aria-label="Close account modal"
              className="rounded-full p-1.5 text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {user ? (
              <>
                <div className="flex items-center gap-4 rounded-2xl bg-zinc-100 dark:bg-black/40 p-4 border border-black/5 dark:border-white/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#fa243c] to-[#ff375f] text-white font-bold text-lg uppercase shrink-0">
                    {user.username.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-base">{user.username}</p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {user.email}
                    </p>
                    <p className="text-[11px] mt-1 text-emerald-500 font-medium">
                      {syncStatus === "syncing"
                        ? "Syncing across devices..."
                        : syncStatus === "error"
                        ? "Sync failed — tap Push to retry"
                        : lastSyncedAt
                        ? `Synced · ${new Date(lastSyncedAt).toLocaleTimeString()}`
                        : "Connected"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center rounded-2xl border border-black/10 dark:border-white/10 p-3 text-xs">
                  <div>
                    <p className="font-bold text-base">{library.likedSongs.length}</p>
                    <p className="text-zinc-400">Liked</p>
                  </div>
                  <div>
                    <p className="font-bold text-base">{library.userPlaylists.length}</p>
                    <p className="text-zinc-400">Playlists</p>
                  </div>
                  <div>
                    <p className="font-bold text-base">{library.recentlyPlayed.length}</p>
                    <p className="text-zinc-400">History</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => dispatch(syncLibraryToCloud())}
                    disabled={syncStatus === "syncing"}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#fa243c] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#e01e35] disabled:opacity-50"
                  >
                    <CloudSyncIcon className="h-4 w-4" />
                    Push Sync
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch(pullLibraryFromCloud())}
                    disabled={syncStatus === "syncing"}
                    className="flex-1 rounded-xl border border-black/10 dark:border-white/15 px-4 py-2.5 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
                  >
                    Pull From Cloud
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => dispatch(AuthActions.logout())}
                  className="w-full rounded-xl border border-red-500/30 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-500/10"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <div className="flex rounded-xl bg-zinc-100 dark:bg-black/40 p-1">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                      mode === "login"
                        ? "bg-white dark:bg-zinc-800 shadow text-zinc-900 dark:text-white"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                      mode === "register"
                        ? "bg-white dark:bg-zinc-800 shadow text-zinc-900 dark:text-white"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Sync your Liked Songs, Playlists, Listening History, and Library
                  automatically between your phone and desktop.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {mode === "register" && (
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-zinc-100 dark:bg-black/40 px-3.5 py-2.5 text-sm focus:border-[#fa243c] focus:outline-none"
                    />
                  )}
                  <input
                    type={mode === "register" ? "email" : "text"}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={mode === "register" ? "Email address" : "Email or username"}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-zinc-100 dark:bg-black/40 px-3.5 py-2.5 text-sm focus:border-[#fa243c] focus:outline-none"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 6 characters)"
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-zinc-100 dark:bg-black/40 px-3.5 py-2.5 text-sm focus:border-[#fa243c] focus:outline-none"
                  />

                  {error && (
                    <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-[#fa243c] py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#e01e35] disabled:opacity-50"
                  >
                    {isLoading
                      ? "Please wait..."
                      : mode === "register"
                      ? "Create Account & Sync"
                      : "Sign In"}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AccountModal;
