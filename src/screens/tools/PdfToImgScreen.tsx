import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAppTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/spacing';

const PdfToImgScreen = () => {
  const { theme } = useAppTheme();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setProcessing(true);
    
    // NOTE: Requires native PDF rendering for high-quality images.
    setTimeout(() => {
      setProcessing(false);
      Alert.alert('Note', 'PDF to Image conversion is coming soon with native rendering support.');
    }, 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="file-image" size={64} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>PDF to Images</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Convert PDF pages into JPG images</Text>
      </View>

      {!selectedFile ? (
        <TouchableOpacity style={[styles.picker, { borderColor: theme.border, backgroundColor: theme.surface }]} onPress={pickDocument}>
          <MaterialCommunityIcons name="file-pdf-box" size={48} color={theme.textSecondary} />
          <Text style={[styles.pickerText, { color: theme.textSecondary }]}>Select PDF File</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.selectedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="file-check" size={24} color={theme.success} />
          <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>{selectedFile.name}</Text>
          <TouchableOpacity onPress={() => setSelectedFile(null)}>
            <MaterialCommunityIcons name="close-circle" size={24} color={theme.error} />
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.primary, opacity: !selectedFile ? 0.5 : 1 }]} 
        onPress={handleProcess}
        disabled={!selectedFile || processing}
      >
        {processing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Convert to Images</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  picker: {
    height: 160,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  pickerText: {
    marginTop: spacing.sm,
    fontSize: 16,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  fileName: {
    flex: 1,
    fontSize: 16,
  },
  button: {
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

export default PdfToImgScreen;
