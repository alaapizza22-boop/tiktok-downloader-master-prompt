/**
 * ============================================================
 *  المصدر الوحيد لرابط الـ API (Single Source of Truth)
 * ============================================================
 *  القاعدة الذهبية للمشروع:
 *  ممنوع تماماً استخدام أي رابط يبدأ بـ "/" (Relative URL) في أي
 *  كود من المفترض أن يعمل داخل تطبيق الموبايل.
 *  كل fetch يجب أن يكون: `${getApiBaseUrl()}/api/...`
 * ============================================================
 */

function isNativeCapacitor(): boolean {
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

/**
 * يعيد رابط الـ API كرابط مطلق دائماً (لا يبدأ بـ "/").
 * الأولوية:
 *   1) NEXT_PUBLIC_API_BASE_URL  (يُحقن وقت البناء في GitHub Actions)
 *   2) نفس الـ origin            (وضع الويب / المعاينة فقط)
 *   3) ""                        (وضع Native بدون متغير بيئة = خطأ إعداد)
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    if (isNativeCapacitor()) {
      // على الموبايل: لا يوجد origin صالح — يجب ضبط متغير البيئة
      return "";
    }
    return window.location.origin;
  }
  return "";
}

/**
 * نفس getApiBaseUrl لكن مع تحذير واضح جداً في console عند غياب القيمة —
 * يُستدعى في بداية كل ViewModel/Hook حسب قواعد المشروع.
 */
export function requireApiBaseUrl(context: string): string {
  const base = getApiBaseUrl();
  if (!base) {
    console.error(
      `[TokSaver] NEXT_PUBLIC_API_BASE_URL is EMPTY in "${context}". ` +
        "Static/Capacitor builds cannot call the API without it. " +
        "Set it as a GitHub Secret (API_BASE_URL) and rebuild."
    );
  }
  return base;
}

/** معرّفات AdMob — الاختبارية هي الافتراضي، وتُستبدل في الإنتاج فقط */
export const ADMOB_BANNER_ID =
  process.env.NEXT_PUBLIC_ADMOB_BANNER_ID?.trim() ||
  "ca-app-pub-3940256099942544/6300978111"; // Google Test Banner (Android)

export const ADMOB_INTERSTITIAL_ID =
  process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID?.trim() ||
  "ca-app-pub-3940256099942544/1033173712"; // Google Test Interstitial (Android)

/** يظهر الإعلان البيني بعد كل N عمليات تحميل ناجحة (Frequency Cap) */
export const INTERSTITIAL_EVERY_N_DOWNLOADS = 3;
/** حد أدنى بالمللي ثانية بين إعلانين بينيين */
export const INTERSTITIAL_MIN_INTERVAL_MS = 90_000;
