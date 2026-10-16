"use client";

import { useCallback, useRef, useState } from "react";
import { requireApiBaseUrl } from "@/lib/config";
import { extractTikTokUrl } from "@/lib/validation";
import type { AnalyzeResponse, VideoMeta } from "@/data/types";

/**
 * ============================================================
 *  useAnalyzerViewModel — قواعد إلزامية مطبّقة:
 *  1) Optional Chaining (?.) في كل قراءة لبيانات خارجية.
 *  2) لا يوجد fetch برابط يبدأ بـ "/" — دائماً ${API_BASE_URL}/api/...
 *  3) التحقق من API_BASE_URL في بداية الـ hook + console.error عند الغياب.
 *  4) تحقق محلي صارم من الرابط قبل إرساله للسيرفر.
 *  5) retry() يعيد تنفيذ آخر عملية فعلياً — وليس reload.
 * ============================================================
 */

export type AnalyzerStatus = "idle" | "loading" | "success" | "error";

export interface AnalyzerError {
  message: string;
  code?: string;
}

export function useAnalyzerViewModel() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<AnalyzerStatus>("idle");
  const [video, setVideo] = useState<VideoMeta | null>(null);
  const [error, setError] = useState<AnalyzerError | null>(null);

  const lastUrlRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);

  /** فحص فوري أثناء الكتابة — بدون أي طلب شبكة */
  const localCheck = useCallback((raw?: string) => {
    return extractTikTokUrl(raw ?? input);
  }, [input]);

  const analyze = useCallback(
    async (raw?: string): Promise<boolean> => {
      const text = (raw ?? input).trim();

      // (4) تحقق محلي قبل أي إرسال
      const check = extractTikTokUrl(text);
      if (!check.ok) {
        setError({ message: check.message, code: check.code });
        setStatus("error");
        return false;
      }

      // (3) تحقق من رابط الـ API
      const base = requireApiBaseUrl("useAnalyzerViewModel.analyze");
      if (!base) {
        setError({
          message: "إعدادات التطبيق غير مكتملة — رابط الخادم (API) مفقود",
          code: "NO_API_BASE",
        });
        setStatus("error");
        return false;
      }

      // إلغاء أي طلب سابق
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), 25_000);

      lastUrlRef.current = check.url;
      setStatus("loading");
      setError(null);

      try {
        // (2) رابط مطلق دائماً — ممنوع Relative URL
        const res = await fetch(`${base}/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: check.url }),
          signal: controller.signal,
        });

        const json = (await res
          .json()
          .catch(() => null)) as AnalyzeResponse | null;

        if (!json) {
          throw new Error("استجابة غير مفهومة من الخادم — حاول مرة أخرى");
        }
        if (!json.ok) {
          // (1) Optional Chaining في قراءة الخطأ
          throw new Error(json?.error?.message ?? "تعذّر تحليل الفيديو");
        }
        if (!res.ok) {
          throw new Error(`خطأ من الخادم (${res.status})`);
        }

        setVideo(json?.data ?? null);
        setStatus("success");
        return true;
      } catch (err) {
        const e = err as Error | null;
        if (e?.name === "AbortError") {
          setError({
            message: "استغرق الطلب وقتاً طويلاً — تحقق من اتصالك بالإنترنت",
            code: "TIMEOUT",
          });
        } else {
          setError({
            message: e?.message ?? "حدث خطأ غير متوقع — حاول مرة أخرى",
            code: "UNKNOWN",
          });
        }
        setStatus("error");
        return false;
      } finally {
        clearTimeout(timeout);
      }
    },
    [input]
  );

  /** يعيد تنفيذ آخر تحليل فعلياً (آخر رابط ناجح الإدخال) */
  const retry = useCallback((): Promise<boolean> => {
    return analyze(lastUrlRef.current || input);
  }, [analyze, input]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setInput("");
    setStatus("idle");
    setVideo(null);
    setError(null);
  }, []);

  const pasteFromClipboard = useCallback(async (): Promise<string> => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInput(text);
      return text ?? "";
    } catch {
      setError({
        message: "تعذّر الوصول إلى الحافظة — الصق الرابط يدوياً",
        code: "CLIPBOARD",
      });
      return "";
    }
  }, []);

  return {
    input,
    setInput,
    status,
    video,
    error,
    analyze,
    retry,
    reset,
    localCheck,
    pasteFromClipboard,
  };
}
