# TokSaver — تحميل فيديوهات TikTok بدون علامة مائية

تطبيق Android أصلي (Next.js + Capacitor) مع Backend API يعمل على Vercel.

## المعمارية (مهم)

```
نفس الـ repo — وضعان للبناء:
┌─────────────────────────────────────────────────────────┐
│ 1) الوضع العادي (افتراضي)                                │
│    next build → API Routes تعمل (force-dynamic)          │
│    انشره على Vercel = هذا هو الـ Backend                 │
│                                                         │
│ 2) وضع الموبايل (CAPACITOR_BUILD=true)                   │
│    output: "export" → مجلد out/ ثابت بدون أي API          │
│    الـ workflow ينقل src/app/api خارجاً قبل البناء         │
│    npx cap sync android → Gradle → APK/AAB موقّع         │
└─────────────────────────────────────────────────────────┘
```

- **ممنوع** أي `server.url` في `capacitor.config.ts`.
- **ممنوع** أي fetch برابط يبدأ بـ `/` في كود الموبايل — كل الطلبات تبدأ بـ
  `${API_BASE_URL}/api/...` عبر `getApiBaseUrl()` في `src/lib/config.ts`.
- رابط الـ API يُحقن وقت البناء من GitHub Secret باسم `API_BASE_URL`.

## المتغيرات

| المتغير | أين | الوصف |
|---|---|---|
| `DATABASE_URL` | Vercel / محلي | PostgreSQL لسجل التحميلات |
| `NEXT_PUBLIC_API_BASE_URL` | GitHub Secret `API_BASE_URL` | رابط الـ Backend بدون `/` أخيرة |
| `NEXT_PUBLIC_ADMOB_BANNER_ID` | اختياري | بانر AdMob (اختباري افتراضياً) |
| `NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID` | اختياري | بيني AdMob (اختباري افتراضياً) |
| `CAPACITOR_BUILD=true` | CI فقط | تفعيل Static Export |

## بناء APK / AAB

ادفع على `main` أو شغّل الـ workflow يدوياً — ملف
`.github/workflows/build-android.yml` يقوم بكل شيء: البناء الثابت، cap sync،
التوقيع من Secrets (`KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`,
`KEY_PASSWORD`)، ورفع APK + AAB كـ Artifacts.

> **Google Play يتطلب AAB.** وزّد `versionCode` في كل رفعة (في
> `android/app/build.gradle` بعد أول `cap add android`).

## قواعد الكود المفروضة

- كل API Route: `OPTIONS` handler + `corsHeaders` في كل Response + فحص صريح للرابط + try/catch شامل.
- كل ViewModel: Optional Chaining (`?.`) عند قراءة أي state خارجي + تحذير `console.error` عند غياب `API_BASE_URL`.
- `AppShell` يحتوي Mounted State Guard (لا UI قبل `mounted`).
- الإعلان البيني: بعد كل **3** تحميلات ناجحة فقط + 90 ثانية كحد أدنى.
- **لا تستخدم معرّفات AdMob حقيقية أثناء التطوير.**

## تنويه قانوني

للاستخدام الشخصي فقط وللمحتوى الذي تملكه أو لديك إذن به. التطبيق مستقل وغير
تابع لـ TikTok/ByteDance. تطبيقات هذه الفئة قد تُرفض من Google Play لأسباب
تتعلق بالملكية الفكرية — راجع `src/app/privacy`.
