"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CloudOff,
  Film,
  FolderDown,
  History,
  Music,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import type { useDownloadsViewModel } from "@/viewmodel/useDownloadsViewModel";
import { DOWNLOAD_KIND_LABEL, type DownloadHistoryItem } from "@/data/types";

type DownloadsVm = ReturnType<typeof useDownloadsViewModel>;

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "الآن";
  if (min < 60) return `منذ ${min} د`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  return new Date(iso).toLocaleDateString("ar-EG");
}

function ItemCard({
  item,
  onReanalyze,
  onRemove,
}: {
  item: DownloadHistoryItem;
  onReanalyze: (url: string) => void;
  onRemove: (id: string) => void;
}) {
  const isAudio = item?.quality === "mp3";
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="glass flex gap-3 rounded-2xl p-3"
    >
      {/* الغلاف */}
      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
        {item?.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.cover}
            alt={item?.title ?? ""}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {isAudio ? (
              <Music className="h-6 w-6 text-pink-300/60" />
            ) : (
              <Film className="h-6 w-6 text-white/25" />
            )}
          </div>
        )}
      </div>

      {/* البيانات */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[12.5px] font-bold leading-snug text-white/90">
          {item?.title ?? "فيديو بدون عنوان"}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[9.5px] font-black ${
              isAudio
                ? "bg-pink-400/15 text-pink-300"
                : "bg-cyan-400/15 text-cyan-300"
            }`}
          >
            {DOWNLOAD_KIND_LABEL[item?.quality ?? "hd"]}
          </span>
          <span className="text-[10px] text-white/35">
            {timeAgo(item?.createdAt ?? "")}
          </span>
        </div>
        {item?.authorUsername ? (
          <p className="mt-1 truncate text-[10.5px] text-white/40" dir="ltr">
            @{item.authorUsername}
          </p>
        ) : null}
      </div>

      {/* الإجراءات */}
      <div className="flex shrink-0 flex-col justify-between">
        <button
          type="button"
          onClick={() => onRemove(item?.id ?? "")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-rose-400/15 hover:text-rose-300"
          aria-label="حذف من السجل"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onReanalyze(item?.url ?? "")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-cyan-400/15 hover:text-cyan-300"
          aria-label="إعادة التحليل والتحميل مجدداً"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </motion.li>
  );
}

export function DownloadsScreen({
  vm,
  onReanalyze,
}: {
  vm: DownloadsVm;
  onReanalyze: (url: string) => void;
}) {
  const [armingClear, setArmingClear] = useState(false);
  const items = Array.isArray(vm?.items) ? vm.items : [];

  const handleClear = () => {
    if (!armingClear) {
      setArmingClear(true);
      setTimeout(() => setArmingClear(false), 3000);
      return;
    }
    setArmingClear(false);
    void vm.clearAll();
  };

  return (
    <div className="scrollbar-none flex h-full flex-col px-5 pt-6 pb-4 safe-top">
      {/* الترويسة */}
      <header className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <History className="h-5 w-5 text-cyan-300" />
        </div>
        <div className="flex-1">
          <p className="text-base font-black leading-5">تحميلاتي</p>
          <p className="text-[11px] text-white/45">
            {items.length > 0 ? `${items.length} عنصر في السجل` : "سجل فارغ"}
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-[11px] font-bold transition ${
              armingClear
                ? "bg-rose-400/90 text-rose-950"
                : "bg-white/8 text-rose-300 hover:bg-rose-400/15"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {armingClear ? "تأكيد المسح؟" : "مسح الكل"}
          </button>
        )}
      </header>

      {/* تنبيه عند العمل من الذاكرة المحلية */}
      {vm?.error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-2 text-[11px] font-medium text-amber-200">
          <CloudOff className="h-4 w-4 shrink-0" />
          {vm.error}
        </div>
      )}

      {/* المحتوى */}
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none">
        {vm?.loading && items.length === 0 ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass flex gap-3 rounded-2xl p-3">
                <div className="shimmer h-20 w-16 rounded-xl" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="shimmer h-3 w-4/5 rounded-full" />
                  <div className="shimmer h-3 w-2/5 rounded-full" />
                  <div className="shimmer h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="animate-floaty relative mb-5">
              <div className="absolute inset-0 rounded-3xl bg-cyan-400/20 blur-2xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
                <FolderDown className="h-9 w-9 text-white/50" />
              </div>
            </div>
            <p className="text-sm font-bold text-white/70">لا توجد تحميلات بعد</p>
            <p className="mt-1.5 max-w-[240px] text-[11.5px] leading-relaxed text-white/40">
              كل فيديو أو مقطع صوتي تحمّله سيظهر هنا للوصول السريع إليه مجدداً.
            </p>
          </div>
        ) : (
          <ul className="space-y-3 pb-2">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <ItemCard
                  key={item?.id ?? Math.random()}
                  item={item}
                  onReanalyze={onReanalyze}
                  onRemove={(id) => void vm.remove(id)}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
