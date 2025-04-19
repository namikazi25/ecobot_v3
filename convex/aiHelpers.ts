import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

export const getMessage = internalQuery({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId);
  },
});

export const saveResponse = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    content: v.string(),
    references: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      sessionId: args.sessionId,
      content: args.content,
      role: "assistant",
      references: args.references,
    });
  },
});

export const getSessionMessages = internalQuery({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    // Get all messages for a given session, ordered by creation time
    return await ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});
