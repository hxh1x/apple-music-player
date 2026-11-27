import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  decodeText,
  downloadCollectionZip,
  downloadTaggedSong,
  formatDuration,
  getArtistLabel,
  getBestImage,
  jiosaavnApi,
  sanitizeFilename,
  triggerBlobDownload,
} from "../../lib/jiosaavn";
import { DownloadActions } from "../../store/downloadSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import type { AudioQuality, Song } from "../../types/jiosaavn";
import { CheckIcon, CloseIcon, DownloadIcon } from "../icons/AppleIcons";

const QUALITY_OPTIONS: Array<{
  value: AudioQuality;
  label: string;
  desc: string;
  badge: string;
}> = [
  { value: "320kbps", label: "320 kbps MP3", desc: "Highest quality · Studio clarity", badge: "Best" },
  { value: "160kbps", label: "192 kbps MP3", desc: "Balanced quality & file size", badge: "Standard" },
  { value: "96kbps", label: "128 kbps MP3", desc: "Fast download · Data saver", badge: "Compact" },
];

const DownloadModal = () => {
  const dispatch = useAppDispatch();
  const target = useAppSelector((s) => s.download.target);
  const defaultQuality = useAppSelector((s) => s.player.quality);

  const [quality, setQuality] = useState<AudioQuality>(defaultQuality);
  const [fullSong, setFullSong] = useState<Song | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [progressText, setProgressText] = useState<string>("");
  const [progressPct, setProgressPct] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  useEffect(() => {
    setQuality(defaultQuality);
    setBusy(false);
    setProgressText("");
    setProgressPct(0);
    setError(null);
    setDoneMessage(null);

    if (!target) {
      setFullSong(null);
      return;
    }

    if (target.kind === "song") {
      setFullSong(target.song);
      // Enrich missing fields (copyright/label/album) if needed
      if (!target.song.label && !target.song.copyright) {
        jiosaavnApi
          .getSongById(target.song.id)
          .then((res) => {
            if (res?.[0]) setFullSong(res[0]);
          })
          .catch(() => {});
      }
    } else {
      setSelectedIds(new Set(target.songs.map((s) => s.id)));
    }
  }, [target, defaultQuality]);

  if (!target) return null;

  const handleClose = () => {
    if (busy) return;
    dispatch(DownloadActions.closeDownloadModal());
  };

  const handleDownloadSong = async () => {
    if (!fullSong || busy) return;
    setBusy(true);
    setError(null);
    setDoneMessage(null);
    setProgressPct(5);
    setProgressText("Converting to MP3 & embedding cover, tags & lyrics...");
    try {
      await downloadTaggedSong(fullSong, quality, {
        onProgress: (pct) => {
          setProgressPct(pct);
          setProgressText(`Downloading MP3 (${pct}%)...`);
        },
      });
      setDoneMessage("Saved .mp3 with full ID3 tags, 500×500 cover art & lyrics!");
    } catch (err: any) {
      setError(err?.message || "Failed to download song");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveCover = async () => {
    if (!fullSong) return;
    try {
      const url = getBestImage(fullSong.image, "500x500");
      const res = await fetch(url);
      const blob = await res.blob();
      const name = sanitizeFilename(decodeText(fullSong.name)) || fullSong.id;
      triggerBlobDownload(blob, `${name} - Cover.jpg`);
    } catch {
      setError("Could not download cover image");
    }
  };

  const selectedSongs =
    target.kind === "collection"
      ? target.songs.filter((s) => selectedIds.has(s.id))
      : [];

  const handleDownloadZip = async () => {
    if (target.kind !== "collection" || !selectedSongs.length || busy) return;
    setBusy(true);
    setError(null);
    setDoneMessage(null);
    setProgressPct(30);
    setProgressText(
      `Bundling ${selectedSongs.length} tracks with cover art & metadata into ZIP...`
    );
    try {
      await downloadCollectionZip(target.title, selectedSongs, quality);
      setProgressPct(100);
      setDoneMessage(`Downloaded "${decodeText(target.title)}.zip" (${selectedSongs.length} tracks)!`);
    } catch (err: any) {
      setError(err?.message || "Failed to create ZIP archive");
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadIndividual = async () => {
    if (target.kind !== "collection" || !selectedSongs.length || busy) return;
    setBusy(true);
    setError(null);
    setDoneMessage(null);
    let completed = 0;
    try {
      for (let i = 0; i < selectedSongs.length; i++) {
        const s = selectedSongs[i];
        setProgressText(
          `Downloading ${i + 1} of ${selectedSongs.length}: ${decodeText(s.name)}`
        );
        setProgressPct(Math.round(((i + 0.5) / selectedSongs.length) * 100));
        await downloadTaggedSong(s, quality, {
          trackNumber: i + 1,
          totalTracks: selectedSongs.length,
        });
        completed++;
      }
      setProgressPct(100);
      setDoneMessage(`Downloaded ${completed} tagged .mp3 tracks!`);
    } catch (err: any) {
      setError(err?.message || `Stopped after ${completed} tracks`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#1c1c1e] text-zinc-900 dark:text-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/[0.07] dark:border-white/[0.08] px-5 py-4">
            <div className="flex items-center gap-2">
              <DownloadIcon className="h-4 w-4 text-[#fa243c]" />
              <h2 className="text-base font-bold">
                {target.kind === "song" ? "Download Song" : "Download Collection"}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={busy}
              aria-label="Close download options"
              className="rounded-full p-1.5 text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {target.kind === "song" && fullSong ? (
              <>
                {/* Song Metadata + Cover Preview */}
                <div className="flex gap-4 items-center rounded-2xl bg-zinc-100 dark:bg-black/40 p-3.5 border border-black/5 dark:border-white/10">
                  <img
                    src={getBestImage(fullSong.image, "500x500")}
                    alt={decodeText(fullSong.name)}
                    className="h-20 w-20 rounded-xl object-cover shadow-md shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-bold">
                      {decodeText(fullSong.name)}
                    </p>
                    <p className="truncate text-xs text-[#fa243c] font-medium">
                      {getArtistLabel(fullSong)}
                    </p>
                    {fullSong.album?.name && (
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        Album: {decodeText(fullSong.album.name)}
                      </p>
                    )}
                    <p className="text-[11px] text-zinc-400">
                      {[
                        fullSong.year,
                        formatDuration(fullSong.duration),
                        fullSong.language,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>

                {/* Embedded Tags Info */}
                <div className="rounded-2xl border border-black/10 dark:border-white/10 p-3.5 text-xs space-y-1.5">
                  <p className="font-semibold text-zinc-700 dark:text-zinc-200">
                    Embedded File Details (.mp3 · ID3v2.3)
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-zinc-500 dark:text-zinc-400">
                    <span>• Title &amp; Artist Tags</span>
                    <span>• 500×500 Cover Art</span>
                    <span>• Album &amp; Release Year</span>
                    <span>• Embedded Lyrics (USLT)</span>
                  </div>
                  {fullSong.label && (
                    <p className="text-[11px] text-zinc-400 pt-1 truncate">
                      Label: {decodeText(fullSong.label)}
                    </p>
                  )}
                </div>
              </>
            ) : (
              target.kind === "collection" && (
                <>
                  {/* Collection Header */}
                  <div className="flex gap-4 items-center rounded-2xl bg-zinc-100 dark:bg-black/40 p-3.5 border border-black/5 dark:border-white/10">
                    <img
                      src={target.coverUrl}
                      alt={decodeText(target.title)}
                      className="h-16 w-16 rounded-xl object-cover shadow-md shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {decodeText(target.title)}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {selectedSongs.length} of {target.songs.length} tracks selected
                      </p>
                      {target.songs.length > 60 && (
                        <p className="text-[11px] text-amber-500 mt-0.5">
                          ZIP batch supports up to 60 tracks per download
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedIds.size === target.songs.length) {
                          setSelectedIds(new Set());
                        } else {
                          setSelectedIds(new Set(target.songs.map((s) => s.id)));
                        }
                      }}
                      className="text-xs font-semibold text-[#fa243c] hover:underline shrink-0"
                    >
                      {selectedIds.size === target.songs.length ? "None" : "All"}
                    </button>
                  </div>

                  {/* Track Selection List */}
                  <div className="max-h-44 overflow-y-auto rounded-2xl border border-black/10 dark:border-white/10 divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                    {target.songs.map((s, idx) => {
                      const checked = selectedIds.has(s.id);
                      return (
                        <label
                          key={`${s.id}-${idx}`}
                          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = new Set(selectedIds);
                              if (checked) next.delete(s.id);
                              else next.add(s.id);
                              setSelectedIds(next);
                            }}
                            className="accent-[#fa243c] h-4 w-4 rounded"
                          />
                          <span className="w-5 text-[11px] text-zinc-400 tabular-nums">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">
                              {decodeText(s.name)}
                            </p>
                            <p className="truncate text-[11px] text-zinc-400">
                              {getArtistLabel(s)}
                            </p>
                          </div>
                          <span className="text-[11px] text-zinc-400 tabular-nums">
                            {formatDuration(s.duration)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )
            )}

            {/* Audio Quality Selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Audio Quality
              </p>
              <div className="grid grid-cols-1 gap-2">
                {QUALITY_OPTIONS.map((opt) => {
                  const active = quality === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={busy}
                      onClick={() => setQuality(opt.value)}
                      className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                        active
                          ? "border-[#fa243c] bg-[#fa243c]/10"
                          : "border-black/10 dark:border-white/10 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold flex items-center gap-2">
                          {opt.label}
                          <span className="rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold">
                            {opt.badge}
                          </span>
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {opt.desc}
                        </p>
                      </div>
                      {active && <CheckIcon className="h-4 w-4 text-[#fa243c]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Progress / Status */}
            {busy && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-300">
                  <span className="truncate">{progressText}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                  <div
                    className="h-full bg-[#fa243c] transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500">
                {error}
              </p>
            )}
            {doneMessage && (
              <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-500">
                {doneMessage}
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-black/[0.07] dark:border-white/[0.08] p-4 flex flex-col sm:flex-row gap-2.5">
            {target.kind === "song" ? (
              <>
                <button
                  type="button"
                  onClick={handleSaveCover}
                  disabled={busy}
                  className="rounded-xl border border-black/10 dark:border-white/15 px-4 py-2.5 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
                >
                  Save Cover (.jpg)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSong}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#fa243c] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#e01e35] disabled:opacity-50"
                >
                  <DownloadIcon className="h-4 w-4" />
                  {busy ? "Preparing..." : `Download (${quality})`}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleDownloadIndividual}
                  disabled={busy || !selectedSongs.length}
                  className="rounded-xl border border-black/10 dark:border-white/15 px-4 py-2.5 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
                >
                  Save Individual ({selectedSongs.length})
                </button>
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={busy || !selectedSongs.length}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#fa243c] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#e01e35] disabled:opacity-50"
                >
                  <DownloadIcon className="h-4 w-4" />
                  {busy
                    ? "Zipping Tracks..."
                    : `Download ZIP (${Math.min(selectedSongs.length, 60)} tracks)`}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DownloadModal;
