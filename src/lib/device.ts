const DEVICE_ID_KEY = "toksaver:device-id";

/**
 * معرّف ثابت لكل جهاز — يُستخدم لربط سجل التحميلات بالجهاز
 * بدون جمع أي بيانات شخصية.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = window.localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}
