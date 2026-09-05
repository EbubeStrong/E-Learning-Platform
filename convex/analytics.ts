import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import { ACTIVE_USER_WINDOW_MS } from "./constants";
import { requireAdmin } from "./lib/authz";

async function getCertificationAttempts(context: QueryCtx) {
  const attempts = await context.db
    .query("attempts")
    .filter((q) => q.eq(q.field("status"), "submitted"))
    .collect();
  return attempts.filter((attempt) => attempt.quizType === "certification");
}

/**
 * Admin KPI summary for the dashboard overview.
 */
export const adminOverview = query({
  args: {},
  handler: async (context) => {
    await requireAdmin(context);

    const [users, certAttempts, certs] = await Promise.all([
      context.db.query("users").collect(),
      getCertificationAttempts(context),
      context.db.query("certificates").collect(),
    ]);

    const scores = certAttempts.map((attempt) => attempt.percent ?? 0);
    const taken = certAttempts.length;
    const avg = taken ? Math.round(scores.reduce((total, percent) => total + percent, 0) / taken) : 0;
    const passed = certAttempts.filter(
      (attempt) => (attempt.percent ?? 0) >= (attempt.passThreshold ?? 0)
    ).length;

    const activeSince = Date.now() - ACTIVE_USER_WINDOW_MS;
    const activeUsers = users.filter(
      (user) => (user.lastActiveAt ?? 0) >= activeSince
    ).length;

    return {
      totalUsers: users.length,
      totalAttempts: taken,
      averageScore: avg,
      passRate: taken ? Math.round((passed / taken) * 100) : 0,
      certificatesIssued: certs.length,
      activeUsers,
    };
  },
});

/**
 * Per-course certification performance for the admin dashboard.
 */
export const perCoursePerformance = query({
  args: {},
  handler: async (context) => {
    await requireAdmin(context);

    const certAttempts = await getCertificationAttempts(context);

    const byCourse = new Map<string, { total: number; count: number; passed: number }>();
    for (const attempt of certAttempts) {
      const aggregate = byCourse.get(attempt.courseId) ?? { total: 0, count: 0, passed: 0 };
      aggregate.total += attempt.percent ?? 0;
      aggregate.count += 1;
      if ((attempt.percent ?? 0) >= (attempt.passThreshold ?? 0)) aggregate.passed += 1;
      byCourse.set(attempt.courseId, aggregate);
    }

    const courses = await context.db.query("courses").collect();
    const titleByCourseId = new Map(courses.map((course) => [course.courseId, course.title]));

    return Array.from(byCourse.entries()).map(([courseId, aggregate]) => ({
      courseId,
      courseTitle: titleByCourseId.get(courseId) ?? courseId,
      attempts: aggregate.count,
      average: aggregate.count ? Math.round(aggregate.total / aggregate.count) : 0,
      passRate: aggregate.count ? Math.round((aggregate.passed / aggregate.count) * 100) : 0,
    }));
  },
});

/**
 * Admin leaderboard over the same certification-only dataset as the public
 * student leaderboard, but with richer management detail (best score +
 * certificates earned per student).
 */
export const adminLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (context, payload) => {
    await requireAdmin(context);

    const certAttempts = await getCertificationAttempts(context);

    const byUser = new Map<
      string,
      { total: number; count: number; best: number }
    >();
    for (const attempt of certAttempts) {
      const key = String(attempt.userId);
      const aggregate = byUser.get(key) ?? { total: 0, count: 0, best: 0 };
      aggregate.count += 1;
      aggregate.total += attempt.percent ?? 0;
      aggregate.best = Math.max(aggregate.best, attempt.percent ?? 0);
      byUser.set(key, aggregate);
    }

    const [users, certificates] = await Promise.all([
      context.db.query("users").collect(),
      context.db.query("certificates").collect(),
    ]);
    const userByKey = new Map(users.map((user) => [String(user._id), user]));
    const certCountByUser = new Map<string, number>();
    for (const cert of certificates) {
      const key = String(cert.userId);
      certCountByUser.set(key, (certCountByUser.get(key) ?? 0) + 1);
    }

    const rows = Array.from(byUser.entries()).map(([userId, aggregate]) => {
      const user = userByKey.get(userId);
      return {
        userId,
        name: user?.name ?? "Anonymous",
        email: user?.email ?? "",
        avatar: user?.imageUrl,
        average: aggregate.count ? Math.round(aggregate.total / aggregate.count) : 0,
        best: aggregate.best,
        attempts: aggregate.count,
        certificates: certCountByUser.get(userId) ?? 0,
      };
    });

    rows.sort((rowA, rowB) => rowB.average - rowA.average || rowB.attempts - rowA.attempts);
    return rows.slice(0, payload.limit ?? 100);
  },
});
