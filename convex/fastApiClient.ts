"use node";

import { v } from "convex/values";

interface Message {
  content: string;
  role: string;
}

interface FileInfo {
  url: string;
  mimeType: string;
}

interface AgentRequest {
  messages: Message[];
  files?: FileInfo[];
  model: string;
  mode: "normal" | "advanced";
  sessionId: string;
}

interface AgentResponse {
  content: string;
  references: any[];
}

/**
 * Client for communicating with the FastAPI backend
 */
export class FastApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8000") {
    this.baseUrl = baseUrl;
    console.log(`FastAPI client initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * Generate a response from the FastAPI agent
   */
  async generateAgentResponse(request: AgentRequest): Promise<AgentResponse> {
    const response = await fetch(`${this.baseUrl}/agent/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FastAPI request failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Check if the FastAPI service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
      });
      
      return response.ok;
    } catch (error) {
      console.error("FastAPI health check failed:", error);
      return false;
    }
  }
}