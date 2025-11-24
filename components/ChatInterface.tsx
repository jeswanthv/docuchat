import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Send, FileText, X, ArrowLeft, RefreshCw, Layers, Trash2 } from 'lucide-react';
import { Message, PDFDocument } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  messages: Message[];
  pdfDocs: PDFDocument[];
  onSendMessage: (text: string) => void;
  onReset: () => void;
  onClearChat: () => void;
  isStreaming: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  pdfDocs, 
  onSendMessage, 
  onReset,
  onClearChat,
  isStreaming 
}) => {
  const [inputText, setInputText] = useState('');
  // State for portal tooltip
  const [hoveredDoc, setHoveredDoc] = useState<{ id: string, rect: DOMRect } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputText.trim() && !isStreaming) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const totalTokens = pdfDocs.reduce((acc, doc) => acc + (doc.content.length / 4), 0);

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
      {/* Sidebar - PDF Info */}
      <div className="w-72 bg-zinc-50 border-r border-zinc-200 hidden md:flex flex-col z-20">
        <div className="p-5 border-b border-zinc-200">
          <div className="flex items-center space-x-2 text-zinc-900 font-bold text-lg">
            <div className="bg-black p-1.5 rounded-sm">
               <FileText className="w-4 h-4 text-white" />
            </div>
            <span>DocuChat</span>
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
               <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Documents</h3>
               <span className="text-xs font-medium text-zinc-500 bg-zinc-200 px-1.5 py-0.5 rounded-sm">{pdfDocs.length}</span>
            </div>
            
            <div className="space-y-2">
              {pdfDocs.map((doc) => (
                <div 
                  key={doc.id} 
                  className="relative bg-white p-2.5 rounded-sm shadow-sm border border-zinc-200 hover:border-zinc-400 transition-all cursor-default"
                  onMouseEnter={(e) => setHoveredDoc({ id: doc.id, rect: e.currentTarget.getBoundingClientRect() })}
                  onMouseLeave={() => setHoveredDoc(null)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 bg-zinc-100 text-zinc-600 rounded-sm shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <h4 className="font-medium text-zinc-900 text-sm truncate" title={doc.name}>
                        {doc.name}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {doc.pageCount} pgs • {(doc.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-zinc-200">
               <div className="flex items-center justify-between text-xs text-zinc-400">
                 <span>Context Usage:</span>
                 <span className="font-mono">{Math.round(totalTokens).toLocaleString()} tok</span>
               </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200 space-y-2">
          <button 
            onClick={onClearChat}
            disabled={messages.length === 0 || isStreaming}
            className="flex items-center justify-center space-x-2 w-full px-4 py-2 text-zinc-600 bg-white border border-zinc-300 rounded-sm hover:bg-zinc-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>

          <button 
            onClick={onReset}
            className="flex items-center justify-center space-x-2 w-full px-4 py-2 text-white bg-black border border-black rounded-sm hover:bg-zinc-800 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative z-10 bg-white">
        {/* Mobile Header */}
        <div className="md:hidden h-14 border-b border-zinc-200 flex items-center justify-between px-4 bg-white z-10">
          <div className="flex items-center space-x-2">
             <Layers className="w-4 h-4 text-zinc-500" />
             <span className="font-medium text-zinc-800 text-sm">{pdfDocs.length} Docs</span>
          </div>
          <button onClick={onReset} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-3">
              <div className="w-12 h-12 bg-zinc-100 rounded-sm flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-zinc-300" />
              </div>
              <p className="text-base font-medium text-zinc-600">Assistant Ready</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`
                  max-w-[85%] md:max-w-[75%] px-5 py-3 text-sm leading-relaxed shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-black text-white rounded-sm rounded-tr-none' 
                    : 'bg-white text-zinc-800 border border-zinc-200 rounded-sm rounded-tl-none'
                  }
                `}
              >
                {msg.role === 'model' ? (
                  <div className="prose prose-sm prose-zinc max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {msg.isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-zinc-400 animate-pulse" />}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-zinc-200">
          <div className="max-w-3xl mx-auto relative flex items-end bg-zinc-50 border border-zinc-200 rounded-sm focus-within:ring-1 focus-within:ring-zinc-400 focus-within:border-zinc-400 transition-all">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              className="w-full bg-transparent border-0 focus:ring-0 p-3 min-h-[50px] max-h-[150px] resize-none text-zinc-800 placeholder:text-zinc-400 text-sm"
              rows={1}
              style={{ minHeight: '50px' }}
            />
            <div className="p-2">
              <button
                onClick={() => handleSubmit()}
                disabled={!inputText.trim() || isStreaming}
                className={`
                  p-2 rounded-sm flex items-center justify-center transition-all duration-200
                  ${!inputText.trim() || isStreaming
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-zinc-800'
                  }
                `}
              >
                {isStreaming ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="max-w-3xl mx-auto mt-2 text-center">
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
              AI Generated Content • Verify Important Info
            </p>
          </div>
        </div>
      </div>

      {/* Portal Tooltip for Sidebar */}
      {hoveredDoc && (() => {
        const doc = pdfDocs.find(d => d.id === hoveredDoc.id);
        if (!doc || !doc.preview) return null;

        return createPortal(
          <div 
            className="fixed z-[9999] pointer-events-none p-1 bg-white rounded-sm shadow-xl border border-zinc-200 w-56"
            style={{
              top: hoveredDoc.rect.top - 20,
              left: hoveredDoc.rect.right + 12,
            }}
          >
             <div className="relative bg-zinc-100 rounded-sm overflow-hidden max-h-[60vh] overflow-y-auto">
                <img src={doc.preview} alt={`Preview of ${doc.name}`} className="w-full h-auto object-contain" />
             </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
};