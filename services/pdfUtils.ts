import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker source. 
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface ProcessedPDF {
  text: string;
  pageCount: number;
  preview?: string;
}

export const processPDF = async (file: File): Promise<ProcessedPDF> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Initialize the loading task with optional CMaps
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });
    
    const pdf = await loadingTask.promise;

    // 1. Generate Preview (Page 1)
    let preview: string | undefined;
    try {
      const page = await pdf.getPage(1);
      // Create a viewport at a reasonable scale for a thumbnail
      const viewport = page.getViewport({ scale: 0.5 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Cast to any to resolve type mismatch where 'canvas' property is expected by Typescript but 'canvasContext' is used by runtime
        await page.render({
          canvasContext: context,
          viewport: viewport
        } as any).promise;

        preview = canvas.toDataURL('image/jpeg', 0.8);
      }
    } catch (previewError) {
      console.warn("Failed to generate PDF preview:", previewError);
      // Continue without preview if it fails
    }

    // 2. Extract Text
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
        
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    if (!fullText.trim()) {
      throw new Error("No text content found in PDF. It might be an image-only scan.");
    }

    return {
      text: fullText,
      pageCount: pdf.numPages,
      preview
    };

  } catch (error: any) {
    console.error('Error processing PDF:', error);
    let errorMessage = 'Failed to parse PDF document.';
    
    if (error.name === 'MissingPDFException') {
      errorMessage = 'The file is missing or invalid.';
    } else if (error.name === 'InvalidPDFException') {
      errorMessage = 'The file is corrupted or not a valid PDF.';
    } else if (error.message && error.message.includes('worker')) {
      errorMessage = 'PDF Worker failed to load. Please check your internet connection.';
    }
    
    throw new Error(errorMessage);
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};