"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Megaphone, X } from "lucide-react";

/**
 * InterstitialAd (معاينة الويب)
 * على Native يظهر إعلان AdMob الحقيقي كنظام تشغيل، أما هنا فنعرض
 * طبقة تجريبية تحاكي الإعلان البيني عند اختبار التطبيق في المتصفح.
 */
export function InterstitialAdHost({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!visible) return;
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="إعلان تجريبي"
        >
          <motion.div
            className="relative w-full max-w-xs overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 text-center shadow-2xl"
            initial={{ scale: 0.85, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 16 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-pink-500">
              <Megaphone className="h-6 w-6 text-black" />
            </div>
            <p className="text-sm font-bold text-white">إعلان بيني — تجريبي</p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">
              في تطبيق الموبايل يظهر هنا إعلان AdMob الحقيقي
              <br />
              (Test Interstitial)
            </p>

            <button
              type="button"
              onClick={onClose}
              disabled={countdown > 0}
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-bold text-white transition enabled:hover:bg-white/20 disabled:opacity-40"
            >
              <X className="h-4 w-4" />
              {countdown > 0 ? `إغلاق بعد ${countdown}` : "إغلاق الإعلان"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
