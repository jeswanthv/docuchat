import { Chat, GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// Initialize client
const ai = new GoogleGenAI({ apiKey: API_KEY });

let chatSession: Chat | null = null;

/**
 * Initializes a chat session with the PDF content as system instruction context.
 * Using Gemini 2.5 Flash which has a massive context window, perfect for whole-document RAG.
 */
export const initChatSession = async (pdfText: string) => {
  try {
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are a helpful and precise assistant. You have been provided with the following documents:

        <DOCUMENTS_CONTENT>
        ${pdfText}
        </DOCUMENTS_CONTENT>

        Guidelines:
        1. **Document Questions**: If the user asks about the content of these documents, answer **strictly** based on the provided text. Do not invent information or make assumptions outside the text. If the answer is not found in the documents, state clearly that it is not in the context.
        2. **General Questions**: You can answer general greetings (e.g., "Hi", "How are you?") or simple general knowledge questions normally.
        3. **Tone**: Be professional, concise, and direct.
        4. **Format**: Use clean Markdown.
        `,
        temperature: 0.3, // Low temperature to reduce hallucination
      },
    });
    
    return true;
  } catch (error) {
    console.error("Failed to initialize chat session", error);
    throw error;
  }
};

export const sendMessageStream = async function* (message: string) {
  if (!chatSession) {
    throw new Error("Chat session not initialized");
  }

  try {
    const result = await chatSession.sendMessageStream({ message });
    
    for await (const chunk of result) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Error sending message to LLLM", error);
    throw error;
  }
};