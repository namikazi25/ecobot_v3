import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const send = mutation({
  args: {
    sessionId: v.id("sessions"),
    content: v.string(),
    fileIds: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    // Save user message
    const messageId = await ctx.db.insert("messages", {
      sessionId: args.sessionId,
      userId,
      content: args.content,
      role: "user",
      fileIds: args.fileIds,
    });

    // Generate AI response
    await ctx.scheduler.runAfter(0, api.ai.generateResponse, {
      sessionId: args.sessionId,
      messageId,
      model: session.model,
      mode: session.mode,
    });

    return messageId;
  },
});

export const list = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});
