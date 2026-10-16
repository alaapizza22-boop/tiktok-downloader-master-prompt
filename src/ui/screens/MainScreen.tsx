"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownToLine,
  BadgeCheck,
  CheckCircle2,
  ClipboardPaste,
  Clock,
  Film,
  Link2,
  Loader2,
  Music,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useAnalyzerViewModel } from "@/viewmodel/useAnalyzerViewModel";
import { useDownloaderViewModel } from "@/viewmodel/useDownloaderViewModel";
import { useToast } from "@/ui/Toast";
import { DOWNLOAD_KIND_LABEL, type DownloadKind, type VideoMeta } from "@/data/types";

function formatDuration(sec: number): string {
  if (!sec || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function MainScreen({
  prefillUrl,
  onConsumePrefill,
  onDownloadSuccess,
}: {
  prefillUrl: string | null;
  onConsumePrefill?: () => void;
  onDownloadSuccess?: (meta: VideoMeta, kind: DownloadKind) => void;
}) {
  const toast = useToast();
  const analyzer = useAnalyzerViewModel();
  const downloader = useDownloaderViewModel({
    onSuccess: ({ meta, kind }) => {
      onDownloadSuccess?.(meta, kind);
      toast.success(`تم حفظ ${DOWNLOAD_KIND_LABEL[kind]} بنجاح`);
    },
  });

  // رابط وارد من شاشة "تحميلاتي" — يُستهلك مرة واحدة
  useEffect(() => {
    if (!prefillUrl) return;
    analyzer.setInput(prefillUrl);
    onConsumePrefill?.();
    void analyzer.analyze(prefillUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillUrl]);

  const video = analyzer.video;
  const working = downloader.status === "working";

  const checkNow = analyzer.localCheck();
  const inputInvalid =
    analyzer.input.trim().length > 6 && !checkNow.ok;

  const handleSubmit = async () => {
    downloader.resetStatus();
    await analyzer.analyze();
  };

  const handlePaste = async () => {
    const text = await analyzer.pasteFromClipboard();
    if (text) toast.info("تم لصق الرابط من الحافظة");
  };

  const available = video?.links ?? {};
  const downloadOptions: { kind: DownloadKind; icon: typeof Sparkles; primary?: boolean }[] = [
    ...(available?.hd || available?.noWatermark
      ? [{ kind: "hd" as DownloadKind, icon: Sparkles, primary: true }]
      : []),
    ...(available?.watermark ? [{ kind: "wm" as DownloadKind, icon: Film }] : []),
    ...(available?.audio ? [{ kind: "mp3" as DownloadKind, icon: Music }] : []),
  ];

  return (
    <div className="scrollbar-none h-full overflow-y-auto px-5 pt-6 pb-4 safe-top">
      {/* ---------- الترويسة ---------- */}
      <header className="mb-6 flex items-center gap-3">
        <div className="glow-neon flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-pink-500">
          <ArrowDownToLine className="h-5 w-5 text-black" strokeWidth={2.6} />
        </div>
        <div>
          <p className="text-base font-black leading-5">TokSaver</p>
          <p className="text-[11px] text-white/45">تحميل بلا علامة مائية</p>
        </div>
        <span className="mr-auto rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/50">
          v1.0
        </span>
      </header>

      {/* ---------- العنوان ---------- */}
      <h1 className="text-[26px] font-black leading-[1.35]">
        حمّل فيديوهاتك
        <br />
        <span className="text-brand-gradient">بجودة HD وبدون علامة</span>
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-white/50">
        الصق رابط الفيديو من تيك توك، واختر: فيديو HD بدون علامة مائية، أو
        الصوت MP3 فقط.
      </p>

      {/* ---------- بطاقة الإدخال ---------- */}
      <div
        className={`glass mt-5 rounded-2xl p-2 transition-colors ${
          inputInvalid ? "border-rose-400/50" : "focus-within:border-cyan-300/40"
        }`}
      >
        <div className="flex items-center gap-2">
          <Link2 className="mr-2 h-4.5 w-4.5 shrink-0 text-white/40" />
          <input
            value={analyzer.input}
            onChange={(e) => analyzer.setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSubmit();
            }}
            inputMode="url"
            dir="ltr"
            placeholder="https://www.tiktok.com/@user/video/..."
            className="h-11 min-w-0 flex-1 bg-transparent text-left text-[13px] text-white outline-none placeholder:text-white/25"
            aria-label="رابط فيديو تيك توك"
          />
          {analyzer.input ? (
            <button
              type="button"
              onClick={() => analyzer.setInput("")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10"
              aria-label="مسح"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handlePaste()}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-white/8 px-3 text-[11px] font-bold text-cyan-200 transition hover:bg-white/15"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            لصق
          </button>
        </div>
      </div>

      {/* رسالة تحقق محلية فورية */}
      <AnimatePresence>
        {inputInvalid && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-rose-300"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {!checkNow.ok ? checkNow.message : ""}
          </motion.p>
        )}
      </AnimatePresence>

      {/* زر الجلب */}
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={analyzer.status === "loading"}
        className="btn-brand mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-black"
      >
        {analyzer.status === "loading" ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            جارٍ تحليل الفيديو...
          </>
        ) : (
          <>
            <ArrowDownToLine className="h-5 w-5" strokeWidth={2.6} />
            جلب الفيديو
          </>
        )}
      </button>

      {/* هيكل تحميل أثناء التحليل */}
      {analyzer.status === "loading" && (
        <div className="glass mt-5 rounded-3xl p-4">
          <div className="shimmer h-48 w-full rounded-2xl" />
          <div className="mt-3 flex items-center gap-3">
            <div className="shimmer h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="shimmer h-3 w-3/4 rounded-full" />
              <div className="shimmer h-3 w-1/3 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* ---------- خطأ التحليل + Retry حقيقي ---------- */}
      <AnimatePresence>
        {analyzer.status === "error" && analyzer.error && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-5 rounded-2xl border border-rose-400/25 bg-rose-400/8 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
              <div className="flex-1">
                <p className="text-sm font-bold text-rose-200">تعذّر التحليل</p>
                <p className="mt-1 text-[12px] leading-relaxed text-rose-200/70">
                  {analyzer.error?.message ?? "حدث خطأ غير متوقع"}
                </p>
                <button
                  type="button"
                  onClick={() => void analyzer.retry()}
                  className="mt-3 flex items-center gap-1.5 rounded-xl bg-rose-400/15 px-3.5 py-2 text-[12px] font-bold text-rose-200 transition hover:bg-rose-400/25"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  إعادة المحاولة
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- بطاقة النتيجة ---------- */}
      <AnimatePresence>
        {analyzer.status === "success" && video && (
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
            className="glass mt-5 overflow-hidden rounded-3xl"
          >
            {/* الغلاف */}
            <div className="relative">
              {video?.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.cover}
                  alt={video?.title ?? "غلاف الفيديو"}
                  referrerPolicy="no-referrer"
                  className="h-56 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-cyan-500/25 to-pink-500/25">
                  <Film className="h-12 w-12 text-white/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              {typeof video?.durationSec === "number" && video.durationSec > 0 && (
                <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                  <Clock className="h-3 w-3" />
                  {formatDuration(video.durationSec)}
                </span>
              )}
              {video?.links?.noWatermark || video?.links?.hd ? (
                <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-emerald-400/90 px-2.5 py-1 text-[10px] font-black text-emerald-950">
                  <BadgeCheck className="h-3 w-3" />
                  بدون علامة متاح
                </span>
              ) : null}
            </div>

            {/* البيانات */}
            <div className="p-4">
              <div className="flex items-center gap-3">
                {video?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.avatar}
                    alt={video?.authorName ?? "الكاتب"}
                    referrerPolicy="no-referrer"
                    className="h-10 w-10 rounded-full border border-white/15 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-black text-white/60">
                    {(video?.authorName ?? "؟").slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">
                    {video?.authorName ?? "مستخدم TikTok"}
                  </p>
                  {video?.authorUsername ? (
                    <p className="truncate text-[11px] text-cyan-300/80" dir="ltr">
                      @{video.authorUsername}
                    </p>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-white/70">
                {video?.title ?? ""}
              </p>

              {/* أزرار التحميل */}
              <div className="mt-4 space-y-2.5">
                {downloadOptions.map(({ kind, icon: Icon, primary }) => {
                  const isActive =
                    downloader.activeKind === kind && working;
                  const showProgress = isActive;
                  return (
                    <button
                      key={kind}
                      type="button"
                      disabled={working}
                      onClick={() => void downloader.start(video, kind)}
                      className={`relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-[13px] font-black transition ${
                        primary
                          ? "btn-brand"
                          : "border border-white/12 bg-white/6 text-white enabled:hover:bg-white/12"
                      } disabled:opacity-60`}
                    >
                      {showProgress && (
                        <span
                          className="progress-fill"
                          style={{ width: `${downloader.progress}%` }}
                        />
                      )}
                      {showProgress ? (
                        <Loader2 className="relative z-10 h-4.5 w-4.5 animate-spin" />
                      ) : (
                        <Icon className="relative z-10 h-4.5 w-4.5" />
                      )}
                      <span className="relative z-10">
                        {showProgress
                          ? `جارٍ التحميل ${downloader.progress}%`
                          : DOWNLOAD_KIND_LABEL[kind]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* حالة التحميل */}
              <AnimatePresence>
                {downloader.status === "done" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2.5 text-[12px] font-bold text-emerald-200"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {downloader.savedTo === "native"
                      ? "تم الحفظ في مجلد TokSaver على جهازك"
                      : "اكتمل التحميل — تحقق من مجلد التنزيلات"}
                  </motion.div>
                )}
                {downloader.status === "error" && downloader.error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2.5"
                  >
                    <p className="flex items-center gap-2 text-[12px] font-bold text-rose-200">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {downloader.error?.message ?? "فشل التحميل"}
                    </p>
                    <button
                      type="button"
                      onClick={() => void downloader.retry()}
                      className="mt-2 flex items-center gap-1.5 rounded-lg bg-rose-400/15 px-3 py-1.5 text-[11px] font-bold text-rose-200 transition hover:bg-rose-400/25"
                    >
                      <RotateCcw className="h-3 w-3" />
                      إعادة تنفيذ التحميل
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ---------- التنويه القانوني ---------- */}
      <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-cyan-300/80" />
          <p className="text-[11px] leading-relaxed text-white/45">
            حمّل فقط المحتوى الذي تملكه أو لديك إذن باستخدامه، وللاستخدام
            الشخصي فقط. جميع حقوق الفيديوهات تعود لأصحابها.{" "}
            <Link href="/privacy" className="font-bold text-cyan-300/90 underline underline-offset-2">
              سياسة الخصوصية
            </Link>
          </p>
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}
