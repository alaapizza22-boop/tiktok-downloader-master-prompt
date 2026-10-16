/**
 * التحقق من روابط TikTok — يُستخدم في الواجهة (قبل الإرسال)
 * وفي الـ API (قبل أي معالجة) حسب قواعد المشروع.
 */

export type UrlValidation =
  | { ok: true; url: string }
  | { ok: false; code: "EMPTY" | "NO_URL" | "NOT_TIKTOK"; message: string };

/** يلتقط أول رابط http(s) داخل نص المشاركة (غالباً فيه كلمات إضافية) */
const URL_RE = /https?:\/\/[^\s<>"'`|\\{}^،]+/i;

/** كل نطاقات تيك توك المعروفة للفيديوهات */
const TIKTOK_HOST_RE =
  /(^|\.)(tiktok\.com|tiktokv\.com|tiktokcdn\.com)$/i;

export function extractTikTokUrl(raw: string | null | undefined): UrlValidation {
  const input = (raw ?? "").trim();

  if (!input) {
    return {
      ok: false,
      code: "EMPTY",
      message: "الصق رابط الفيديو أولاً",
    };
  }

  const match = input.match(URL_RE);
  const candidate = match?.[0];

  if (!candidate) {
    return {
      ok: false,
      code: "NO_URL",
      message: "الرابط غير صالح، تأكد من نسخ رابط الفيديو كاملاً",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      ok: false,
      code: "NO_URL",
      message: "الرابط غير صالح، تأكد من نسخ رابط الفيديو كاملاً",
    };
  }

  if (!TIKTOK_HOST_RE.test(parsed.hostname)) {
    return {
      ok: false,
      code: "NOT_TIKTOK",
      message: "هذا ليس رابط TikTok — انسخ الرابط من زر المشاركة داخل تطبيق تيك توك",
    };
  }

  return { ok: true, url: candidate };
}

/** هل الرابط مختصر (vt/vm) ويحتاج تتبّع Redirect؟ */
export function isShortTikTokUrl(url: string): boolean {
  try {
    return /^(vt|vm)\.tiktok\.com$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}
