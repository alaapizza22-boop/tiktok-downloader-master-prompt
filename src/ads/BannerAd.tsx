"use client";

import { Megaphone } from "lucide-react";

/**
 * BannerAd
 * - على Native: إعلان AdMob حقيقي يُرسم كطبقة أصلية أسفل الشاشة،
 *   وهذا المكوّن يحجز مساحته فقط حتى لا يغطي الـ Navigation Bar.
 * - على الويب/المعاينة: شريط تجريبي أنيق يوضح مكان البانر.
 */
export function BannerAd({
  native,
  visible,
  showPlaceholder,
}: {
  native: boolean;
  visible: boolean;
  showPlaceholder: boolean;
}) {
  if (native) {
    // مساحة محجوزة للبانر الأصلي (Adaptive Banner ≈ 56dp)
    return visible ? <div className="h-14 w-full shrink-0" aria-hidden /> : null;
  }

  if (!showPlaceholder) return null;

  return (
    <div className="w-full shrink-0 px-3 pb-2">
      <div className="flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-[11px] text-white/40">
        <Megaphone className="h-3.5 w-3.5" />
        <span>مساحة إعلانية — AdMob Banner (تجريبي)</span>
      </div>
    </div>
  );
}
