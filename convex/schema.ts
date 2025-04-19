import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  sessions: defineTable({
    name: v.string(),
    model: v.string(),
    mode: v.union(v.literal("normal"), v.literal("deep_research")),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),

  messages: defineTable({
    sessionId: v.id("sessions"),
    userId: v.optional(v.id("users")),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    fileIds: v.optional(v.array(v.id("_storage"))),
    references: v.optional(v.array(v.string())),
  }).index("by_session", ["sessionId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
