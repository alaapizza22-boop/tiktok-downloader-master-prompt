import { corsJson, corsPreflight } from "@/lib/cors";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { extractTikTokUrl } from "@/lib/validation";
import { ExtractError, extractTikTokVideo } from "@/data/tiktok/extractor";
import type { AnalyzeResponse } from "@/data/types";

/**
 * POST /api/analyze
 * Body: { url: string }
 * يعيد بيانات الفيديو + روابط التحميل (بدون علامة / HD / MP3).
 */
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  return corsJson({
    ok: true,
    service: "toksaver-analyze",
    usage: "POST { url: string }",
  });
}

function fail(status: number, code: string, message: string): Response {
  const body: AnalyzeResponse = { ok: false, error: { code, message } };
  return corsJson(body, { status });
}

export async function POST(req: Request) {
  // Rate limit: 30 تحليل / دقيقة لكل IP
  const rl = rateLimit(`analyze:${clientIp(req)}`, 30, 60_000);
  if (!rl.allowed) {
    return fail(
      429,
      "RATE_LIMITED",
      `طلبات كثيرة جداً — حاول بعد ${rl.retryAfterSec} ثانية`
    );
  }

  try {
    // قراءة آمنة للـ body
    const body = (await req.json().catch(() => null)) as {
      url?: unknown;
    } | null;
    const rawUrl = typeof body?.url === "string" ? body.url : "";

    // فحص صريح لصحة الرابط قبل أي معالجة (قاعدة إلزامية)
    const check = extractTikTokUrl(rawUrl);
    if (!check.ok) {
      return fail(400, check.code, check.message);
    }

    const video = await extractTikTokVideo(check.url);

    const body2: AnalyzeResponse = { ok: true, data: video };
    return corsJson(body2, { status: 200 });
  } catch (err) {
    // معالجة شاملة برسالة واضحة بدل رمي exception عام
    if (err instanceof ExtractError) {
      const msg =
        err.code === "NO_MEDIA"
          ? "لم نتمكن من إيجاد رابط تحميل لهذا الفيديو — جرّب رابطاً آخر"
          : err.code === "UPSTREAM"
            ? "خدمة التحميل مشغولة حالياً — حاول مرة أخرى بعد لحظات"
            : "تعذّر تحليل الفيديو — تأكد أن الفيديو عام وليس خاصاً";
      const status = err.code === "UPSTREAM" ? 502 : 422;
      return fail(status, err.code, msg);
    }
    console.error("[/api/analyze] unexpected:", err);
    return fail(
      500,
      "INTERNAL",
      "حدث خطأ غير متوقع في الخادم — حاول مرة أخرى"
    );
  }
}
