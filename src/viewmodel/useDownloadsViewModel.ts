"use client";

import { useCallback, useEffect, useState } from "react";
import { requireApiBaseUrl } from "@/lib/config";
import { getDeviceId } from "@/lib/device";
import type {
  DownloadHistoryItem,
  DownloadKind,
  HistoryResponse,
  VideoMeta,
} from "@/data/types";

/**
 * سجل التحميلات — يجلب من الـ API ويحتفظ بنسخة محلية (Fallback)
 * حتى تبقى الشاشة تعمل عند انقطاع الشبكة.
 * كل fetch برابط مطلق `${API_BASE_URL}/api/history` — ممنوع Relative.
 */

const CACHE_KEY = "toksaver:history-cache";

function readCache(): DownloadHistoryItem[] {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? (parsed as DownloadHistoryItem[]) : [];
  } catch {
    return [];
  }
}

function writeCache(items: DownloadHistoryItem[]): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

export function useDownloadsViewModel() {
  const [items, setItems] = useState<DownloadHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    const base = requireApiBaseUrl("useDownloadsViewModel.refresh");
    if (!base) {
      setError("رابط الخادم (API) غير مضبوط");
      setItems(readCache());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${base}/api/history`, {
        method: "GET",
        headers: { "X-Device-Id": getDeviceId() },
      });
      const json = (await res
        .json()
        .catch(() => null)) as HistoryResponse | null;

      if (!json?.ok) {
        throw new Error(json?.ok === false ? json?.error?.message : undefined);
      }
      const list = Array.isArray(json?.data) ? json.data : [];
      setItems(list);
      writeCache(list);
    } catch (err) {
      console.warn("[downloads] refresh failed, using cache:", err);
      setItems(readCache());
      setError("تعذّر تحديث السجل — يتم عرض نسخة محفوظة");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (
      video: VideoMeta | null | undefined,
      kind: DownloadKind
    ): Promise<void> => {
      if (!video) return;
      const base = requireApiBaseUrl("useDownloadsViewModel.add");
      if (!base) return;

      // إضافة متفائلة فورية
      const optimistic: DownloadHistoryItem = {
        id: `local-${Date.now()}`,
        videoId: video?.id ?? "",
        url: video?.sourceUrl ?? "",
        title: video?.title ?? "",
        authorName: video?.authorName ?? "",
        authorUsername: video?.authorUsername ?? "",
        cover: video?.cover ?? "",
        quality: kind,
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => {
        const next = [optimistic, ...prev].slice(0, 50);
        writeCache(next);
        return next;
      });

      try {
        await fetch(`${base}/api/history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Device-Id": getDeviceId(),
          },
          body: JSON.stringify({
            videoId: video?.id ?? "",
            url: video?.sourceUrl ?? "",
            title: video?.title ?? "",
            authorName: video?.authorName ?? "",
            authorUsername: video?.authorUsername ?? "",
            cover: video?.cover ?? "",
            quality: kind,
            durationSec: video?.durationSec ?? 0,
          }),
        });
        // تحديث صامت للحصول على الـ IDs الحقيقية
        void refresh();
      } catch (err) {
        console.warn("[downloads] add failed:", err);
      }
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      setItems((prev) => {
        const next = prev.filter((it) => it?.id !== id);
        writeCache(next);
        return next;
      });
      const base = requireApiBaseUrl("useDownloadsViewModel.remove");
      if (!base || id.startsWith("local-")) return;
      try {
        await fetch(`${base}/api/history?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { "X-Device-Id": getDeviceId() },
        });
      } catch (err) {
        console.warn("[downloads] remove failed:", err);
      }
    },
    []
  );

  const clearAll = useCallback(async (): Promise<void> => {
    setItems(() => {
      writeCache([]);
      return [];
    });
    const base = requireApiBaseUrl("useDownloadsViewModel.clearAll");
    if (!base) return;
    try {
      await fetch(`${base}/api/history`, {
        method: "DELETE",
        headers: { "X-Device-Id": getDeviceId() },
      });
    } catch (err) {
      console.warn("[downloads] clear failed:", err);
    }
  }, []);

  return { items, loading, error, refresh, add, remove, clearAll };
}
