import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

const MODELS = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gpt-4o-mini", name: "GPT-4o-mini" },
];

const ALLOWED_FILE_TYPES = {
  "image/jpeg": "Image",
  "image/png": "Image",
  "image/gif": "Image",
  "application/pdf": "PDF",
};

export function ChatInterface() {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [mode, setMode] = useState<"normal" | "deep_research">("normal");
  const [sessionId, setSessionId] = useState<Id<"sessions"> | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  
  const createSession = useMutation(api.sessions.create);
  const sendMessage = useMutation(api.messages.send);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const messages = useQuery(api.messages.list, 
    sessionId ? { sessionId } : "skip"
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      Object.keys(ALLOWED_FILE_TYPES).includes(file.type)
    );
    setSelectedFiles(validFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && selectedFiles.length === 0) return;
    setUploading(true);

    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = await createSession({
          name: "New Chat",
          model: selectedModel.id,
          mode,
        });
        setSessionId(currentSessionId);
      }

      // Upload files if any
      const fileIds: Id<"_storage">[] = [];
      for (const file of selectedFiles) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!result.ok) throw new Error("Upload failed");
        const { storageId } = await result.json();
        fileIds.push(storageId);
      }

      await sendMessage({
        sessionId: currentSessionId,
        content: message,
        fileIds: fileIds.length > 0 ? fileIds : undefined,
      });

      setMessage("");
      setSelectedFiles([]);
      if (fileInput.current) fileInput.current.value = "";
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b p-4 flex items-center gap-4">
        <select
          value={selectedModel.id}
          onChange={(e) => setSelectedModel(MODELS.find(m => m.id === e.target.value)!)}
          className="border rounded p-2"
        >
          {MODELS.map(model => (
            <option key={model.id} value={model.id}>{model.name}</option>
          ))}
        </select>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="border rounded p-2"
        >
          <option value="normal">Normal</option>
          <option value="deep_research">Deep Research</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages?.map((msg) => (
          <div
            key={msg._id}
            className={`p-4 rounded-lg max-w-3xl ${
              msg.role === "user" 
                ? "bg-emerald-100 ml-auto" 
                : "bg-gray-100"
            }`}
          >
            {msg.fileIds && msg.fileIds.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {msg.fileIds.map((fileId) => (
                  <FilePreview key={fileId.toString()} fileId={fileId} />
                ))}
              </div>
            )}
            <div>{msg.content}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="space-y-4">
          {selectedFiles.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFiles(files => files.filter((_, i) => i !== index));
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about ecology..."
              className="flex-1 border rounded-lg p-2"
              disabled={uploading}
            />
            <label className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg cursor-pointer">
              <input
                type="file"
                ref={fileInput}
                onChange={handleFileSelect}
                multiple
                accept={Object.keys(ALLOWED_FILE_TYPES).join(",")}
                className="hidden"
                disabled={uploading}
              />
              📎
            </label>
            <button
              type="submit"
              disabled={(!message.trim() && selectedFiles.length === 0) || uploading}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {uploading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function FilePreview({ fileId }: { fileId: Id<"_storage"> }) {
  const url = useQuery(api.files.getUrl, { fileId });
  const metadata = useQuery(api.files.getMetadata, { fileId });

  if (!url || !metadata) return null;

  if (metadata.contentType?.startsWith("image/")) {
    return (
      <img 
        src={url} 
        alt="Uploaded content"
        className="max-w-sm rounded border"
      />
    );
  }

  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-emerald-600 hover:text-emerald-800 underline"
    >
      View File
    </a>
  );
}
