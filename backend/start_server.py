import os
import uvicorn

if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"Starting FastAPI LangChain Agent server on {host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)