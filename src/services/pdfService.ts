import { PDFDocument, rgb, degrees } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';
import { decode, encode } from 'base-64';

if (!global.btoa) { global.btoa = encode; }
if (!global.atob) { global.atob = decode; }

export const pdfService = {
  /**
   * Reads a PDF file from URI and returns a PDFDocument instance
   */
  async loadDoc(uri: string) {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return await PDFDocument.load(bytes);
  },

  /**
   * Saves a PDFDocument instance to a Uint8Array
   */
  async saveDoc(doc: PDFDocument): Promise<Uint8Array> {
    return await doc.save();
  },

  /**
   * Merges multiple PDFs into one
   */
  async mergePdfs(uris: string[]): Promise<Uint8Array> {
    const mergedDoc = await PDFDocument.create();
    for (const uri of uris) {
      const doc = await this.loadDoc(uri);
      const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach((page) => mergedDoc.addPage(page));
    }
    return await mergedDoc.save();
  },

  /**
   * Splits a PDF into multiple PDFs based on page indices
   */
  async splitPdf(uri: string, pageIndices: number[]): Promise<Uint8Array> {
    const doc = await this.loadDoc(uri);
    const splitDoc = await PDFDocument.create();
    const copiedPages = await splitDoc.copyPages(doc, pageIndices);
    copiedPages.forEach((page) => splitDoc.addPage(page));
    return await splitDoc.save();
  },

  /**
   * Rotates specific pages in a PDF
   */
  async rotatePdf(uri: string, rotationDegrees: number, pageIndices: number[]): Promise<Uint8Array> {
    const doc = await this.loadDoc(uri);
    const pages = doc.getPages();
    pageIndices.forEach((index) => {
      const page = pages[index];
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees(currentRotation + rotationDegrees));
    });
    return await doc.save();
  },

  /**
   * Converts a list of image URIs to a single PDF document.
   */
  async imagesToPdf(imageUris: string[]): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    for (const imageUri of imageUris) {
      const extension = imageUri.split('.').pop()?.toLowerCase();
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });
      const imgBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      let image;
      if (extension === 'png') {
        image = await pdfDoc.embedPng(imgBytes);
      } else {
        image = await pdfDoc.embedJpg(imgBytes);
      }

      const { width, height } = image.scale(1);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
    }

    return await pdfDoc.save();
  },

  /**
   * Reorders pages in a PDF document based on a new index array.
   */
  async reorderPages(uri: string, newOrder: number[]): Promise<Uint8Array> {
    const doc = await this.loadDoc(uri);
    const newDoc = await PDFDocument.create();
    const pages = await newDoc.copyPages(doc, newOrder);
    pages.forEach((page) => newDoc.addPage(page));
    return await newDoc.save();
  },

  /**
   * Saves a Uint8Array to the application's document directory
   */
  async saveProcessedFile(bytes: Uint8Array, fileName: string): Promise<string> {
    // Convert Uint8Array to binary string for encoding
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = encode(binary);
    
    // Use type assertion if IDE is being difficult about exports
    const documentDirectory = (FileSystem as any).documentDirectory;
    const EncodingType = (FileSystem as any).EncodingType;
    
    const fileUri = `${documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: EncodingType.Base64,
    });
    return fileUri;
  },
};
