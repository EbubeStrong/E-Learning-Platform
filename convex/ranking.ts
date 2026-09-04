import { v } from "convex/values";
import { query } from "./_generated/server";
import { type Id } from "./_generated/dataModel";

export const leaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (context, payload) => {
    const attempts = await context.db
      .query("attempts")
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    const submissions = attempts.filter((attempt) => attempt.quizType === "certification");

    const byUser = new Map<string, { total: number; count: number; best: number; name: string; avatar: string | undefined }>();
    for (const attempt of submissions) {
      const aggregate = byUser.get(String(attempt.userId)) ?? {
        total: 0,
        count: 0,
        best: 0,
        name: "",
        avatar: undefined,
      };
      aggregate.count += 1;
      aggregate.total += attempt.percent ?? 0;
      aggregate.best = Math.max(aggregate.best, attempt.percent ?? 0);
      byUser.set(String(attempt.userId), aggregate);
    }

    const rows = await Promise.all(
      Array.from(byUser.entries()).map(async ([userId, aggregate]) => {
        const user = await context.db.get(userId as Id<"users">);
        return {
          userId,
          name: user?.name ?? "Anonymous",
          avatar: user?.imageUrl,
          average: Math.round(aggregate.total / aggregate.count),
          best: aggregate.best,
          attempts: aggregate.count,
        };
      })
    );

    rows.sort((rowA, rowB) => rowB.average - rowA.average || rowB.attempts - rowA.attempts);
    return rows.slice(0, payload.limit ?? 20);
  },
});
