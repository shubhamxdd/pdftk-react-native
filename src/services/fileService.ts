import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { decode, encode } from 'base-64';

// Polyfills for atob and btoa as they are missing in RN
if (!global.btoa) { global.btoa = encode; }
if (!global.atob) { global.atob = decode; }

export const pickPdf = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      return result.assets[0];
    }
    return null;
  } catch (error) {
    console.error('Error picking PDF:', error);
    Alert.alert('Error', 'Failed to pick PDF file');
    return null;
  }
};

export const pickMultiplePdfs = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      return result.assets; // returns an array
    }
    return null;
  } catch (error) {
    console.error('Error picking PDFs:', error);
    Alert.alert('Error', 'Failed to pick PDF files');
    return null;
  }
};

export const pickImages = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      return result.assets;
    }
    return null;
  } catch (error) {
    console.error('Error picking images:', error);
    Alert.alert('Error', 'Failed to pick image files');
    return null;
  }
};

export const saveFile = async (data: string | Uint8Array, fileName: string) => {
  try {
    const dir = `${FileSystem.documentDirectory}PdfTools/`;
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }

    const fileUri = `${dir}${fileName}`;
    
    if (typeof data === 'string') {
      await FileSystem.writeAsStringAsync(fileUri, data, { encoding: 'base64' });
    } else {
      // For Uint8Array, we need to convert to base64 first
      const base64 = Uint8ArrayToBase64(data);
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });
    }

    return fileUri;
  } catch (error) {
    console.error('Error saving file:', error);
    Alert.alert('Error', 'Failed to save file');
    return null;
  }
};

export const shareFile = async (uri: string) => {
  if (!(await Sharing.isAvailableAsync())) {
    Alert.alert('Error', 'Sharing is not available on this device');
    return;
  }
  await Sharing.shareAsync(uri);
};

// Helper to convert Uint8Array to Base64
function Uint8ArrayToBase64(array: Uint8Array): string {
  let binary = '';
  const len = array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
}
