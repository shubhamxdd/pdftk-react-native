import { GoogleGenerativeAI } from '@google/generative-ai';

// Get your API key from https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const aiService = {
  /**
   * Generates a response based on a PDF file and user question.
   * @param pdfBase64 The PDF file content as base64 string.
   * @param question The user's question.
   * @param history Optional chat history.
   */
  async askQuestionWithPdf(pdfBase64: string, question: string, history: ChatMessage[] = []): Promise<string> {
    try {
      if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('Gemini API Key is not configured. Please add your API key in src/services/aiService.ts');
      }

      const model = genAI.getGenerativeModel(
        { model: 'gemini-2.5-flash' },
        { apiVersion: 'v1beta' }
      );

      const chat = model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 4096,
        },
      });

      // Combine the PDF and the prompt
      const result = await chat.sendMessage([
        {
          inlineData: {
            data: pdfBase64,
            mimeType: 'application/pdf',
          },
        },
        { text: `You are a helpful PDF assistant. Use the provided PDF to answer the following question accurately: ${question}` },
      ]);

      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('AI Service Error:', error);
      throw new Error(error.message || 'Failed to get a response from AI.');
    }
  },

  isConfigured(): boolean {
    return GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE' && GEMINI_API_KEY.length > 0;
  }
};
