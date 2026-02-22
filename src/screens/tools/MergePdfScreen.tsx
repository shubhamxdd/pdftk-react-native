import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useAppTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/spacing';
import { pickMultiplePdfs } from '../../services/fileService';
import { pdfService } from '../../services/pdfService';
import SuccessCard from '../../components/SuccessCard';
import ProgressBar from '../../components/ProgressBar';

const STEPS = ['Select Files', 'Merging PDFs', 'Saving File'];

const MergePdfScreen = () => {
  const { theme } = useAppTheme();
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<{ uri: string; name: string; size: number } | null>(null);

  const handlePickFile = async () => {
    const files = await pickMultiplePdfs();
    if (files && files.length > 0) setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (selectedFiles.length < 2) {
      Alert.alert('Merge PDF', 'Please select at least 2 PDF files.');
      return;
    }
    setIsProcessing(true);
    setProgressStep(1);
    try {
      const uris = selectedFiles.map(f => f.uri);
      const mergedBytes = await pdfService.mergePdfs(uris);

      setProgressStep(2);
      const fileName = `merged_${Date.now()}.pdf`;
      const dir = `${FileSystem.documentDirectory}PdfTools/`;
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const savedUri = `${dir}${fileName}`;
      let binary = '';
      mergedBytes.forEach(b => { binary += String.fromCharCode(b); });
      await FileSystem.writeAsStringAsync(savedUri, btoa(binary), { encoding: 'base64' });

      setResult({ uri: savedUri, name: fileName, size: mergedBytes.length });
      setSelectedFiles([]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while merging PDFs.');
    } finally {
      setIsProcessing(false);
      setProgressStep(0);
    }
  };

  if (result) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SuccessCard
          title="Merged Successfully!"
          fileName={result.name}
          fileUri={result.uri}
          fileSize={result.size}
          toolType="merge"
          onDismiss={() => setResult(null)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Merge PDFs</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Select multiple files to combine them into one.
        </Text>
      </View>

      {isProcessing && <ProgressBar steps={STEPS} currentStep={progressStep} theme={theme} />}

      <FlatList
        data={selectedFiles}
        keyExtractor={(_, index) => index.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <View style={[styles.fileItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.orderBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.orderText}>{index + 1}</Text>
            </View>
            <MaterialCommunityIcons name="file-pdf-box" size={32} color={theme.primary} />
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
                {(item.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeFile(index)}>
              <MaterialCommunityIcons name="close-circle" size={24} color={theme.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <TouchableOpacity
            style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handlePickFile}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Tap to add PDFs</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.secondary },
            selectedFiles.length > 0 && styles.addButtonSmall]}
          onPress={handlePickFile}
          disabled={isProcessing}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
          <Text style={styles.buttonText}>Add Files</Text>
        </TouchableOpacity>

        {selectedFiles.length >= 2 && (
          <TouchableOpacity
            style={[styles.mergeButton, { backgroundColor: theme.primary }]}
            onPress={handleMerge}
            disabled={isProcessing}
          >
            {isProcessing ? <ActivityIndicator color="white" /> : (
              <>
                <MaterialCommunityIcons name="vector-combine" size={24} color="white" />
                <Text style={styles.buttonText}>Merge Now</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  list: { flex: 1 },
  listContent: { padding: spacing.lg },
  fileItem: {
    padding: spacing.md, borderRadius: 12, marginBottom: spacing.md,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, gap: spacing.sm,
  },
  orderBadge: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  orderText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  fileInfo: { flex: 1, marginLeft: 4 },
  fileName: { fontSize: 15, fontWeight: '500' },
  fileSize: { fontSize: 12 },
  emptyState: {
    padding: spacing.xxl, justifyContent: 'center', alignItems: 'center',
    borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, marginTop: spacing.xl,
  },
  emptyText: { marginTop: spacing.sm },
  footer: { padding: spacing.lg, flexDirection: 'row', gap: spacing.md },
  addButton: {
    flex: 1, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', padding: spacing.md, borderRadius: 12, gap: 8,
  },
  addButtonSmall: { flex: 0.4 },
  mergeButton: {
    flex: 1, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', padding: spacing.md, borderRadius: 12, gap: 8,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default MergePdfScreen;
