"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Id } from "./_generated/dataModel";
import { FastApiClient } from "./fastApiClient";

const MODELS = {
  "gemini-2.0-flash": "gemini-2.0-flash",
  "gemini-2.5-pro": "gemini-2.5-pro",
  "gpt-4o": "gpt-4o",
  "gpt-4o-mini": "gpt-4o-mini"
} as const;

type ModelType = keyof typeof MODELS;

const SYSTEM_PROMPT = `You are EcoBot, an expert in ecology and environmental science. 
Your responses should be:
1. Scientifically accurate and up-to-date
2. Focused on ecological implications
3. Include relevant environmental context
4. Reference scientific sources when possible

When analyzing images or documents:
1. Identify key ecological elements
2. Explain environmental significance
3. Suggest sustainable practices if relevant
4. Note any conservation implications`;

// Flag to determine whether to use FastAPI backend or direct model calls
const USE_FASTAPI_BACKEND = process.env.USE_FASTAPI_BACKEND === "true";

export const generateResponse = action({
  args: {
    sessionId: v.id("sessions"),
    messageId: v.id("messages"),
    model: v.string(),
    mode: v.union(v.literal("normal"), v.literal("advanced")),
  },
  handler: async (ctx, args) => {
    // Get message content and files
    const message = await ctx.runQuery(internal.aiHelpers.getMessage, { 
      messageId: args.messageId 
    });
    if (!message) throw new Error("Message not found");

    // Get conversation history
    const history = await ctx.runQuery(internal.aiHelpers.getSessionMessages, {
      sessionId: args.sessionId
    });
    
    // Format messages for the AI
    const messages = history.map(msg => ({
      content: msg.content,
      role: msg.role
    }));
    
    // Add system message at the beginning
    messages.unshift({
      content: SYSTEM_PROMPT,
      role: "assistant"
    });

    let files: { url: string; mimeType: string }[] = [];
    if (message.fileIds && message.fileIds.length > 0) {
      files = await Promise.all(
        message.fileIds.map(async (fileId: Id<"_storage">) => {
          const url = await ctx.runQuery(internal.files.getUrlInternal, { fileId });
          const metadata = await ctx.runQuery(internal.files.getMetadataInternal, { fileId });
          if (!url || !metadata?.contentType) throw new Error("File not found");
          return { url, mimeType: metadata.contentType };
        })
      );
    }

    // Check if we should use FastAPI backend
    if (USE_FASTAPI_BACKEND) {
      try {
        // Use FastAPI backend with LangChain tools
        const fastApiClient = new FastApiClient();
        
        // Check if the FastAPI service is healthy
        const isHealthy = await fastApiClient.checkHealth();
        if (!isHealthy) {
          throw new Error("FastAPI service is not healthy. Falling back to direct model call.");
        }
        
        // Prepare request for FastAPI backend
        const agentResponse = await fastApiClient.generateAgentResponse({
          messages,
          files,
          model: args.model,
          mode: args.mode,
          sessionId: args.sessionId,
        });
        
        // Save the response
        await ctx.runMutation(internal.aiHelpers.saveResponse, {
          sessionId: args.sessionId,
          content: agentResponse.content,
          references: agentResponse.references || [],
        });
        
        return;
      } catch (error) {
        console.error("Error using FastAPI backend:", error);
        console.log("Falling back to direct model call");
        // Fall back to direct model call
      }
    }
    
    // Direct model call implementation (fallback)
    if (args.model.startsWith("gemini")) {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
      const model = genAI.getGenerativeModel({ 
        model: MODELS[args.model as ModelType] 
      });

      // Prepare content parts
      const parts: any[] = [{ text: message.content }];
      
      for (const file of files) {
        if (file.mimeType.startsWith("image/")) {
          const response = await fetch(file.url);
          const buffer = await response.arrayBuffer();
          parts.push({
            inlineData: {
              data: Buffer.from(buffer).toString("base64"),
              mimeType: file.mimeType
            }
          });
        }
        // For PDFs, we'll need to add document processing here
      }

      const result = await model.generateContent(parts);
      const response = result.response;
      
      // Save the response
      await ctx.runMutation(internal.aiHelpers.saveResponse, {
        sessionId: args.sessionId,
        content: response.text(),
        references: [], // Add reference extraction here
      });
    } else if (args.model.startsWith("gpt")) {
      // Use the bundled OpenAI for gpt-4o models
      const chat = new ChatGoogleGenerativeAI({
        model: MODELS[args.model as ModelType],
        apiKey: process.env.CONVEX_OPENAI_API_KEY,
        baseUrl: process.env.CONVEX_OPENAI_BASE_URL,
      });

      const langchainMessages = [
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(message.content)
      ];

      const response = await chat.invoke(langchainMessages);
      
      await ctx.runMutation(internal.aiHelpers.saveResponse, {
        sessionId: args.sessionId,
        content: typeof response.content === "string" ? response.content : JSON.stringify(response.content),
        references: [],
      });
    }
  },
});
