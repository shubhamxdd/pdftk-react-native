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

// ─── Compression level definitions ───────────────────────────────────────────
const LEVELS = [
  {
    id: 'low',
    label: 'Low',
    pct: '~10–20%',
    icon: 'speedometer-slow',
    color: '#10B981',
    description: 'Basic re-save. Fastest, minimal size change.',
    saveOptions: { useObjectStreams: false },
    stripMetadata: false,
  },
  {
    id: 'medium',
    label: 'Medium',
    pct: '~20–40%',
    icon: 'speedometer-medium',
    color: '#3B82F6',
    description: 'Enables object streams for moderate reduction.',
    saveOptions: { useObjectStreams: true },
    stripMetadata: false,
  },
  {
    id: 'high',
    label: 'High',
    pct: '~30–50%',
    icon: 'speedometer',
    color: '#F59E0B',
    description: 'Object streams + strips document metadata.',
    saveOptions: { useObjectStreams: true },
    stripMetadata: true,
  },
  {
    id: 'max',
    label: 'Max',
    pct: '~40–60%',
    icon: 'rocket-launch-outline',
    color: '#EF4444',
    description: 'Strips everything possible. Best size reduction.',
    saveOptions: { useObjectStreams: true },
    stripMetadata: true,
  },
] as const;

type LevelId = typeof LEVELS[number]['id'];

const formatSize = (bytes: number) => {
  const kb = bytes / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
};

const STEPS = ['Select File', 'Compressing', 'Saving Output'];

