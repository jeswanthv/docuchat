import {
  AlertCircle,
  FileText,
  Loader2,
  Play,
  Plus,
  Upload,
  X,
} from "lucide-react";
import React, { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { formatFileSize, processPDF } from "../services/pdfUtils";
import { AppState, PDFDocument } from "../types";

interface FileUploadProps {
  onDocumentsReady: (docs: PDFDocument[]) => void;
  appState: AppState;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onDocumentsReady,
  appState,
}) => {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // State for portal tooltip
  const [hoveredDoc, setHoveredDoc] = useState<{
    id: string;
    rect: DOMRect;
  } | null>(null);

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);

    const newDocs: PDFDocument[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (file.type !== "application/pdf") {
        errors.push(`${file.name} is not a PDF.`);
        continue;
      }

      // Skip if already added
      if (documents.some((d) => d.name === file.name && d.size === file.size)) {
        continue;
      }

      try {
        const { text, pageCount, preview } = await processPDF(file);

        if (!text || text.length < 50) {
          throw new Error("Insufficient text content.");
        }

        newDocs.push({
          id: Math.random().toString(36).substring(7),
          name: file.name,
          size: file.size,
          pageCount: pageCount,
          content: text,
          textConfigured: true,
          preview,
        });
      } catch (err: any) {
        console.error(`Error processing ${file.name}:`, err);
        errors.push(`Failed to read ${file.name}: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(" "));
    }

    setDocuments((prev) => [...prev, ...newDocs]);
    setIsProcessing(false);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(Array.from(e.dataTransfer.files));
      }
    },
    [documents]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(Array.from(e.target.files));
      }
    },
    [documents]
  );

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (hoveredDoc?.id === id) setHoveredDoc(null);
  };

  const handleStartChat = () => {
    if (documents.length > 0) {
      onDocumentsReady(documents);
    }
  };

  const isLoading = isProcessing || appState === AppState.PROCESSING;

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="flex flex-col gap-4">
        {/* Drop Zone */}
        <div className="w-full">
          <div
            className={`
              relative border border-dashed rounded-md h-[240px] flex flex-col items-center justify-center text-center p-8 transition-all duration-200
              ${
                isDragging
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-300 hover:border-zinc-900 hover:bg-zinc-50"
              }
              ${isLoading ? "opacity-50 pointer-events-none" : ""}
              bg-white
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div
              className={`
              p-4 mb-4 rounded-sm
              ${isDragging ? "text-black" : "text-zinc-400"}
            `}
            >
              {isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin text-black" />
              ) : (
                <Upload className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-2 mb-6">
              <h3 className="text-lg font-medium text-zinc-900">
                {isProcessing ? "Processing Files..." : "Upload Documents"}
              </h3>
              <p className="text-zinc-500 text-sm">
                {isProcessing
                  ? "Analyzing content..."
                  : "Drag & drop PDFs here"}
              </p>
            </div>

            <label className="relative inline-flex group cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileInput}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className="
                px-5 py-2 bg-black text-white rounded-sm text-sm font-medium
                hover:bg-zinc-800 transition-colors flex items-center space-x-2
              "
              >
                <Plus className="w-4 h-4" />
                <span>Browse Files</span>
              </div>
            </label>
          </div>
        </div>

        {/* File List & Actions */}
        {documents.length > 0 && (
          <div className="flex flex-col bg-white rounded-md border border-zinc-200 animate-fadeIn mt-4">
            <div className="p-3 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center rounded-t-md">
              <h3 className="font-medium text-sm text-zinc-600">
                Selected Documents ({documents.length})
              </h3>
              <button
                onClick={() => setDocuments([])}
                className="text-xs text-zinc-500 hover:text-red-600 hover:underline"
              >
                Clear
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="relative flex items-center p-3 bg-white border border-zinc-100 rounded-sm hover:border-zinc-300 transition-all group"
                  onMouseEnter={(e) =>
                    setHoveredDoc({
                      id: doc.id,
                      rect: e.currentTarget.getBoundingClientRect(),
                    })
                  }
                  onMouseLeave={() => setHoveredDoc(null)}
                >
                  <div className="p-2 bg-zinc-100 text-zinc-600 rounded-sm mr-3 flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-medium text-zinc-900 text-sm truncate"
                      title={doc.name}
                    >
                      {doc.name}
                    </h4>
                    <div className="flex items-center space-x-3 mt-0.5">
                      <span className="text-xs text-zinc-400">
                        {formatFileSize(doc.size)} • {doc.pageCount} pages
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeDocument(doc.id)}
                    className="p-1.5 text-zinc-300 hover:text-red-600 hover:bg-zinc-50 rounded-sm transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-zinc-100 bg-zinc-50 rounded-b-md">
              <button
                onClick={handleStartChat}
                disabled={isProcessing || isLoading}
                className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white rounded-sm font-medium flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-3 rounded-sm border border-red-100 animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {documents.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 opacity-60">
          <div className="bg-white p-4 rounded-sm border border-zinc-100">
            <h4 className="font-semibold text-zinc-900 mb-1 text-sm">
              Multi-Doc Analysis
            </h4>
            <p className="text-xs text-zinc-500">
              Upload multiple PDFs. AI analyzes them all in a single context
              window.
            </p>
          </div>
          <div className="bg-white p-4 rounded-sm border border-zinc-100">
            <h4 className="font-semibold text-zinc-900 mb-1 text-sm">
              Instant Preview
            </h4>
            <p className="text-xs text-zinc-500">
              Hover over your files to see a preview of the first page before
              chatting.
            </p>
          </div>
          <div className="bg-white p-4 rounded-sm border border-zinc-100">
            <h4 className="font-semibold text-zinc-900 mb-1 text-sm">
              Private & Secure
            </h4>
            <p className="text-xs text-zinc-500">
              Processing happens in your session. Your documents are analyzed
              locally.
            </p>
          </div>
        </div>
      )}

      {/* Portal Tooltip */}
      {hoveredDoc &&
        (() => {
          const doc = documents.find((d) => d.id === hoveredDoc.id);
          if (!doc || !doc.preview) return null;

          return createPortal(
            <div
              className="fixed z-[9999] pointer-events-none p-1 bg-white rounded-sm shadow-xl border border-zinc-200 w-64"
              style={{
                top: hoveredDoc.rect.top - 10,
                left: hoveredDoc.rect.left,
                transform: "translateY(-100%)",
              }}
            >
              <div className="relative bg-zinc-100 rounded-sm overflow-hidden max-h-[60vh] overflow-y-auto">
                <img
                  src={doc.preview}
                  alt={`Preview of ${doc.name}`}
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>,
            document.body
          );
        })()}
    </div>
  );
};
