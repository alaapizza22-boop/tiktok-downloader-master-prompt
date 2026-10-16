/** أنواع التحميل المدعومة */
export type DownloadKind = "hd" | "nowm" | "wm" | "mp3";

export interface VideoLinks {
  /** فيديو بدون علامة مائية */
  noWatermark?: string;
  /** فيديو HD بدون علامة مائية (إن توفّر) */
  hd?: string;
  /** فيديو بالعلامة المائية الأصلية */
  watermark?: string;
  /** الصوت (MP3) */
  audio?: string;
}

export interface VideoMeta {
  id: string;
  /** الرابط الكامل بعد تتبّع الـ redirect */
  sourceUrl: string;
  title: string;
  authorName: string;
  authorUsername: string;
  avatar: string;
  cover: string;
  durationSec: number;
  links: VideoLinks;
  /** مصدر الاستخراج للتشخيص */
  engine: "tikwm" | "html";
}

export interface ApiErrorBody {
  code: string;
  message: string;
}

export type AnalyzeResponse =
  | { ok: true; data: VideoMeta }
  | { ok: false; error: ApiErrorBody };

export interface DownloadHistoryItem {
  id: string;
  videoId: string;
  url: string;
  title: string;
  authorName: string;
  authorUsername: string;
  cover: string;
  quality: DownloadKind;
  createdAt: string;
}

export type HistoryResponse =
  | { ok: true; data: DownloadHistoryItem[] }
  | { ok: false; error: ApiErrorBody };

/** أسماء عربية واضحة لكل نوع تحميل */
export const DOWNLOAD_KIND_LABEL: Record<DownloadKind, string> = {
  hd: "HD بدون علامة",
  nowm: "بدون علامة مائية",
  wm: "بالعلامة الأصلية",
  mp3: "صوت MP3",
};
