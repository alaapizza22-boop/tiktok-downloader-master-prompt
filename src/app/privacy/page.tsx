import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Database, Megaphone, ShieldCheck, UserX } from "lucide-react";

export const metadata: Metadata = {
  title: "سياسة الخصوصية — TokSaver",
  description: "سياسة الخصوصية لتطبيق TokSaver",
};

const SECTIONS = [
  {
    icon: Database,
    title: "لا نخزّن فيديوهاتك على خوادمنا",
    body: "يعمل التطبيق كوسيط تقني فقط: عند طلب التحميل يتم بثّ الملف مباشرة من مصدره إلى جهازك دون حفظ أي نسخة على خوادمنا. نحتفظ فقط بسجل وصفي بسيط (عنوان الفيديو وصاحبه ورابط المصدر) مرتبط بمعرّف جهاز عشوائي، لعرض شاشة «تحميلاتي» — ويمكنك مسحه بالكامل في أي وقت من داخل التطبيق.",
  },
  {
    icon: Megaphone,
    title: "الإعلانات (Google AdMob)",
    body: "نستخدم خدمة AdMob من Google لعرض إعلانات (بانر وإعلانات بينية) بهدف دعم تطوير التطبيق. قد تجمع Google بيانات إعلانية وفق سياساتها الخاصة، مثل معرّف الإعلانات على جهازك. يمكنك مراجعة سياسة خصوصية Google وتخصيص الإعلانات من إعدادات حسابك لدى Google.",
  },
  {
    icon: UserX,
    title: "لا نجمع بيانات شخصية حساسة",
    body: "لا يتطلب التطبيق تسجيل حساب، ولا نجمع الاسم أو البريد الإلكتروني أو رقم الهاتف أو الموقع الجغرافي. المعرّف الوحيد المستخدم هو معرّف عشوائي يُنشأ محلياً على جهازك لربط سجل التحميلات به.",
  },
  {
    icon: ShieldCheck,
    title: "حقوق الملكية الفكرية",
    body: "التطبيق أداة للاستخدام الشخصي فقط وللمحتوى الذي تملكه أو لديك إذن صريح باستخدامه. جميع حقوق الفيديوهات والعلامات التجارية (بما فيها TikTok) تعود لأصحابها. هذا التطبيق مستقل وغير تابع أو معتمد من TikTok أو ByteDance. إذا كنت مالك حقوق وتريد الإبلاغ عن إساءة استخدام، تواصل معنا.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[640px] px-5 py-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] font-bold text-white/80 transition hover:bg-white/10"
      >
        <ArrowRight className="h-4 w-4" />
        رجوع للتطبيق
      </Link>

      <div className="mb-8">
        <p className="text-3xl font-black">
          سياسة <span className="text-brand-gradient">الخصوصية</span>
        </p>
        <p className="mt-2 text-[13px] text-white/50">
          آخر تحديث: يناير 2026 — تطبيق TokSaver
        </p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <section key={s.title} className="glass rounded-2xl p-5">
              <div className="mb-2.5 flex items-center gap-2.5">
                <Icon className="h-5 w-5 text-cyan-300" />
                <h2 className="text-[15px] font-black text-white/95">
                  {s.title}
                </h2>
              </div>
              <p className="text-[13px] leading-[1.9] text-white/55">{s.body}</p>
            </section>
          );
        })}
      </div>

      <section className="glass mt-4 rounded-2xl p-5">
        <h2 className="mb-2.5 text-[15px] font-black text-white/95">
          English Summary
        </h2>
        <p className="text-[12.5px] leading-[1.9] text-white/50" dir="ltr">
          TokSaver does not store user videos on its servers — files are
          streamed directly to your device. We display ads via Google AdMob,
          which may collect advertising identifiers per Google&apos;s own
          privacy policy. We do not collect sensitive personal data: no
          accounts, names, emails, or location. Downloaded content must be
          owned by you or used with explicit permission, for personal use
          only. All trademarks and content rights belong to their respective
          owners. This app is independent and not affiliated with TikTok or
          ByteDance.
        </p>
      </section>

      <p className="mt-8 text-center text-[11px] text-white/30">
        TokSaver — للاستخدام الشخصي فقط
      </p>
    </div>
  );
}
