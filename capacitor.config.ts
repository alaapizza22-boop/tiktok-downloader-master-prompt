import type { CapacitorConfig } from "@capacitor/cli";

/**
 * ⚠️ قاعدة إلزامية:
 * ممنوع منعاً باتاً إضافة أي `server.url` هنا (لا localhost ولا IP).
 * التطبيق يعمل بالكامل من الملفات الثابتة داخل out/ (bundled offline)،
 * ويتصل بالـ Backend على Vercel فقط عبر NEXT_PUBLIC_API_BASE_URL
 * المحقون وقت البناء داخل GitHub Actions.
 */
const config: CapacitorConfig = {
  appId: "com.toksaver.app",
  appName: "TokSaver",
  webDir: "out",
  // ملاحظة: bundledWebRuntime أزيلت من Capacitor الحديث — لا runtime خارجي إطلاقاً.
  android: {
    allowMixedContent: false,
  },
};

export default config;
