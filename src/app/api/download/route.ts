import { corsJson, corsPreflight, corsHeaders } from "@/lib/cors";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { extractTikTokUrl } from "@/lib/validation";
import { ExtractError, extractTikTokVideo } from "@/data/tiktok/extractor";
import type { DownloadKind } from "@/data/types";

/**
 * GET /api/download?url=...&type=hd|nowm|wm|mp3
 * يعيد بثّ ملف الفيديو/الصوت (Proxy Stream) مع Content-Disposition
 * ليبدأ التحميل مباشرة على الجهاز.
 */
export const dynamic = "force-dynamic";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function OPTIONS() {
  return corsPreflight();
}

function fail(status: number, code: string, message: string): Response {
  return corsJson({ ok: false, error: { code, message } }, { status });
}

const VALID_KINDS: readonly DownloadKind[] = ["hd", "nowm", "wm", "mp3"];

export async function GET(req: Request) {
  // Rate limit: 60 تحميل / دقيقة لكل IP
  const rl = rateLimit(`download:${clientIp(req)}`, 60, 60_000);
  if (!rl.allowed) {
    return fail(
      429,
      "RATE_LIMITED",
      `طلبات كثيرة جداً — حاول بعد ${rl.retryAfterSec} ثانية`
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const rawUrl = searchParams.get("url") ?? "";
    const kindParam = (searchParams.get("type") ?? "hd") as DownloadKind;

    // فحص صريح لصحة الرابط قبل أي معالجة
    const check = extractTikTokUrl(rawUrl);
    if (!check.ok) {
      return fail(400, check.code, check.message);
    }
    if (!VALID_KINDS.includes(kindParam)) {
      return fail(400, "BAD_KIND", "نوع التحميل غير معروف");
    }

    // إعادة الاستخراج للحصول على رابط وسائط طازج (روابط CDN تنتهي سريعاً)
    const video = await extractTikTokVideo(check.url);
    const links = video?.links ?? {};

    const mediaUrl =
      kindParam === "hd"
        ? (links.hd ?? links.noWatermark ?? links.watermark)
        : kindParam === "nowm"
          ? (links.noWatermark ?? links.hd)
          : kindParam === "wm"
            ? links.watermark
            : links.audio;

    if (!mediaUrl) {
      return fail(
        404,
        "NO_MEDIA",
        kindParam === "mp3"
          ? "الصوت غير متاح لهذا الفيديو"
          : "هذه الجودة غير متاحة لهذا الفيديو — جرّب نوعاً آخر"
      );
    }

    // جلب الملف من CDN مع Headers متصفح حقيقية
    const upstream = await fetch(mediaUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": BROWSER_UA,
        Referer: "https://www.tiktok.com/",
        Accept: kindParam === "mp3" ? "audio/*,*/*" : "video/*,*/*",
      },
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      return fail(
        502,
        "UPSTREAM",
        `تعذّر جلب الملف من المصدر (${upstream.status}) — حاول لاحقاً`
      );
    }

    const isAudio = kindParam === "mp3";
    const ext = isAudio ? "mp3" : "mp4";
    const safeId = (video?.id ?? "video").replace(/[^\w-]/g, "");
    const filename = `toksaver-${safeId}-${kindParam}.${ext}`;

    const headers: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": isAudio
        ? "audio/mpeg"
        : (upstream.headers.get("content-type") ?? "video/mp4"),
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };
    const len = upstream.headers.get("content-length");
    if (len) headers["Content-Length"] = len;

    // بثّ مباشر بدون تخزين الملف على السيرفر (متطلب خصوصية)
    return new Response(upstream.body, { status: 200, headers });
  } catch (err) {
    if (err instanceof ExtractError) {
      return fail(
        422,
        err.code,
        "تعذّر تجهيز رابط التحميل — حاول مرة أخرى بعد لحظات"
      );
    }
    console.error("[/api/download] unexpected:", err);
    return fail(
      500,
      "INTERNAL",
      "حدث خطأ غير متوقع أثناء التحميل — حاول مرة أخرى"
    );
  }
}
