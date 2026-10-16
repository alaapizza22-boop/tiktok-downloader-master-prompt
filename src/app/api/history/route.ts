import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { downloads } from "@/db/schema";
import { corsJson, corsPreflight } from "@/lib/cors";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import type { DownloadHistoryItem, DownloadKind } from "@/data/types";

/**
 * سجل التحميلات لكل جهاز:
 *   GET    /api/history        (header: X-Device-Id)  -> قائمة آخر 50
 *   POST   /api/history        (header + body meta)   -> إضافة عنصر
 *   DELETE /api/history?id=..  (header)               -> حذف عنصر / الكل
 */
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsPreflight();
}

function deviceIdOf(req: Request): string {
  return (req.headers.get("x-device-id") ?? "").trim().slice(0, 64);
}

function fail(status: number, code: string, message: string): Response {
  return corsJson({ ok: false, error: { code, message } }, { status });
}

function toItem(row: typeof downloads.$inferSelect): DownloadHistoryItem {
  return {
    id: row.id,
    videoId: row.videoId,
    url: row.url,
    title: row.title,
    authorName: row.authorName,
    authorUsername: row.authorUsername,
    cover: row.cover,
    quality: row.quality as DownloadKind,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const deviceId = deviceIdOf(req);
    if (!deviceId) return fail(400, "NO_DEVICE", "معرّف الجهاز مفقود");

    const rows = await db
      .select()
      .from(downloads)
      .where(eq(downloads.deviceId, deviceId))
      .orderBy(desc(downloads.createdAt))
      .limit(50);

    return corsJson({ ok: true, data: rows.map(toItem) });
  } catch (err) {
    console.error("[/api/history GET]", err);
    return fail(500, "INTERNAL", "تعذّر جلب السجل — حاول لاحقاً");
  }
}

export async function POST(req: Request) {
  const rl = rateLimit(`history:${clientIp(req)}`, 60, 60_000);
  if (!rl.allowed) return fail(429, "RATE_LIMITED", "طلبات كثيرة جداً");

  try {
    const deviceId = deviceIdOf(req);
    if (!deviceId) return fail(400, "NO_DEVICE", "معرّف الجهاز مفقود");

    const body = (await req.json().catch(() => null)) as Partial<{
      videoId: string;
      url: string;
      title: string;
      authorName: string;
      authorUsername: string;
      cover: string;
      quality: DownloadKind;
      durationSec: number;
    }> | null;

    const videoId = (body?.videoId ?? "").trim();
    const url = (body?.url ?? "").trim();
    if (!videoId || !url) {
      return fail(400, "BAD_INPUT", "بيانات العنصر غير مكتملة");
    }

    const [row] = await db
      .insert(downloads)
      .values({
        deviceId,
        videoId,
        url,
        title: (body?.title ?? "").slice(0, 500),
        authorName: (body?.authorName ?? "").slice(0, 180),
        authorUsername: (body?.authorUsername ?? "").slice(0, 180),
        cover: (body?.cover ?? "").slice(0, 1000),
        quality: (body?.quality ?? "hd") as string,
        durationSec:
          typeof body?.durationSec === "number" ? body.durationSec : 0,
      })
      .returning();

    return corsJson({ ok: true, data: row ? toItem(row) : null }, { status: 201 });
  } catch (err) {
    console.error("[/api/history POST]", err);
    return fail(500, "INTERNAL", "تعذّر حفظ العنصر — حاول لاحقاً");
  }
}

export async function DELETE(req: Request) {
  try {
    const deviceId = deviceIdOf(req);
    if (!deviceId) return fail(400, "NO_DEVICE", "معرّف الجهاز مفقود");

    const id = new URL(req.url).searchParams.get("id");
    if (id) {
      await db.delete(downloads).where(eq(downloads.id, id));
    } else {
      await db.delete(downloads).where(eq(downloads.deviceId, deviceId));
    }
    return corsJson({ ok: true, data: true });
  } catch (err) {
    console.error("[/api/history DELETE]", err);
    return fail(500, "INTERNAL", "تعذّر الحذف — حاول لاحقاً");
  }
}
