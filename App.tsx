import { Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
import { ChatInterface } from "./components/ChatInterface";
import { FileUpload } from "./components/FileUpload";
import { initChatSession, sendMessageStream } from "./services/gemini";
import { AppState, Message, PDFDocument } from "./types";

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [pdfDocs, setPdfDocs] = useState<PDFDocument[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Check for API key on mount
  useEffect(() => {
    if (!process.env.API_KEY) {
      setErrorMsg(
        "Missing API_KEY in environment variables. Please configure it to run."
      );
      setAppState(AppState.ERROR);
    }
  }, []);

  const handleDocumentsReady = async (docs: PDFDocument[]) => {
    setAppState(AppState.PROCESSING);
    setErrorMsg("");

    try {
      if (docs.length === 0) {
        throw new Error("No documents provided.");
      }

      // Combine text from all documents for the system context
      const combinedText = docs
        .map(
          (doc) =>
            `--- DOCUMENT: ${doc.name} ---\n${doc.content}\n------------------------\n`
        )
        .join("\n");

      // Initialize Gemini Chat Session with the massive context
      await initChatSession(combinedText);

      setPdfDocs(docs);
      setAppState(AppState.CHAT);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to initialize chat.");
      setAppState(AppState.UPLOAD);
    }
  };

  const handleSendMessage = async (text: string) => {
    // Optimistic UI update
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    // Create placeholder for AI response
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      role: "model",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, aiMsg]);

    try {
      const stream = sendMessageStream(text);
      let fullContent = "";

      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, content: fullContent } : msg
          )
        );
      }

      // Finalize message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "model",
          content:
            "Sorry, I encountered an error while processing your request. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleReset = () => {
    setPdfDocs([]);
    setMessages([]);
    setAppState(AppState.UPLOAD);
    setErrorMsg("");
  };

  const handleClearChat = async () => {
    if (isStreaming) return;

    setMessages([]);

    // Re-initialize session to ensure model forgets previous context
    const combinedText = pdfDocs
      .map(
        (doc) =>
          `--- DOCUMENT: ${doc.name} ---\n${doc.content}\n------------------------\n`
      )
      .join("\n");

    try {
      await initChatSession(combinedText);
    } catch (err) {
      console.error("Failed to reset chat session:", err);
      // We don't necessarily need to show an error to the user here since the UI is cleared
    }
  };

  if (
    appState === AppState.UPLOAD ||
    appState === AppState.PROCESSING ||
    appState === AppState.ERROR
  ) {
    return (
      <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
        <nav className="relative z-10 w-full p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-zinc-900 font-bold text-xl">
            <div className="bg-zinc-100 p-2 rounded-sm border border-zinc-200">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span>DocuChat AI</span>
          </div>
        </nav>

        <main className="relative z-10 flex-1 flex flex-col items-center justify-center pb-20">
          <div className="text-center mb-12 space-y-4 px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 tracking-tight">
              Chat with your PDFs
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto font-light">
              Simple. Private. Intelligent.
            </p>
          </div>

          <FileUpload
            onDocumentsReady={handleDocumentsReady}
            appState={appState}
          />
        </main>
      </div>
    );
  }

  return (
    <ChatInterface
      messages={messages}
      pdfDocs={pdfDocs}
      onSendMessage={handleSendMessage}
      onReset={handleReset}
      onClearChat={handleClearChat}
      isStreaming={isStreaming}
    />
  );
};

export default App;
