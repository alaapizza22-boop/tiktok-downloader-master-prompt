import type { NextConfig } from "next";

/**
 * ============================================================
 *  استراتيجية البناء المزدوجة (Dual-Build Strategy)
 * ============================================================
 *  1) الوضع العادي (Vercel / التطوير / المعاينة):
 *     - الـ API Routes تعمل بشكل دايناميكي (force-dynamic).
 *     - هذا هو الوضع الافتراضي.
 *
 *  2) وضع الموبايل (Capacitor Static Export):
 *     - يُفعَّل فقط عندما CAPACITOR_BUILD=true (داخل GitHub Actions).
 *     - ينتج مجلد out/ ثابت بدون أي API Routes فعالة.
 *     - ملاحظة: الـ workflow ينقل مجلد src/app/api خارجاً مؤقتاً
 *       قبل هذا البناء لأن Static Export لا يدعم Route Handlers.
 * ============================================================
 */
const isCapacitorBuild = process.env.CAPACITOR_BUILD === "true";

const nextConfig: NextConfig = {
  ...(isCapacitorBuild
    ? {
        output: "export",
        // trailingSlash يمنع مشاكل التوجيه داخل WebView
        trailingSlash: true,
      }
    : {}),
  images: {
    // إلزامي للـ Static Export، وآمن للوضع العادي أيضاً
    unoptimized: true,
  },
};

export default nextConfig;
