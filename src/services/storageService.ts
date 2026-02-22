/**
 * storageService.ts
 *
 * Manages a persistent, user-chosen output directory using Android's
 * Storage Access Framework (SAF). The granted directoryUri is stored
 * in AsyncStorage so the folder picker only shows once.
 *
 * On iOS, saving is delegated to the system share sheet (Files app).
 */

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

const SAF_URI_KEY = '@pdftoolkit_output_dir';

// ── Persist / retrieve the granted SAF URI ────────────────────────────────────

export async function getOutputDirUri(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SAF_URI_KEY);
  } catch {
    return null;
  }
}

async function setOutputDirUri(uri: string): Promise<void> {
  await AsyncStorage.setItem(SAF_URI_KEY, uri);
}

/** Call this from Settings to let the user re-pick the folder. */
export async function clearOutputDir(): Promise<void> {
  await AsyncStorage.removeItem(SAF_URI_KEY);
}

// ── Pick a folder (shows the folder chooser) ──────────────────────────────────

async function pickAndStoreOutputDir(): Promise<string | null> {
  const result = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!result.granted) return null;
  await setOutputDirUri(result.directoryUri);
  return result.directoryUri;
}

// ── Main export: save a file to the output directory ─────────────────────────

/**
 * Saves `sourceUri` as `fileName` to the PdfToolkit output folder.
 *
 * Android flow:
 *   1. If no output dir stored → open folder picker (user navigates to
 *      Documents/PdfToolkit and grants access).
 *   2. Write file via SAF.
 *
 * iOS flow:
 *   Opens the share sheet to the Files app.
 */
export async function saveToOutputDir(
  sourceUri: string,
  fileName: string,
): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      // Get stored directory or ask user to pick one
      let dirUri = await getOutputDirUri();
      if (!dirUri) {
        Alert.alert(
          'Choose Output Folder',
          'Please navigate to your Documents folder and choose (or create) a "PdfToolkit" folder. This is a one-time setup.',
          [{ text: 'OK' }],
        );
        dirUri = await pickAndStoreOutputDir();
        if (!dirUri) return false; // user cancelled
      }

      // Read source file as base64 and write to chosen directory
      const base64 = await FileSystem.readAsStringAsync(sourceUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
        dirUri,
        fileName,
        'application/pdf',
      );
      await FileSystem.writeAsStringAsync(destUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert('Saved! 🎉', `"${fileName}" saved to your chosen folder.`);
      return true;
    } else {
      // iOS: share sheet → Files app / iCloud Drive / AirDrop etc.
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(sourceUri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: 'Save PDF to…',
        });
      }
      return true;
    }
  } catch (err: any) {
    // If the stored URI has expired (device reboot, permissions revoked), clear and retry
    if (
      err?.message?.includes('Permission') ||
      err?.message?.includes('permission') ||
      err?.message?.includes('Couldn\'t')
    ) {
      await clearOutputDir();
      Alert.alert(
        'Folder Access Lost',
        'The saved folder permission has expired. Please choose your output folder again.',
      );
    } else {
      console.error('saveToOutputDir error:', err);
      Alert.alert('Error', 'Could not save the file. Please try again.');
    }
    return false;
  }
}

/** Opens the folder picker to change the output directory. */
export async function changeOutputDir(): Promise<void> {
  await clearOutputDir();
  Alert.alert(
    'Change Output Folder',
    'Please navigate to the folder where you want to save your processed PDFs (e.g. Documents/PdfToolkit).',
    [{ text: 'Choose Folder', onPress: () => pickAndStoreOutputDir() }, { text: 'Cancel', style: 'cancel' }],
  );
}
