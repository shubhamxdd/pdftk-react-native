import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { theme } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { pickPdf } from '../../services/fileService';
import { pdfService } from '../../services/pdfService';
import SuccessCard from '../../components/SuccessCard';

const CompressPdfScreen = () => {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ uri: string; name: string } | null>(null);

  const handlePickFile = async () => {
    const file = await pickPdf();
    if (file) setSelectedFile(file);
  };

  const handleCompress = async () => {
    if (!selectedFile) { Alert.alert('Compress PDF', 'Please select a PDF file.'); return; }

    setIsProcessing(true);
    try {
      const doc = await pdfService.loadDoc(selectedFile.uri);
      const compressedBytes = await doc.save({ useObjectStreams: true });
      const fileName = `compressed_${Date.now()}.pdf`;

      const dir = `${FileSystem.documentDirectory}PdfTools/`;
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const savedUri = `${dir}${fileName}`;
      let binary = '';
      compressedBytes.forEach(b => { binary += String.fromCharCode(b); });
      await FileSystem.writeAsStringAsync(savedUri, btoa(binary), { encoding: 'base64' });

      setResult({ uri: savedUri, name: fileName });
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while compressing the PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (result) {
    return (
      <View style={styles.container}>
        <SuccessCard
          title="Compressed Successfully!"
          fileName={result.name}
          fileUri={result.uri}
          onDismiss={() => setResult(null)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Compress PDF</Text>
          <Text style={styles.subtitle}>Reduce PDF file size by optimizing internal structures.</Text>
        </View>

        {!selectedFile ? (
          <TouchableOpacity style={styles.uploadBox} onPress={handlePickFile}>
            <MaterialCommunityIcons name="file-restore" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.uploadText}>Select PDF to Compress</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fileCard}>
            <View style={styles.fileInfo}>
              <MaterialCommunityIcons name="file-pdf-box" size={40} color={theme.colors.primary} />
              <View style={styles.fileNameContainer}>
                <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <MaterialCommunityIcons name="close-circle" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.infoText}>
                Compression is offline and removes redundant data. Results may vary depending on the original PDF.
              </Text>
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={handleCompress} disabled={isProcessing}>
              {isProcessing ? <ActivityIndicator color="white" /> : (
                <>
                  <MaterialCommunityIcons name="file-percent" size={24} color="white" />
                  <Text style={styles.buttonText}>Compress Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: spacing.lg, paddingTop: spacing.xl },
  header: { marginBottom: spacing.xl },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 },
  uploadBox: {
    backgroundColor: theme.colors.surface, padding: spacing.xxl, borderRadius: 20,
    borderWidth: 2, borderColor: theme.colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl,
  },
  uploadText: { color: theme.colors.text, fontSize: 16, fontWeight: '500', marginTop: spacing.md },
  fileCard: {
    backgroundColor: theme.colors.surface, borderRadius: 20,
    padding: spacing.lg, borderWidth: 1, borderColor: theme.colors.border,
  },
  fileInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  fileNameContainer: { flex: 1, marginLeft: spacing.md },
  fileName: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' },
  fileSize: { color: theme.colors.textSecondary, fontSize: 12 },
  infoBox: {
    backgroundColor: theme.colors.surfaceSecondary, padding: spacing.md,
    borderRadius: 12, flexDirection: 'row', marginBottom: spacing.xl, gap: 8,
  },
  infoText: { flex: 1, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 18 },
  actionButton: {
    backgroundColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', padding: spacing.md, borderRadius: 12, gap: 8,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default CompressPdfScreen;
