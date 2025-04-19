# EcoBot: AI-Powered Ecological Insights

EcoBot is an interactive AI assistant specializing in ecology and environmental science, built with [Convex](https://convex.dev) and React, featuring multiple AI models for environmental analysis and research.

![EcoBot Interface](https://via.placeholder.com/800x400?text=EcoBot+Interface)

## Features

- **Multi-Model AI Integration**: Support for GPT-4o and Gemini models
- **Deep Research Mode**: Enhanced ecological research with specialized tools
- **File Uploads**: Analyze images and documents within conversations
- **Real-time Chat**: Interactive conversations with AI about ecological topics
- **User Authentication**: Secure user accounts and conversation history

## Project Structure

- **Frontend**: React with TypeScript, built with [Vite](https://vitejs.dev/)
- **Backend**: [Convex](https://convex.dev) for data storage and application logic
- **AI Integration**: 
  - Direct model calls to OpenAI and Google APIs
  - Python FastAPI backend with LangChain for advanced research capabilities

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+ (for FastAPI backend)
- API keys for OpenAI and Google Gemini models

### Frontend Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Convex deployment URL and API keys:
   ```env
   VITE_CONVEX_URL=your_convex_url
   GOOGLE_API_KEY=your_google_api_key
   CONVEX_OPENAI_API_KEY=your_openai_api_key
   CONVEX_OPENAI_BASE_URL=https://api.openai.com/v1
   ```

### Backend FastAPI Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the backend directory with your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_API_KEY=your_google_api_key
   PORT=8000
   HOST=0.0.0.0
   ```
5. Start the FastAPI server:
   ```bash
   python start_server.py
   ```

### Running the App

Start both the frontend and Convex backend:
```bash
npm run dev
```

This command will:
- Start the Convex development server
- Start the Vite development server for the frontend
- Open the app in your default browser

## Usage

1. Sign in using password or anonymous authentication
2. Start a new conversation with EcoBot
3. Choose between different AI models and research modes
4. Upload images or documents for analysis
5. Ask ecological questions and receive detailed responses

## Deployment

This project is connected to the Convex deployment [`fantastic-barracuda-327`](https://dashboard.convex.dev/d/fantastic-barracuda-327).

For production deployment:
1. Deploy the FastAPI backend to a cloud provider
2. Update the `FASTAPI_BASE_URL` environment variable
3. Deploy the frontend using services like Vercel or Netlify

## Development Resources

- [Convex Documentation](https://docs.convex.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [LangChain Documentation](https://python.langchain.com/docs/)
- [React Documentation](https://react.dev/)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
