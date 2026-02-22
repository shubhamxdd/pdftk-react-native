import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAppTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/spacing';
import { pdfService } from '../../services/pdfService';

const ReorderPdfScreen = () => {
  const { theme } = useAppTheme();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
        // In a real app, we'd load the PDF and get page thumbnails
        // For now, we'll simulate logic
        setPages([1, 2, 3, 4, 5].map(i => ({ id: i.toString(), originalIndex: i })));
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const movePage = (index: number, direction: 'up' | 'down') => {
    const newPages = [...pages];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < pages.length) {
      [newPages[index], newPages[newIndex]] = [newPages[newIndex], newPages[index]];
      setPages(newPages);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setProcessing(true);
    try {
      const pageIndices = pages.map(p => p.originalIndex - 1);
      const reorderedBytes = await pdfService.reorderPages(selectedFile.uri, pageIndices);
      const fileName = `reordered_${Date.now()}.pdf`;
      const savedUri = await pdfService.saveProcessedFile(reorderedBytes, fileName);
      Alert.alert('Success', `PDF reordered and saved to: ${savedUri}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to reorder PDF');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {!selectedFile ? (
        <TouchableOpacity style={[styles.picker, { borderColor: theme.border, backgroundColor: theme.surface }]} onPress={pickDocument}>
          <MaterialCommunityIcons name="file-pdf-box" size={64} color={theme.primary} />
          <Text style={[styles.pickerText, { color: theme.textSecondary }]}>Select PDF to Reorder</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.listContainer}>
          <Text style={[styles.fileName, { color: theme.text }]}>File: {selectedFile.name}</Text>
          <FlatList
            data={pages}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={[styles.pageItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.pageNumber, { backgroundColor: theme.surfaceSecondary }]}>
                  <Text style={{ color: theme.text }}>Page {item.originalIndex}</Text>
                </View>
                <View style={styles.controls}>
                  <TouchableOpacity onPress={() => movePage(index, 'up')} disabled={index === 0}>
                    <MaterialCommunityIcons 
                      name="chevron-up" 
                      size={24} 
                      color={index === 0 ? theme.border : theme.primary} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => movePage(index, 'down')} disabled={index === pages.length - 1}>
                    <MaterialCommunityIcons 
                      name="chevron-down" 
                      size={24} 
                      color={index === pages.length - 1 ? theme.border : theme.primary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]} 
            onPress={handleProcess}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Save Reordered PDF</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  picker: {
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  pageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  pageNumber: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ReorderPdfScreen;
