import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("student"), v.literal("admin")),
    joinedAt: v.number(),
    lastActiveAt: v.optional(v.number()),
  }).index("by_clerkUserId", ["clerkUserId"]),

  courses: defineTable({
    courseId: v.string(),
    playlistId: v.string(),
    title: v.string(),
    category: v.string(),
    level: v.string(),
    imageAlt: v.optional(v.string()),
    videoCount: v.optional(v.number()),
    thumbnail: v.optional(v.string()),
  }).index("by_courseId", ["courseId"]),

  quizzes: defineTable({
    courseId: v.string(),
    type: v.union(v.literal("practice"), v.literal("certification")),
    title: v.string(),
    totalQuestions: v.number(),
    pointsPerQuestion: v.number(),
    timeLimitSeconds: v.optional(v.number()),
    perQuestionSeconds: v.optional(v.number()),
    passThreshold: v.number(),
    enabled: v.boolean(),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.optional(v.number()),
    seededAt: v.optional(v.number()),
  }).index("by_course_type", ["courseId", "type"]),

  questions: defineTable({
    courseId: v.string(),
    quizType: v.union(v.literal("practice"), v.literal("certification")),
    prompt: v.string(),
    options: v.array(v.string()),
    correctIndex: v.number(),
    explanation: v.optional(v.string()),
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    isCore: v.optional(v.boolean()),
  }).index("by_course_type", ["courseId", "quizType"]),

  attempts: defineTable({
    userId: v.id("users"),
    courseId: v.string(),
    quizType: v.union(v.literal("practice"), v.literal("certification")),
    quizTitle: v.string(),
    attemptNumber: v.number(),
    status: v.union(v.literal("in_progress"), v.literal("submitted")),
    mode: v.union(v.literal("timed"), v.literal("untimed")),
    timerType: v.optional(v.union(v.literal("overall"), v.literal("per-question"))),
    totalPoints: v.number(),
    pointPerQuestion: v.number(),
    totalQuestions: v.number(),
    timeLimitSeconds: v.optional(v.number()),
    perQuestionSeconds: v.optional(v.number()),
    passThreshold: v.optional(v.number()),
    startedAt: v.number(),
    deadlineAt: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
    timeTakenMs: v.optional(v.number()),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        chosenIndex: v.number(),
      })
    ),
    score: v.optional(v.number()),
    total: v.optional(v.number()),
    percent: v.optional(v.number()),
    correctCount: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_course_type", ["userId", "courseId", "quizType"])
    .index("by_user_course_type_status", ["userId", "courseId", "quizType", "status"]),

  watchProgress: defineTable({
    userId: v.id("users"),
    courseId: v.string(),
    videoId: v.string(),
    positionSeconds: v.number(),
    durationSeconds: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_user_course", ["userId", "courseId"]),

  certificates: defineTable({
    userId: v.id("users"),
    courseId: v.string(),
    title: v.string(),
    issuedAt: v.number(),
    score: v.number(),
    certId: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_course", ["userId", "courseId"]),
});
