from fastapi import FastAPI, HTTPException, Body, File, UploadFile, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
import os
import uvicorn
from dotenv import load_dotenv
import json

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain.agents import AgentExecutor
from .agent.chains import create_agent_chain
from .agent.tools import get_tools

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(title="EcoBot LangChain Agent API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# System prompt for your EcoBot
SYSTEM_PROMPT = """You are EcoBot, an expert in ecology and environmental science. 
Your responses should be:
1. Scientifically accurate and up-to-date
2. Focused on ecological implications
3. Include relevant environmental context
4. Reference scientific sources when possible

When analyzing images or documents:
1. Identify key ecological elements
2. Explain environmental significance
3. Suggest sustainable practices if relevant
4. Note any conservation implications"""

# Define request and response models
class Message(BaseModel):
    content: str
    role: str = "user"
    
class FileInfo(BaseModel):
    url: str
    mimeType: str

class AgentRequest(BaseModel):
    messages: List[Message]
    files: Optional[List[FileInfo]] = None
    model: str = "gpt-4o"
    mode: str = "normal"
    sessionId: str
    
class AgentResponse(BaseModel):
    content: str
    references: List[Dict[str, Any]] = []

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Create agent route
@app.post("/agent/generate", response_model=AgentResponse)
async def generate_agent_response(request: AgentRequest):
    try:
        # Extract the conversation history
        history = []
        for msg in request.messages:
            if msg.role == "user":
                history.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                history.append(AIMessage(content=msg.content))
            elif msg.role == "system":
                history.append(SystemMessage(content=msg.content))
        
        # Get the last user message
        user_message = next((m.content for m in reversed(request.messages) if m.role == "user"), "")
        if not user_message:
            raise HTTPException(status_code=400, detail="No user message provided")
        
        # Process any files if present
        file_contexts = []
        if request.files:
            for file in request.files:
                if file.mimeType.startswith("image/"):
                    file_contexts.append(f"[Image URL: {file.url}]")
                else:
                    file_contexts.append(f"[File URL: {file.url}]")
        
        # Combine message with file references
        if file_contexts:
            full_message = user_message + "\n" + "\n".join(file_contexts)
        else:
            full_message = user_message
            
        # Get tools based on the mode
        tools = get_tools(mode=request.mode)
        
        # Create LangChain agent with tools
        agent_chain = create_agent_chain(
            model_name=request.model,
            system_prompt=SYSTEM_PROMPT,
            tools=tools
        )
        
        # Invoke the agent
        response = agent_chain.invoke({
            "input": full_message,
            "chat_history": history[:-1]  # Exclude the current message which we're processing
        })
        
        # Format and return response
        return AgentResponse(
            content=response["output"],
            references=response.get("references", [])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution error: {str(e)}")

# WebSocket endpoint for streaming responses (optional)
@app.websocket("/agent/stream")
async def stream_agent_response(websocket):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            request = json.loads(data)
            
            # Process similar to the /agent/generate endpoint but with streaming
            # Implement streaming logic here
            
            await websocket.send_text(json.dumps({"content": "Streaming response...", "done": False}))
            await websocket.send_text(json.dumps({"content": "Final response", "done": True}))
            
    except Exception as e:
        await websocket.send_text(json.dumps({"error": str(e)}))
    finally:
        await websocket.close()

# Main entry point
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)