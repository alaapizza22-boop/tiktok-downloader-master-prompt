import { isShortTikTokUrl } from "@/lib/validation";
import type { VideoLinks, VideoMeta } from "@/data/types";

/**
 * ============================================================
 *  محرك استخراج فيديو TikTok
 *  - استراتيجية A: خدمة TikWM العامة (تعيد روابط بدون علامة + HD + MP3)
 *  - استراتيجية B: قراءة HTML لصفحة الفيديو وتحليل JSON المدمج
 *  - كل قراءة لأي بيانات خارجية تتم عبر Optional Chaining (?.)
 * ============================================================
 */

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export class ExtractError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/** تتبّع الروابط المختصرة vt.tiktok.com / vm.tiktok.com للوصول للرابط الكامل */
export async function resolveTikTokUrl(url: string): Promise<string> {
  if (!isShortTikTokUrl(url)) return url;
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": BROWSER_UA },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    // res.url = الرابط النهائي بعد كل الـ redirects
    if (res?.url && res.url.includes("tiktok.com")) return res.url;
  } catch (err) {
    console.warn("[extractor] short-link resolve failed, using original:", err);
  }
  return url;
}

export function extractVideoId(url: string): string | null {
  const m = url.match(/\/(?:video|photo)\/(\d{6,25})/);
  return m?.[1] ?? null;
}

/** بعض روابط TikWM ترجع نسبية — نحوّلها لمطلقة */
function absolutize(path: string | undefined | null): string | undefined {
  const p = (path ?? "").trim();
  if (!p) return undefined;
  if (p.startsWith("http")) return p;
  return `https://www.tikwm.com${p.startsWith("/") ? "" : "/"}${p}`;
}

/* ------------------------- استراتيجية A: TikWM ------------------------- */

interface TikwmData {
  id?: string;
  title?: string;
  cover?: string;
  duration?: number;
  play?: string;
  wmplay?: string;
  hdplay?: string;
  music?: string;
  author?: { nickname?: string; unique_id?: string; avatar?: string };
}

interface TikwmResponse {
  code?: number;
  msg?: string;
  data?: TikwmData;
}

async function fromTikwm(sourceUrl: string): Promise<VideoMeta> {
  const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(
    sourceUrl
  )}&hd=1`;

  const res = await fetch(api, {
    method: "GET",
    headers: { "User-Agent": BROWSER_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new ExtractError("UPSTREAM", `TikWM status ${res.status}`);
  }

  const json = (await res.json().catch(() => null)) as TikwmResponse | null;

  if (!json || json.code !== 0 || !json.data) {
    throw new ExtractError(
      "EXTRACT_FAILED",
      json?.msg || "TikWM returned invalid payload"
    );
  }

  const d = json.data;
  const links: VideoLinks = {
    noWatermark: absolutize(d?.play),
    hd: absolutize(d?.hdplay) ?? absolutize(d?.play),
    watermark: absolutize(d?.wmplay),
    audio: absolutize(d?.music),
  };

  if (!links.noWatermark && !links.watermark) {
    throw new ExtractError("NO_MEDIA", "No downloadable media links found");
  }

  return {
    id: d?.id ?? extractVideoId(sourceUrl) ?? String(Date.now()),
    sourceUrl,
    title: (d?.title ?? "").trim() || "فيديو TikTok",
    authorName: d?.author?.nickname ?? "",
    authorUsername: d?.author?.unique_id ?? "",
    avatar: absolutize(d?.author?.avatar) ?? "",
    cover: absolutize(d?.cover) ?? "",
    durationSec: typeof d?.duration === "number" ? d.duration : 0,
    links,
    engine: "tikwm",
  };
}

/* -------------------- استراتيجية B: تحليل HTML المباشر -------------------- */

interface TikTokItemStruct {
  id?: string;
  desc?: string;
  video?: {
    cover?: string;
    originCover?: string;
    playAddr?: string;
    downloadAddr?: string;
    duration?: number;
  };
  music?: { playUrl?: string; title?: string };
  author?: { nickname?: string; uniqueId?: string; avatarLarger?: string };
}

function metaFromItem(item: TikTokItemStruct, sourceUrl: string): VideoMeta {
  const links: VideoLinks = {
    // روابط الصفحة الرسمية تحمل العلامة المائية عادةً
    watermark: item?.video?.downloadAddr ?? item?.video?.playAddr,
    audio: item?.music?.playUrl,
  };
  return {
    id: item?.id ?? extractVideoId(sourceUrl) ?? String(Date.now()),
    sourceUrl,
    title: (item?.desc ?? "").trim() || "فيديو TikTok",
    authorName: item?.author?.nickname ?? "",
    authorUsername: item?.author?.uniqueId ?? "",
    avatar: item?.author?.avatarLarger ?? "",
    cover: item?.video?.originCover ?? item?.video?.cover ?? "",
    durationSec:
      typeof item?.video?.duration === "number" ? item.video.duration : 0,
    links,
    engine: "html",
  };
}

async function fromHtml(sourceUrl: string): Promise<VideoMeta> {
  const res = await fetch(sourceUrl, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": BROWSER_UA,
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new ExtractError("UPSTREAM", `TikTok page status ${res.status}`);
  }

  const html = await res.text();

  // 1) البيانات الموحّدة الحديثة
  const universal = html.match(
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (universal?.[1]) {
    try {
      const parsed = JSON.parse(universal[1]) as Record<string, unknown>;
      const scope = parsed?.["__DEFAULT_SCOPE__"] as
        | Record<string, unknown>
        | undefined;
      const detail = scope?.["webapp.video-detail"] as
        | { itemInfo?: { itemStruct?: TikTokItemStruct } }
        | undefined;
      const item = detail?.itemInfo?.itemStruct;
      if (item?.video?.playAddr || item?.video?.downloadAddr) {
        return metaFromItem(item, sourceUrl);
      }
    } catch (err) {
      console.warn("[extractor] universal data parse failed:", err);
    }
  }

  // 2) SIGI_STATE القديم
  const sigi = html.match(
    /<script id="SIGI_STATE" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (sigi?.[1]) {
    try {
      const parsed = JSON.parse(sigi[1]) as {
        ItemModule?: Record<string, TikTokItemStruct>;
      };
      const first = Object.values(parsed?.ItemModule ?? {})[0];
      if (first?.video?.playAddr || first?.video?.downloadAddr) {
        return metaFromItem(first, sourceUrl);
      }
    } catch (err) {
      console.warn("[extractor] SIGI_STATE parse failed:", err);
    }
  }

  throw new ExtractError(
    "EXTRACT_FAILED",
    "Could not locate video data in TikTok page"
  );
}

/* ------------------------------ الواجهة الموحّدة ------------------------------ */

export async function extractTikTokVideo(rawUrl: string): Promise<VideoMeta> {
  const sourceUrl = await resolveTikTokUrl(rawUrl);

  try {
    return await fromTikwm(sourceUrl);
  } catch (err) {
    console.warn(
      "[extractor] tikwm engine failed, falling back to html:",
      err instanceof Error ? err.message : err
    );
  }

  return fromHtml(sourceUrl);
}
