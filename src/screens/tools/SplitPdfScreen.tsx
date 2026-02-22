import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useAppTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/spacing';
import { pickPdf } from '../../services/fileService';
import { pdfService } from '../../services/pdfService';
import SuccessCard from '../../components/SuccessCard';
import ProgressBar from '../../components/ProgressBar';

const STEPS = ['Select File', 'Extracting Pages', 'Saving Output'];

const SplitPdfScreen = () => {
  const { theme } = useAppTheme();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [pageRange, setPageRange] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<{ uri: string; name: string; size: number } | null>(null);

  const handlePickFile = async () => {
    const file = await pickPdf();
    if (file) setSelectedFile(file);
  };

  const parseRange = (rangeStr: string, maxPages: number): number[] => {
    const pages: number[] = [];
    for (const part of rangeStr.split(',').map(p => p.trim())) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n, 10));
        if (!isNaN(start) && !isNaN(end))
          for (let i = start; i <= end; i++)
            if (i > 0 && i <= maxPages) pages.push(i - 1);
      } else {
        const page = parseInt(part, 10);
        if (!isNaN(page) && page > 0 && page <= maxPages) pages.push(page - 1);
      }
    }
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (!selectedFile) { Alert.alert('Split PDF', 'Please select a PDF file.'); return; }
    if (!pageRange.trim()) { Alert.alert('Split PDF', 'Please enter a page range (e.g. 1-3, 5).'); return; }

    setIsProcessing(true);
    setProgressStep(1);
    try {
      const doc = await pdfService.loadDoc(selectedFile.uri);
      const totalPages = doc.getPageCount();
      const pageIndices = parseRange(pageRange, totalPages);

      if (pageIndices.length === 0) {
        Alert.alert('Error', `Invalid range. This PDF has ${totalPages} pages.`);
        return;
      }

      const splitBytes = await pdfService.splitPdf(selectedFile.uri, pageIndices);

      setProgressStep(2);
      const fileName = `split_${Date.now()}.pdf`;
      const dir = `${FileSystem.documentDirectory}PdfTools/`;
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const savedUri = `${dir}${fileName}`;
      let binary = '';
      splitBytes.forEach(b => { binary += String.fromCharCode(b); });
      await FileSystem.writeAsStringAsync(savedUri, btoa(binary), { encoding: 'base64' });

      setResult({ uri: savedUri, name: fileName, size: splitBytes.length });
      setSelectedFile(null);
      setPageRange('');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while splitting the PDF.');
    } finally {
      setIsProcessing(false);
      setProgressStep(0);
    }
  };

  if (result) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SuccessCard
          title="Split Successfully!"
          fileName={result.name}
          fileUri={result.uri}
          fileSize={result.size}
          toolType="split"
          onDismiss={() => setResult(null)}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Split PDF</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Extract specific pages and save them as a new PDF.
          </Text>
        </View>

        {isProcessing && <ProgressBar steps={STEPS} currentStep={progressStep} theme={theme} />}

        {!selectedFile ? (
          <TouchableOpacity
            style={[styles.uploadBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handlePickFile}
          >
            <MaterialCommunityIcons name="file-upload-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.uploadText, { color: theme.text }]}>Select PDF to Split</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.fileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.fileInfo}>
              <MaterialCommunityIcons name="file-pdf-box" size={40} color={theme.primary} />
              <View style={styles.fileNameContainer}>
                <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>{selectedFile.name}</Text>
                <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <MaterialCommunityIcons name="close-circle" size={24} color={theme.error} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Page Range</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.text, borderColor: theme.border,
                }]}
                placeholder="e.g. 1-3, 5, 8-10"
                placeholderTextColor={theme.textSecondary}
                value={pageRange}
                onChangeText={setPageRange}
              />
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                Use commas for separate pages and dashes for ranges.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={handleSplit}
              disabled={isProcessing}
            >
              {isProcessing ? <ActivityIndicator color="white" /> : (
                <>
                  <MaterialCommunityIcons name="content-cut" size={24} color="white" />
                  <Text style={styles.buttonText}>Extract Pages</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingTop: spacing.xl },
  header: { marginBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  uploadBox: {
    padding: spacing.xxl, borderRadius: 20,
    borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl,
  },
  uploadText: { fontSize: 16, fontWeight: '500', marginTop: spacing.md },
  fileCard: { borderRadius: 20, padding: spacing.lg, borderWidth: 1 },
  fileInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  fileNameContainer: { flex: 1, marginLeft: spacing.md },
  fileName: { fontSize: 18, fontWeight: 'bold' },
  fileSize: { fontSize: 12 },
  inputSection: { marginBottom: spacing.xl },
  inputLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.sm },
  input: {
    borderRadius: 12, padding: spacing.md, fontSize: 16, borderWidth: 1,
  },
  tipText: { fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  actionButton: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', padding: spacing.md, borderRadius: 12, gap: 8,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default SplitPdfScreen;
