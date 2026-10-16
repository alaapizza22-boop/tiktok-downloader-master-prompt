import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
  text,
} from "drizzle-orm/pg-core";

/**
 * سجل التحميلات لكل جهاز.
 * ملاحظة خصوصية: لا نخزّن أي ملفات فيديو على السيرفر — فقط بيانات
 * وصفية (عنوان، صاحب الفيديو، رابط المصدر) لعرضها في شاشة "تحميلاتي".
 */
export const downloads = pgTable(
  "downloads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deviceId: varchar("device_id", { length: 64 }).notNull(),
    videoId: varchar("video_id", { length: 32 }).notNull(),
    url: text("url").notNull(),
    title: text("title").notNull().default(""),
    authorName: varchar("author_name", { length: 180 }).notNull().default(""),
    authorUsername: varchar("author_username", { length: 180 })
      .notNull()
      .default(""),
    cover: text("cover").notNull().default(""),
    quality: varchar("quality", { length: 16 }).notNull().default("hd"),
    durationSec: integer("duration_sec").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("downloads_device_created_idx").on(t.deviceId, t.createdAt)]
);
