# DocuChat AI - Chat with your PDF

A minimalist, serverless, and secure "Chat with your PDF" application powered by Google's **Gemini 2.5 Flash**.

This application runs entirely in the browser using React. It processes PDFs locally, extracts text, and utilizes Gemini's massive context window to allow you to query multiple documents simultaneously with high accuracy and zero server-side storage of your files.

## Features

- **Serverless Architecture**: All PDF processing happens client-side. Your documents are never uploaded to a backend server.
- **Multi-Document Support**: Upload and analyze multiple PDF files at once.
- **Instant Previews**: Hover over uploaded files to see a thumbnail preview of the first page.
- **Massive Context Window**: Leverages Gemini 2.5 Flash to read entire documents at once, reducing hallucinations compared to traditional chunk-based RAG.
- **Minimalist Design**: Clean, monochrome UI focused on readability and usability.
- **Markdown Support**: Rich text formatting for AI responses.
- **Streaming Responses**: Real-time typing effect for immediate feedback.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite (implied environment)
- **Styling**: Tailwind CSS
- **AI Model**: Google Gemini 2.5 Flash via `@google/genai` SDK
- **PDF Processing**: `pdfjs-dist` (Text extraction & Canvas rendering)
- **Icons**: Lucide React

## Prerequisites

You need a Google Gemini API Key. You can get one for free at [Google AI Studio](https://aistudio.google.com/).

## Setup & Installation

1.  **Clone the repository** (if applicable) or download the source.

2.  **Environment Configuration**:
    The application relies on `process.env.GEMINI_API_KEY`.

    ```env
    GEMINI_API_KEY=your_google_gemini_api_key_here
    ```

    _(Note: You may need to adjust `services/gemini.ts` to use `import.meta.env.VITE_API_KEY` depending on your build tool, or ensure your bundler defines `process.env.API_KEY`)._

    If using a **Webpack/Node** based environment provided by the coding platform:
    Ensure the `API_KEY` environment variable is set in the runtime configuration.

3.  **Install Dependencies**:

    ```bash
    npm install
    ```

4.  **Run the Application**:
    ```bash
    npm start
    # or
    npm run dev
    ```

## Usage

1.  Open the application in your browser.
2.  Drag and drop one or multiple PDF files into the upload zone.
3.  Hover over the file list to verify the documents via the tooltip preview.
4.  Click **"Start Analysis"**.
5.  Ask questions about your documents in the chat interface.
    - _Example: "Summarize the key points of the first document."_
    - _Example: "What does the contract say about termination?"_

## Troubleshooting

- **PDF Worker Error**: If you see an error regarding the "worker", ensure you have a stable internet connection as the app fetches the PDF.js worker from a CDN (`unpkg.com`).
- **API Key Error**: If the chat fails immediately, check the console. Ensure your API Key is valid and has access to the `gemini-2.5-flash` model.

## License

MIT
