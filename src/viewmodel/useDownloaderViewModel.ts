"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requireApiBaseUrl } from "@/lib/config";
import type { DownloadKind, VideoMeta } from "@/data/types";

/**
 * ============================================================
 *  useDownloaderViewModel
 *  - تحميل متدفق مع شريط تقدّم حقيقي (ReadableStream).
 *  - لا يوجد fetch برابط نسبي — دائماً ${API_BASE_URL}/api/...
 *  - Optional Chaining (?.) في كل قراءة.
 *  - retry() يعيد تنفيذ آخر تحميل فعلياً.
 *  - الحفظ: Capacitor Filesystem على الموبايل / <a download> على الويب.
 * ============================================================
 */

export type DownloadStatus = "idle" | "working" | "done" | "error";

export interface DownloadError {
  message: string;
  code?: string;
}

interface DownloadSuccessPayload {
  meta: VideoMeta;
  kind: DownloadKind;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذّر تجهيز الملف"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.split(",")[1] ?? "");
    };
    reader.readAsDataURL(blob);
  });
}

/** حفظ الملف: على Native عبر Filesystem، وعلى الويب عبر رابط تنزيل */
async function saveBlob(blob: Blob, filename: string): Promise<"native" | "web"> {
  const cap = (
    window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean };
    }
  ).Capacitor;
  const isNative = Boolean(cap?.isNativePlatform?.());

  if (isNative) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const base64 = await blobToBase64(blob);
      await Filesystem.writeFile({
        path: `TokSaver/${filename}`,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });
      return "native";
    } catch (err) {
      console.warn("[downloader] native save failed, fallback to web:", err);
      // نكمل للحفظ عبر الويب بدلاً من الفشل
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "web";
}

export function useDownloaderViewModel(options?: {
  onSuccess?: (payload: DownloadSuccessPayload) => void;
}) {
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<DownloadError | null>(null);
  const [activeKind, setActiveKind] = useState<DownloadKind | null>(null);
  const [savedTo, setSavedTo] = useState<"native" | "web" | null>(null);

  const lastJobRef = useRef<{ video: VideoMeta; kind: DownloadKind } | null>(
    null
  );
  const onSuccessRef = useRef(options?.onSuccess);
  useEffect(() => {
    onSuccessRef.current = options?.onSuccess;
  }, [options?.onSuccess]);

  const start = useCallback(
    async (
      video: VideoMeta | null | undefined,
      kind: DownloadKind
    ): Promise<boolean> => {
      if (!video) {
        setError({ message: "ابحث عن فيديو أولاً قبل التحميل" });
        setStatus("error");
        return false;
      }

      const base = requireApiBaseUrl("useDownloaderViewModel.start");
      if (!base) {
        setError({
          message: "إعدادات التطبيق غير مكتملة — رابط الخادم (API) مفقود",
          code: "NO_API_BASE",
        });
        setStatus("error");
        return false;
      }

      lastJobRef.current = { video, kind };
      setActiveKind(kind);
      setStatus("working");
      setProgress(0);
      setError(null);
      setSavedTo(null);

      try {
        // رابط مطلق دائماً — ممنوع Relative URL
        const sourceUrl = video?.sourceUrl ?? "";
        const url = `${base}/api/download?url=${encodeURIComponent(
          sourceUrl
        )}&type=${kind}`;

        const res = await fetch(url);
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as {
            ok?: boolean;
            error?: { message?: string };
          } | null;
          throw new Error(j?.error?.message ?? `تعذّر التحميل (${res.status})`);
        }

        const total = Number(res.headers.get("content-length") ?? 0) || 0;
        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error("متصفحك لا يدعم التحميل المتدفق");
        }

        const chunks: BlobPart[] = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value as BlobPart);
            received += value.byteLength;
            if (total > 0) {
              setProgress(Math.min(99, Math.round((received / total) * 100)));
            } else {
              setProgress((p) => Math.min(95, p + 3));
            }
          }
        }

        const blobType = kind === "mp3" ? "audio/mpeg" : "video/mp4";
        const blob = new Blob(chunks, { type: blobType });
        const safeId = (video?.id ?? "video").replace(/[^\w-]/g, "");
        const ext = kind === "mp3" ? "mp3" : "mp4";
        const filename = `toksaver-${safeId}-${kind}.${ext}`;

        const where = await saveBlob(blob, filename);

        setSavedTo(where);
        setProgress(100);
        setStatus("done");
        onSuccessRef.current?.({ meta: video, kind });
        return true;
      } catch (err) {
        const e = err as Error | null;
        setError({
          message: e?.message ?? "فشل التحميل — حاول مرة أخرى",
          code: "DOWNLOAD_FAILED",
        });
        setStatus("error");
        return false;
      }
    },
    []
  );

  /** يعيد تنفيذ آخر تحميل فعلياً — بنفس الفيديو ونفس النوع */
  const retry = useCallback((): Promise<boolean> => {
    const last = lastJobRef.current;
    if (!last) return Promise.resolve(false);
    return start(last.video, last.kind);
  }, [start]);

  const resetStatus = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setActiveKind(null);
    setSavedTo(null);
  }, []);

  return {
    status,
    progress,
    error,
    activeKind,
    savedTo,
    start,
    retry,
    resetStatus,
  };
}
