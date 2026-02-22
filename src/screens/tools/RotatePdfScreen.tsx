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

const RotatePdfScreen = () => {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [rotation, setRotation] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ uri: string; name: string } | null>(null);

  const handlePickFile = async () => {
    const file = await pickPdf();
    if (file) setSelectedFile(file);
  };

  const handleRotate = async () => {
    if (!selectedFile) { Alert.alert('Rotate PDF', 'Please select a PDF file.'); return; }

    setIsProcessing(true);
    try {
      const doc = await pdfService.loadDoc(selectedFile.uri);
      const allPages = doc.getPageIndices();
      const rotatedBytes = await pdfService.rotatePdf(selectedFile.uri, rotation, allPages);
      const fileName = `rotated_${Date.now()}.pdf`;

      const dir = `${FileSystem.documentDirectory}PdfTools/`;
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const savedUri = `${dir}${fileName}`;
      let binary = '';
      rotatedBytes.forEach(b => { binary += String.fromCharCode(b); });
      await FileSystem.writeAsStringAsync(savedUri, btoa(binary), { encoding: 'base64' });

      setResult({ uri: savedUri, name: fileName });
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while rotating the PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (result) {
    return (
      <View style={styles.container}>
        <SuccessCard
          title="Rotated Successfully!"
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
          <Text style={styles.title}>Rotate PDF</Text>
          <Text style={styles.subtitle}>Rotate all pages in your PDF by a specific angle.</Text>
        </View>

        {!selectedFile ? (
          <TouchableOpacity style={styles.uploadBox} onPress={handlePickFile}>
            <MaterialCommunityIcons name="rotate-right" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.uploadText}>Select PDF to Rotate</Text>
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

            <Text style={styles.sectionTitle}>Select Rotation Angle</Text>
            <View style={styles.angleGrid}>
              {[90, 180, 270].map((angle) => (
                <TouchableOpacity
                  key={angle}
                  style={[styles.angleButton, rotation === angle && styles.angleButtonActive]}
                  onPress={() => setRotation(angle)}
                >
                  <MaterialCommunityIcons
                    name={angle === 90 ? 'rotate-right' : angle === 180 ? 'ray-start-end' : 'rotate-left'}
                    size={24}
                    color={rotation === angle ? 'white' : theme.colors.text}
                  />
                  <Text style={[styles.angleText, rotation === angle && styles.angleTextActive]}>{angle}°</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={handleRotate} disabled={isProcessing}>
              {isProcessing ? <ActivityIndicator color="white" /> : (
                <>
                  <MaterialCommunityIcons name="sync" size={24} color="white" />
                  <Text style={styles.buttonText}>Rotate PDF</Text>
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
  sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: spacing.md },
  angleGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  angleButton: {
    flex: 1, backgroundColor: theme.colors.surfaceSecondary, padding: spacing.md,
    borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, gap: 4,
  },
  angleButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  angleText: { color: theme.colors.text, fontSize: 14, fontWeight: '500' },
  angleTextActive: { color: 'white' },
  actionButton: {
    backgroundColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', padding: spacing.md, borderRadius: 12, gap: 8,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default RotatePdfScreen;
