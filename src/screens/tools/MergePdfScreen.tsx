import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { theme } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { pickMultiplePdfs } from '../../services/fileService';
import { pdfService } from '../../services/pdfService';
import SuccessCard from '../../components/SuccessCard';

const MergePdfScreen = () => {
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ uri: string; name: string } | null>(null);

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
    try {
      const uris = selectedFiles.map(f => f.uri);
      const mergedBytes = await pdfService.mergePdfs(uris);
      const fileName = `merged_${Date.now()}.pdf`;

      const dir = `${FileSystem.documentDirectory}PdfTools/`;
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const savedUri = `${dir}${fileName}`;
      let binary = '';
      mergedBytes.forEach(b => { binary += String.fromCharCode(b); });
      await FileSystem.writeAsStringAsync(savedUri, btoa(binary), { encoding: 'base64' });

      setResult({ uri: savedUri, name: fileName });
      setSelectedFiles([]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while merging PDFs.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <View style={styles.container}>
        <SuccessCard
          title="Merged Successfully!"
          fileName={result.name}
          fileUri={result.uri}
          onDismiss={() => setResult(null)}
        />
      </View>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Merge PDFs</Text>
        <Text style={styles.subtitle}>Select multiple files to combine them into one.</Text>
      </View>

      <FlatList
        data={selectedFiles}
        keyExtractor={(_, index) => index.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <View style={styles.fileItem}>
            <View style={styles.orderBadge}>
              <Text style={styles.orderText}>{index + 1}</Text>
            </View>
            <MaterialCommunityIcons name="file-pdf-box" size={32} color={theme.colors.primary} />
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.fileSize}>{(item.size / 1024 / 1024).toFixed(2)} MB</Text>
            </View>
            <TouchableOpacity onPress={() => removeFile(index)}>
              <MaterialCommunityIcons name="close-circle" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <TouchableOpacity style={styles.emptyState} onPress={handlePickFile}>
            <MaterialCommunityIcons name="plus-circle-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>Tap to add PDFs</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addButton, selectedFiles.length > 0 && styles.addButtonSmall]}
          onPress={handlePickFile}
          disabled={isProcessing}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
          <Text style={styles.buttonText}>Add Files</Text>
        </TouchableOpacity>

        {selectedFiles.length >= 2 && (
          <TouchableOpacity style={styles.mergeButton} onPress={handleMerge} disabled={isProcessing}>
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
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 },
  list: { flex: 1 },
  listContent: { padding: spacing.lg },
  fileItem: {
    backgroundColor: theme.colors.surface, padding: spacing.md, borderRadius: 12,
    marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.border, gap: spacing.sm,
  },
  orderBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  orderText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  fileInfo: { flex: 1, marginLeft: 4 },
  fileName: { color: theme.colors.text, fontSize: 15, fontWeight: '500' },
  fileSize: { color: theme.colors.textSecondary, fontSize: 12 },
  emptyState: {
    padding: spacing.xxl, justifyContent: 'center', alignItems: 'center',
    backgroundColor: theme.colors.surface, borderRadius: 16,
    borderStyle: 'dashed', borderWidth: 1, borderColor: theme.colors.border, marginTop: spacing.xl,
  },
  emptyText: { color: theme.colors.textSecondary, marginTop: spacing.sm },
  footer: { padding: spacing.lg, flexDirection: 'row', gap: spacing.md },
  addButton: {
    flex: 1, backgroundColor: theme.colors.secondary, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', padding: spacing.md, borderRadius: 12, gap: 8,
  },
  addButtonSmall: { flex: 0.4 },
  mergeButton: {
    flex: 1, backgroundColor: theme.colors.primary, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', padding: spacing.md, borderRadius: 12, gap: 8,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default MergePdfScreen;
