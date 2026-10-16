import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TokSaver — تحميل فيديوهات TikTok بدون علامة مائية",
  description:
    "حمّل فيديوهات TikTok بجودة HD وبدون علامة مائية، أو استخرج الصوت MP3 — للاستخدام الشخصي والمحتوى الذي تملك حقوقه فقط.",
  applicationName: "TokSaver",
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="stage-bg antialiased">{children}</body>
    </html>
  );
}
