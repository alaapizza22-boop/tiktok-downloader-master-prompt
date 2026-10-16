"use client";

import Link from "next/link";
import {
  BellRing,
  ChevronLeft,
  Database,
  Globe,
  Megaphone,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import type { useSettingsViewModel } from "@/viewmodel/useSettingsViewModel";
import type { AdsController } from "@/ads/useAdsController";
import { INTERSTITIAL_EVERY_N_DOWNLOADS } from "@/lib/config";

type SettingsVm = ReturnType<typeof useSettingsViewModel>;

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-right transition hover:bg-white/[0.04]"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-white/90">{label}</p>
        {hint ? (
          <p className="mt-0.5 text-[11px] leading-relaxed text-white/40">{hint}</p>
        ) : null}
      </div>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-gradient-to-l from-cyan-400 to-cyan-300" : "bg-white/12"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "right-1" : "right-6"
          }`}
        />
      </span>
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 px-1 text-[11px] font-black tracking-wide text-white/40">
        {title}
      </h2>
      <div className="glass divide-y divide-white/[0.06] overflow-hidden rounded-2xl">
        {children}
      </div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Globe;
  label: string;
  value: string;
  tone?: "default" | "ok" | "warn";
}) {
  const toneClass =
    tone === "ok"
      ? "text-emerald-300"
      : tone === "warn"
        ? "text-amber-300"
        : "text-white/60";
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon className="h-4.5 w-4.5 shrink-0 text-cyan-300/70" />
      <p className="flex-1 text-[13px] font-bold text-white/90">{label}</p>
      <p className={`max-w-[45%] truncate text-[11px] font-medium ${toneClass}`} dir="ltr">
        {value}
      </p>
    </div>
  );
}

export function SettingsScreen({
  settings,
  ads,
}: {
  settings: SettingsVm;
  ads: AdsController;
}) {
  const apiDisplay = settings.apiBaseUrl
    ? settings.apiBaseUrl.replace(/^https?:\/\//, "")
    : "غير مضبوط";

  return (
    <div className="scrollbar-none h-full overflow-y-auto px-5 pt-6 pb-4 safe-top">
      {/* الترويسة */}
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <SettingsIcon className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <p className="text-base font-black leading-5">الإعدادات</p>
          <p className="text-[11px] text-white/45">تحكم كامل في التطبيق</p>
        </div>
      </header>

      {/* حالة الاتصال */}
      <Section title="الاتصال">
        <InfoRow
          icon={Globe}
          label="خادم API"
          value={settings.apiBaseUrl ? apiDisplay : "غير مضبوط!"}
          tone={settings.apiBaseUrl ? "ok" : "warn"}
        />
        <InfoRow
          icon={Smartphone}
          label="بيئة التشغيل"
          value={ads.native ? "Android (Native)" : "Web Preview"}
        />
        <InfoRow
          icon={Database}
          label="مزامنة السجل"
          value={settings.apiBaseUrl ? "مفعّلة" : "محلية فقط"}
          tone={settings.apiBaseUrl ? "ok" : "default"}
        />
      </Section>

      {/* الإعلانات */}
      <Section title="الإعلانات">
        <Toggle
          checked={settings.settings.showWebAdPlaceholder}
          onChange={(v) => settings.update({ showWebAdPlaceholder: v })}
          label="إظهار مساحة البانر التجريبية"
          hint="في وضع الويب فقط — على الموبايل يظهر بانر AdMob الحقيقي"
        />
        <button
          type="button"
          onClick={() => void ads.testInterstitial()}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-right transition hover:bg-white/[0.04]"
        >
          <Megaphone className="h-4.5 w-4.5 shrink-0 text-pink-300/80" />
          <div className="flex-1">
            <p className="text-[13px] font-bold text-white/90">
              تجربة الإعلان البيني
            </p>
            <p className="mt-0.5 text-[11px] text-white/40">
              يظهر تلقائياً بعد كل {INTERSTITIAL_EVERY_N_DOWNLOADS} تحميلات
              ناجحة (Test ID)
            </p>
          </div>
          <ChevronLeft className="h-4 w-4 text-white/30" />
        </button>
        <div className="flex items-start gap-2.5 px-4 py-3">
          <BellRing className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300/70" />
          <p className="text-[10.5px] leading-relaxed text-amber-200/60">
            معرّفات الإعلانات الحالية اختبارية من Google. استبدلها عبر
            NEXT_PUBLIC_ADMOB_BANNER_ID و NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID
            عند النشر فقط — استخدام معرّفات حقيقية أثناء التطوير قد يحظر حسابك.
          </p>
        </div>
      </Section>

      {/* التحميل */}
      <Section title="التحميل">
        <Toggle
          checked={settings.settings.preferHd}
          onChange={(v) => settings.update({ preferHd: v })}
          label="تفضيل جودة HD"
          hint="إظهار خيار HD بدون علامة مائية أولاً عند توفّره"
        />
      </Section>

      {/* حول */}
      <Section title="حول التطبيق">
        <Link
          href="/privacy"
          className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.04]"
        >
          <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-emerald-300/80" />
          <p className="flex-1 text-[13px] font-bold text-white/90">
            سياسة الخصوصية
          </p>
          <ChevronLeft className="h-4 w-4 text-white/30" />
        </Link>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Sparkles className="h-4.5 w-4.5 shrink-0 text-cyan-300/70" />
          <p className="flex-1 text-[13px] font-bold text-white/90">الإصدار</p>
          <p className="text-[11px] text-white/40" dir="ltr">
            TokSaver v{settings.version}
          </p>
        </div>
      </Section>

      {/* تنويه قانوني */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
        <p className="text-[10.5px] leading-relaxed text-white/40">
          TokSaver تطبيق مستقل وغير تابع لشركة TikTok أو ByteDance. حمّل فقط
          المحتوى الذي تملكه أو لديك إذن صريح باستخدامه، وللاستخدام الشخصي
          فقط. جميع العلامات التجارية وحقوق المحتوى تعود لأصحابها.
        </p>
      </div>

      <div className="h-4" />
    </div>
  );
}
