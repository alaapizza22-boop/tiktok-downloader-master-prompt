"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/config";

/**
 * إعدادات التطبيق — محفوظة محلياً على الجهاز فقط.
 */

export interface AppSettings {
  /** إظهار مساحة البانر التجريبية في وضع الويب/المعاينة */
  showWebAdPlaceholder: boolean;
  /** اختيار HD تلقائياً بعد التحليل */
  preferHd: boolean;
}

const SETTINGS_KEY = "toksaver:settings";

const DEFAULT_SETTINGS: AppSettings = {
  showWebAdPlaceholder: true,
  preferHd: true,
};

export const APP_VERSION = "1.0.0";

export function useSettingsViewModel() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings> | null;
        setSettings({
          showWebAdPlaceholder:
            parsed?.showWebAdPlaceholder ??
            DEFAULT_SETTINGS.showWebAdPlaceholder,
          preferHd: parsed?.preferHd ?? DEFAULT_SETTINGS.preferHd,
        });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const apiBaseUrl = getApiBaseUrl();
  const isCustomApi = Boolean(
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  );

  return {
    settings,
    hydrated,
    update,
    apiBaseUrl,
    isCustomApi,
    version: APP_VERSION,
  };
}
