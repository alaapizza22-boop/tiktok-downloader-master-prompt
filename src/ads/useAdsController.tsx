"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ADMOB_BANNER_ID,
  ADMOB_INTERSTITIAL_ID,
  INTERSTITIAL_EVERY_N_DOWNLOADS,
  INTERSTITIAL_MIN_INTERVAL_MS,
} from "@/lib/config";

/**
 * ============================================================
 *  useAdsController — غلاف AdMob (@capacitor-community/admob)
 *  - Banner: أسفل الشاشة فوق الـ Navigation Bar.
 *  - Interstitial: بعد كل 3 تحميلات ناجحة (Frequency Capped)
 *    + حد أدنى 90 ثانية بين كل ظهور.
 *  - معرّفات اختبارية افتراضياً — لا تستخدم معرّفات حقيقية في التطوير.
 *  - كل الاستدعاءات Native تتم عبر dynamic import + try/catch،
 *    وفي وضع الويب يعمل كل شيء كمعاينة آمنة (Preview).
 * ============================================================
 */

const COUNTER_KEY = "toksaver:ad-download-counter";
const LAST_SHOWN_KEY = "toksaver:ad-last-interstitial";

function isNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (
    window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean };
    }
  ).Capacitor;
  try {
    return Boolean(cap?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export function useAdsController() {
  const [native, setNative] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const initializedRef = useRef(false);

  /** التهيئة — Native فقط، ولا تُكسر الويب أبداً */
  const initialize = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!isNative()) {
      setNative(false);
      return;
    }
    setNative(true);

    try {
      const { AdMob } = await import("@capacitor-community/admob");
      await AdMob.initialize({ initializeForTesting: true });
      console.info("[ads] AdMob initialized");
    } catch (err) {
      console.warn("[ads] AdMob init failed:", err);
    }
  }, []);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  /* ---------------------------- Banner ---------------------------- */

  const showBanner = useCallback(async () => {
    if (!isNative()) {
      setBannerVisible(true); // معاينة الويب تُدار عبر الإعدادات
      return;
    }
    try {
      const { AdMob, BannerAdSize, BannerAdPosition } = await import(
        "@capacitor-community/admob"
      );
      await AdMob.showBanner({
        adId: ADMOB_BANNER_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true,
      });
      setBannerVisible(true);
    } catch (err) {
      console.warn("[ads] showBanner failed:", err);
    }
  }, []);

  const hideBanner = useCallback(async () => {
    setBannerVisible(false);
    if (!isNative()) return;
    try {
      const { AdMob } = await import("@capacitor-community/admob");
      await AdMob.hideBanner();
      await AdMob.removeBanner();
    } catch (err) {
      console.warn("[ads] hideBanner failed:", err);
    }
  }, []);

  /* ------------------------- Interstitial ------------------------- */

  const showInterstitialNow = useCallback(async (): Promise<void> => {
    try {
      window.localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }

    if (!isNative()) {
      // وضع الويب/المعاينة: نعرض طبقة تجريبية بدل الإعلان الحقيقي
      setPreviewVisible(true);
      return;
    }

    try {
      const { AdMob } = await import("@capacitor-community/admob");
      await AdMob.prepareInterstitial({
        adId: ADMOB_INTERSTITIAL_ID,
        isTesting: true,
      });
      await AdMob.showInterstitial();
    } catch (err) {
      console.warn("[ads] interstitial failed:", err);
    }
  }, []);

  /**
   * يُستدعى بعد كل عملية تحميل ناجحة.
   * لا يعرض الإعلان إلا كل INTERSTITIAL_EVERY_N_DOWNLOADS مرات،
   * مع حد أدنى زمني بين الظهور (Frequency Capping).
   */
  const notifyDownloadCompleted = useCallback(async (): Promise<void> => {
    if (typeof window === "undefined") return;

    let count = 0;
    try {
      count =
        (Number(window.localStorage.getItem(COUNTER_KEY) ?? "0") || 0) + 1;
      window.localStorage.setItem(COUNTER_KEY, String(count));
    } catch {
      return;
    }

    if (count % INTERSTITIAL_EVERY_N_DOWNLOADS !== 0) return;

    const last =
      Number(window.localStorage.getItem(LAST_SHOWN_KEY) ?? "0") || 0;
    if (Date.now() - last < INTERSTITIAL_MIN_INTERVAL_MS) {
      console.info("[ads] interstitial skipped — frequency cap active");
      return;
    }

    await showInterstitialNow();
  }, [showInterstitialNow]);

  /** زر اختبار من شاشة الإعدادات */
  const testInterstitial = useCallback(async (): Promise<void> => {
    await showInterstitialNow();
  }, [showInterstitialNow]);

  const closePreview = useCallback(() => setPreviewVisible(false), []);

  return {
    native,
    bannerVisible,
    previewVisible,
    showBanner,
    hideBanner,
    notifyDownloadCompleted,
    testInterstitial,
    closePreview,
  };
}

export type AdsController = ReturnType<typeof useAdsController>;
