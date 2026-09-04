import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function slugify(title: string, index: number): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return index === 0 ? slug : `${slug}-${index + 1}`;
}

/** Shape of a catalog course used to seed/enrich the Convex `courses` table. */
function courseInput() {
  return v.object({
    courseId: v.string(),
    playlistId: v.string(),
    title: v.string(),
    category: v.string(),
    level: v.string(),
    imageAlt: v.optional(v.string()),
    videoCount: v.optional(v.number()),
    thumbnail: v.optional(v.string()),
  });
}

export const seedCourses = mutation({
  args: { courses: v.optional(v.array(courseInput())) },
  handler: async (context, payload) => {
    const list = payload.courses;
    if (list && list.length > 0) {
      let inserted = 0;
      for (const course of list) {
        const existing = await context.db
          .query("courses")
          .filter((q) => q.eq(q.field("courseId"), course.courseId))
          .first();
        if (!existing) {
          await context.db.insert("courses", {
            courseId: course.courseId,
            playlistId: course.playlistId,
            title: course.title,
            category: course.category,
            level: course.level,
            imageAlt: course.imageAlt ?? `${course.title} course artwork`,
            videoCount: course.videoCount,
            thumbnail: course.thumbnail,
          });
          inserted++;
        }
      }
      return { inserted };
    }

    // Fallback placeholder seed (no catalog supplied) — keeps `seedAll` safe.
    const categories = ["Web Development", "UI/UX Design", "Machine Learning", "Data Analytics"];
    const counts: Record<string, number> = { "Web Development": 6, "UI/UX Design": 3, "Machine Learning": 3, "Data Analytics": 2 };
    let inserted = 0;
    for (const category of categories) {
      const count = counts[category];
      for (let i = 0; i < count; i++) {
        const courseId = slugify(category, i);
        const existing = await context.db
          .query("courses")
          .filter((q) => q.eq(q.field("courseId"), courseId))
          .first();
        if (!existing) {
          await context.db.insert("courses", {
            courseId,
            playlistId: "",
            title: category,
            category,
            level: category === "Web Development" || category === "UI/UX Design" ? "Beginner" : "Intermediate",
            imageAlt: `${category} course artwork`,
          });
          inserted++;
        }
      }
    }
    return { inserted };
  },
});

/**
 * Admin-only upsert of the enriched catalog (real playlist metadata from the
 * YouTube API) into the Convex `courses` table. Makes the DB the source of
 * truth for the admin course inventory while preserving real videoCounts and
 * thumbnails. Safe to re-run anytime — existing rows are patched.
 */
export const syncFromCatalog = mutation({
  args: { adminUserId: v.id("users"), courses: v.array(courseInput()) },
  handler: async (context, payload) => {
    const admin = await context.db.get(payload.adminUserId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: admin only");
    }

    for (const course of payload.courses) {
      const existing = await context.db
        .query("courses")
        .filter((q) => q.eq(q.field("courseId"), course.courseId))
        .first();

      const map = {
        playlistId: course.playlistId,
        title: course.title,
        category: course.category,
        level: course.level,
        imageAlt: course.imageAlt ?? `${course.title} course artwork`,
        videoCount: course.videoCount,
        thumbnail: course.thumbnail,
      };

      if (existing) {
        await context.db.patch(existing._id, map);
      } else {
        await context.db.insert("courses", {
          courseId: course.courseId,
          ...map,
        });
      }
    }

    return { synced: payload.courses.length };
  },
});

export const getAll = query({
  args: {},
  handler: async (context) => {
    return await context.db.query("courses").collect();
  },
});

export const get = query({
  args: { courseId: v.string() },
  handler: async (context, payload) => {
    return await context.db
      .query("courses")
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .first();
  },
});