// ─── Screen ───────────────────────────────────────────────────────────────────
const CompressPdfScreen = () => {
  const { theme } = useAppTheme();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<LevelId>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<{
    uri: string; name: string;
    originalSize: number; compressedSize: number;
  } | null>(null);

  const handlePickFile = async () => {
    const file = await pickPdf();
    if (file) setSelectedFile(file);
  };

  const handleCompress = async () => {
    if (!selectedFile) { Alert.alert('Compress PDF', 'Please select a PDF file.'); return; }

    setIsProcessing(true);
    setProgressStep(1);
    try {
      const level = LEVELS.find(l => l.id === selectedLevel)!;
      const doc = await pdfService.loadDoc(selectedFile.uri);

      if (level.stripMetadata) {
        doc.setTitle('');
        doc.setAuthor('');
        doc.setSubject('');
        doc.setKeywords([]);
        doc.setProducer('');
        doc.setCreator('');
      }

      const compressedBytes = await doc.save(level.saveOptions);

      setProgressStep(2);
      const fileName = `compressed_${Date.now()}.pdf`;
      const dir = `${FileSystem.documentDirectory}PdfTools/`;
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const savedUri = `${dir}${fileName}`;
      let binary = '';
      compressedBytes.forEach(b => { binary += String.fromCharCode(b); });
      await FileSystem.writeAsStringAsync(savedUri, btoa(binary), { encoding: 'base64' });

      setResult({
        uri: savedUri,
        name: fileName,
        originalSize: selectedFile.size,
        compressedSize: compressedBytes.length,
      });
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while compressing the PDF.');
    } finally {
      setIsProcessing(false);
      setProgressStep(0);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (result) {
    const saved = result.originalSize - result.compressedSize;
    const pct = ((saved / result.originalSize) * 100).toFixed(1);
    const savedPositive = saved > 0;

    // Honesty message when compression didn't help
    const honestyMessage = !savedPositive
      ? '⚠️ This PDF is already well-optimized — no size reduction was possible with this method.'
      : null;

    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Before / After stats */}
        <View style={[styles.statsBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Original</Text>
            <Text style={[styles.statValue, { color: theme.textSecondary }]}>
              {formatSize(result.originalSize)}
            </Text>
          </View>
          <MaterialCommunityIcons name="arrow-right-bold" size={20} color={theme.primary} />
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Compressed</Text>
            <Text style={[styles.statValue, { color: savedPositive ? theme.success : theme.error }]}>
              {formatSize(result.compressedSize)}
            </Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: `${savedPositive ? theme.success : theme.error}20` }]}>
            <Text style={[styles.statBadgeText, { color: savedPositive ? theme.success : theme.error }]}>
              {savedPositive ? `−${pct}%` : `+${Math.abs(Number(pct))}%`}
            </Text>
          </View>
        </View>

        {/* Honesty message for already-optimized PDFs */}
        {honestyMessage && (
          <View style={[styles.honestyBox, { backgroundColor: `${theme.error}15`, borderColor: `${theme.error}40` }]}>
            <Text style={[styles.honestyText, { color: theme.error }]}>{honestyMessage}</Text>
          </View>
        )}

        <SuccessCard
          title={savedPositive ? 'Compressed Successfully!' : 'Already Optimized'}
          fileName={result.name}
          fileUri={result.uri}
          fileSize={result.compressedSize}
          toolType="compress"
          onDismiss={() => setResult(null)}
        />
      </View>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  const level = LEVELS.find(l => l.id === selectedLevel)!;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Compress PDF</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Reduce PDF file size by optimizing internal structures.
          </Text>
        </View>

        {isProcessing && <ProgressBar steps={STEPS} currentStep={progressStep} theme={theme} />}

        {!selectedFile ? (
          <TouchableOpacity
            style={[styles.uploadBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handlePickFile}
          >
            <MaterialCommunityIcons name="file-restore" size={64} color={theme.textSecondary} />
            <Text style={[styles.uploadText, { color: theme.text }]}>Select PDF to Compress</Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={[styles.fileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="file-pdf-box" size={40} color={theme.primary} />
              <View style={styles.fileNameContainer}>
                <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>{selectedFile.name}</Text>
                <Text style={[styles.fileSize, { color: theme.textSecondary }]}>{formatSize(selectedFile.size)}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <MaterialCommunityIcons name="close-circle" size={24} color={theme.error} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Compression Level</Text>
            <View style={styles.levelGrid}>
              {LEVELS.map(l => (
                <TouchableOpacity
                  key={l.id}
                  style={[
                    styles.levelCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    selectedLevel === l.id && { borderColor: l.color, backgroundColor: `${l.color}15` },
                  ]}
                  onPress={() => setSelectedLevel(l.id)}
                >
                  <MaterialCommunityIcons
                    name={l.icon as any}
                    size={28}
                    color={selectedLevel === l.id ? l.color : theme.textSecondary}
                  />
                  <Text style={[styles.levelLabel, { color: selectedLevel === l.id ? l.color : theme.text }]}>
                    {l.label}
                  </Text>
                  <Text style={[styles.levelPct, { color: theme.textSecondary }]}>{l.pct}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.infoBox, { backgroundColor: theme.surfaceSecondary }]}>
              <MaterialCommunityIcons name="information-outline" size={18} color={level.color} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>{level.description}</Text>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={handleCompress}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="file-percent" size={24} color="white" />
                  <Text style={styles.buttonText}>Compress Now</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  fileCard: {
    borderRadius: 16, padding: spacing.md, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg,
  },
  fileNameContainer: { flex: 1 },
  fileName: { fontSize: 15, fontWeight: 'bold' },
  fileSize: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.md },
  levelGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  levelCard: {
    flex: 1, alignItems: 'center', borderRadius: 14,
    padding: spacing.md, borderWidth: 2, gap: 4,
  },
  levelLabel: { fontSize: 13, fontWeight: 'bold' },
  levelPct: { fontSize: 10, textAlign: 'center' },
  infoBox: {
    padding: spacing.md, borderRadius: 12,
    flexDirection: 'row', marginBottom: spacing.xl, gap: 8, alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  actionButton: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', padding: spacing.md, borderRadius: 12, gap: 8,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  // Stats bar (success state)
  statsBar: {
    flexDirection: 'row', alignItems: 'center',
    margin: spacing.lg, marginBottom: 0,
    borderRadius: 16, padding: spacing.lg,
    borderWidth: 1, gap: spacing.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  statBadge: { borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  statBadgeText: { fontSize: 14, fontWeight: 'bold' },
  // Honesty message
  honestyBox: {
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    borderRadius: 12, padding: spacing.md, borderWidth: 1,
  },
  honestyText: { fontSize: 13, lineHeight: 18 },
});

export default CompressPdfScreen;
