import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useAppTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/spacing';
import { pickPdf } from '../../services/fileService';
import { pdfService } from '../../services/pdfService';
import SuccessCard from '../../components/SuccessCard';
import ProgressBar from '../../components/ProgressBar';

const STEPS = ['Select File', 'Rotating Pages', 'Saving Output'];

const RotatePdfScreen = () => {
  const { theme } = useAppTheme();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [rotation, setRotation] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<{ uri: string; name: string; size: number } | null>(null);

  const handlePickFile = async () => {
    const file = await pickPdf();
    if (file) setSelectedFile(file);
  };

  const handleRotate = async () => {
    if (!selectedFile) { Alert.alert('Rotate PDF', 'Please select a PDF file.'); return; }
    setIsProcessing(true);
    setProgressStep(1);
    try {
      const doc = await pdfService.loadDoc(selectedFile.uri);
      const allPages = doc.getPageIndices();
      const rotatedBytes = await pdfService.rotatePdf(selectedFile.uri, rotation, allPages);

      setProgressStep(2);
      const fileName = `rotated_${Date.now()}.pdf`;
      const dir = `${FileSystem.documentDirectory}PdfTools/`;
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const savedUri = `${dir}${fileName}`;
      let binary = '';
      rotatedBytes.forEach(b => { binary += String.fromCharCode(b); });
      await FileSystem.writeAsStringAsync(savedUri, btoa(binary), { encoding: 'base64' });

      setResult({ uri: savedUri, name: fileName, size: rotatedBytes.length });
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while rotating the PDF.');
    } finally {
      setIsProcessing(false);
      setProgressStep(0);
    }
  };

  if (result) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SuccessCard
          title="Rotated Successfully!"
          fileName={result.name}
          fileUri={result.uri}
          fileSize={result.size}
          toolType="rotate"
          onDismiss={() => setResult(null)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Rotate PDF</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Rotate all pages in your PDF by a specific angle.
          </Text>
        </View>

        {isProcessing && <ProgressBar steps={STEPS} currentStep={progressStep} theme={theme} />}

        {!selectedFile ? (
          <TouchableOpacity
            style={[styles.uploadBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handlePickFile}
          >
            <MaterialCommunityIcons name="rotate-right" size={64} color={theme.textSecondary} />
            <Text style={[styles.uploadText, { color: theme.text }]}>Select PDF to Rotate</Text>
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

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Rotation Angle</Text>
            <View style={styles.angleGrid}>
              {[90, 180, 270].map((angle) => (
                <TouchableOpacity
                  key={angle}
                  style={[
                    styles.angleButton,
                    { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                    rotation === angle && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setRotation(angle)}
                >
                  <MaterialCommunityIcons
                    name={angle === 90 ? 'rotate-right' : angle === 180 ? 'ray-start-end' : 'rotate-left'}
                    size={24}
                    color={rotation === angle ? 'white' : theme.text}
                  />
                  <Text style={[styles.angleText, { color: rotation === angle ? 'white' : theme.text }]}>
                    {angle}°
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={handleRotate}
              disabled={isProcessing}
            >
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
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.md },
  angleGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  angleButton: {
    flex: 1, padding: spacing.md, borderRadius: 12,
    alignItems: 'center', borderWidth: 1, gap: 4,
  },
  angleText: { fontSize: 14, fontWeight: '500' },
  actionButton: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', padding: spacing.md, borderRadius: 12, gap: 8,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default RotatePdfScreen;
