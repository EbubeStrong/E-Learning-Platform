import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

export const seedAll = mutation({
  args: { adminUserId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminUserId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: admin only");
    }

    await ctx.runMutation(api.courses.seedCourses, {});
    await ctx.runMutation(api.quizzes.seedQuizzesForAll, {});

    const courses = await ctx.db.query("courses").collect();
    let questionCount = 0;
    for (const course of courses) {
      const res = await ctx.runMutation(api.questions.seedForCourse, {
        courseId: course.courseId,
        courseCategory: course.category,
      });
      questionCount += (res as { seeded?: number }).seeded ?? 0;
    }

    return { courses: courses.length, questions: questionCount };
  },
});
