import { mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { requireAdmin } from "./lib/authz";

export const seedAll = mutation({
  args: {},
  handler: async (context) => {
    await requireAdmin(context);

    await context.runMutation(api.courses.seedCourses, {});
    await context.runMutation(api.quizzes.seedQuizzesForAll, {});

    const courses = await context.db.query("courses").collect();
    let questionCount = 0;
    for (const course of courses) {
      const result = await context.runMutation(api.questions.seedForCourse, {
        courseId: course.courseId,
        courseCategory: course.category,
      });
      questionCount += (result as { seeded?: number }).seeded ?? 0;
    }

    return { courses: courses.length, questions: questionCount };
  },
});
