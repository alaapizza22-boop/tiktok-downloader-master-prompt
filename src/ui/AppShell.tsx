"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownToLine, History, Settings } from "lucide-react";
import { ToastProvider } from "@/ui/Toast";
import { useAdsController } from "@/ads/useAdsController";
import { BannerAd } from "@/ads/BannerAd";
import { InterstitialAdHost } from "@/ads/InterstitialAd";
import { MainScreen } from "@/ui/screens/MainScreen";
import { DownloadsScreen } from "@/ui/screens/DownloadsScreen";
import { SettingsScreen } from "@/ui/screens/SettingsScreen";
import { useDownloadsViewModel } from "@/viewmodel/useDownloadsViewModel";
import { useSettingsViewModel } from "@/viewmodel/useSettingsViewModel";

type Tab = "main" | "downloads" | "settings";

const TABS: { id: Tab; label: string; icon: typeof ArrowDownToLine }[] = [
  { id: "main", label: "تحميل", icon: ArrowDownToLine },
  { id: "downloads", label: "تحميلاتي", icon: History },
  { id: "settings", label: "الإعدادات", icon: Settings },
];

/** شاشة البداية أثناء الـ mounted guard */
function Splash() {
  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="animate-ring-pulse absolute inset-0 rounded-3xl border-2 border-cyan-300/50" />
        <div className="glow-neon flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-pink-500">
          <ArrowDownToLine className="h-7 w-7 text-black" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

export function AppShell() {
  /**
   * Mounted State Guard (قاعدة إلزامية):
   * لا يتم تنفيذ أو عرض أي كود يعتمد على window / localStorage / state
   * غير الجاهز أثناء الـ Pre-rendering وقت البناء.
   * كل الـ hooks تُستدعى قبل أي return شرطي.
   */
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("main");
  const [prefillUrl, setPrefillUrl] = useState<string | null>(null);

  const ads = useAdsController();
  const downloads = useDownloadsViewModel();
  const settingsVm = useSettingsViewModel();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) void ads.showBanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) {
    return <Splash />;
  }

  const handleReanalyze = (url: string) => {
    setPrefillUrl(url);
    setTab("main");
  };

  return (
    <ToastProvider>
      <div className="flex min-h-dvh items-center justify-center">
        {/* إطار الهاتف — ملء الشاشة على الموبايل، عائم على الشاشات الكبيرة */}
        <div className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-ink sm:h-[94dvh] sm:max-h-[900px] sm:rounded-[2.2rem] sm:border sm:border-white/10 sm:shadow-[0_50px_140px_-30px_rgba(0,0,0,0.95)]">
          {/* توهجات خلفية */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -top-24 -left-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-[90px]" />
            <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-pink-500/12 blur-[100px]" />
            <div className="noise-overlay" />
          </div>

          {/* المحتوى */}
          <main className="relative z-10 min-h-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                className="h-full"
                initial={{ opacity: 0, x: tab === "main" ? 0 : 18, y: 8 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: tab === "main" ? 0 : -18, y: -8 }}
                transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              >
                {tab === "main" && (
                  <MainScreen
                    prefillUrl={prefillUrl}
                    onConsumePrefill={() => setPrefillUrl(null)}
                    onDownloadSuccess={(meta, kind) => {
                      void downloads.add(meta, kind);
                      void ads.notifyDownloadCompleted();
                    }}
                  />
                )}
                {tab === "downloads" && (
                  <DownloadsScreen
                    vm={downloads}
                    onReanalyze={handleReanalyze}
                  />
                )}
                {tab === "settings" && (
                  <SettingsScreen
                    settings={settingsVm}
                    ads={ads}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* مساحة البانر الإعلاني (فوق شريط التنقل) */}
          <BannerAd
            native={ads.native}
            visible={ads.bannerVisible}
            showPlaceholder={
              settingsVm.hydrated
                ? settingsVm.settings.showWebAdPlaceholder
                : false
            }
          />

          {/* شريط التنقل السفلي */}
          <nav className="relative z-20 shrink-0 px-4 pb-4 safe-bottom">
            <div className="glass flex items-stretch gap-1 rounded-2xl p-1.5">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className="relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] font-bold transition-colors"
                    style={{ color: active ? "#03141a" : "rgba(255,255,255,0.55)" }}
                    aria-current={active ? "page" : undefined}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl bg-gradient-to-l from-cyan-300 to-cyan-400"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 34,
                        }}
                      />
                    )}
                    <Icon className="relative z-10 h-5 w-5" strokeWidth={2.4} />
                    <span className="relative z-10">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* معاينة الإعلان البيني (وضع الويب فقط) */}
          <InterstitialAdHost
            visible={ads.previewVisible}
            onClose={ads.closePreview}
          />
        </div>
      </div>
    </ToastProvider>
  );
}
