import { extractText, isAvailable } from 'expo-pdf-text-extract';
import { Platform } from 'react-native';

export const textExtractionService = {
  /**
   * Extracts text from a PDF file locally.
   * @param uri The URI of the PDF file.
   * @returns The extracted text.
   */
  async extractTextFromPdf(uri: string): Promise<string> {
    try {
      if (!isAvailable()) {
        throw new Error('PDF text extraction is not available on this platform.');
      }
      // Normalize URI: some native modules prefer path without 'file://' prefix
      const cleanUri = Platform.OS === 'android' ? uri.replace('file://', '') : uri;
      console.log('Extracting text from:', cleanUri);
      
      const text = await extractText(cleanUri);
      return text || '';
    } catch (error: any) {
      console.error('Error extracting text from PDF:', error);
      const detail = error?.message || 'Unknown error';
      throw new Error(`Failed to extract text: ${detail}. Please ensure it is a digital PDF and not a scanned image.`);
    }
  },

  /**
   * Simple chunking logic for large texts.
   * @param text The full text to chunk.
   * @param chunkSize Maximum characters per chunk.
   * @returns Array of text chunks.
   */
  chunkText(text: string, chunkSize: number = 2000): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      chunks.push(text.substring(i, i + chunkSize));
      i += chunkSize;
    }
    return chunks;
  }
};
