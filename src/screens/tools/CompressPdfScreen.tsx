import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { PDFDocument } from 'pdf-lib';
import { theme } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { pickPdf } from '../../services/fileService';
import { pdfService } from '../../services/pdfService';
import SuccessCard from '../../components/SuccessCard';

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
    stripAnnotations: false, // future-proof flag
  },
] as const;

type LevelId = typeof LEVELS[number]['id'];

const formatSize = (bytes: number) => {
  const kb = bytes / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const CompressPdfScreen = () => {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<LevelId>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
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
    try {
      const level = LEVELS.find(l => l.id === selectedLevel)!;
      const doc = await pdfService.loadDoc(selectedFile.uri);

      // Strip metadata for High / Max
      if (level.stripMetadata) {
        doc.setTitle('');
        doc.setAuthor('');
        doc.setSubject('');
        doc.setKeywords([]);
        doc.setProducer('');
        doc.setCreator('');
      }

      const compressedBytes = await doc.save(level.saveOptions);
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
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (result) {
    const saved = result.originalSize - result.compressedSize;
    const pct = ((saved / result.originalSize) * 100).toFixed(1);
    const savedPositive = saved > 0;

    return (
      <View style={styles.container}>
        {/* Before / After stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Original</Text>
            <Text style={[styles.statValue, { color: theme.colors.textSecondary }]}>
              {formatSize(result.originalSize)}
            </Text>
          </View>
          <View style={styles.statArrow}>
            <MaterialCommunityIcons name="arrow-right-bold" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Compressed</Text>
            <Text style={[styles.statValue, { color: savedPositive ? theme.colors.success : theme.colors.error }]}>
              {formatSize(result.compressedSize)}
            </Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={[styles.statBadgeText, { color: savedPositive ? theme.colors.success : theme.colors.error }]}>
              {savedPositive ? `−${pct}%` : `+${Math.abs(Number(pct))}%`}
            </Text>
          </View>
        </View>

        <SuccessCard
          title="Compressed Successfully!"
          fileName={result.name}
          fileUri={result.uri}
          onDismiss={() => setResult(null)}
        />
      </View>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  const level = LEVELS.find(l => l.id === selectedLevel)!;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Compress PDF</Text>
          <Text style={styles.subtitle}>Reduce PDF file size by optimizing internal structures.</Text>
        </View>

        {/* File picker */}
        {!selectedFile ? (
          <TouchableOpacity style={styles.uploadBox} onPress={handlePickFile}>
            <MaterialCommunityIcons name="file-restore" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.uploadText}>Select PDF to Compress</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* Selected file card */}
            <View style={styles.fileCard}>
              <MaterialCommunityIcons name="file-pdf-box" size={40} color={theme.colors.primary} />
              <View style={styles.fileNameContainer}>
                <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>{formatSize(selectedFile.size)}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <MaterialCommunityIcons name="close-circle" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </View>

            {/* Compression level selector */}
            <Text style={styles.sectionTitle}>Compression Level</Text>
            <View style={styles.levelGrid}>
              {LEVELS.map(l => (
                <TouchableOpacity
                  key={l.id}
                  style={[
                    styles.levelCard,
                    selectedLevel === l.id && { borderColor: l.color, backgroundColor: `${l.color}15` },
                  ]}
                  onPress={() => setSelectedLevel(l.id)}
                >
                  <MaterialCommunityIcons
                    name={l.icon as any}
                    size={28}
                    color={selectedLevel === l.id ? l.color : theme.colors.textSecondary}
                  />
                  <Text style={[styles.levelLabel, selectedLevel === l.id && { color: l.color }]}>
                    {l.label}
                  </Text>
                  <Text style={styles.levelPct}>{l.pct}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description of selected level */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={18} color={level.color} />
              <Text style={styles.infoText}>{level.description}</Text>
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={handleCompress} disabled={isProcessing}>
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
    backgroundColor: theme.colors.surface, borderRadius: 16, padding: spacing.md,
    borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row',
    alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg,
  },
  fileNameContainer: { flex: 1 },
  fileName: { color: theme.colors.text, fontSize: 15, fontWeight: 'bold' },
  fileSize: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },

  sectionTitle: {
    color: theme.colors.text, fontSize: 16, fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  levelGrid: {
    flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg,
  },
  levelCard: {
    flex: 1, alignItems: 'center', backgroundColor: theme.colors.surface,
    borderRadius: 14, padding: spacing.md, borderWidth: 2, borderColor: theme.colors.border,
    gap: 4,
  },
  levelLabel: { color: theme.colors.text, fontSize: 13, fontWeight: 'bold' },
  levelPct: { color: theme.colors.textSecondary, fontSize: 10, textAlign: 'center' },

  infoBox: {
    backgroundColor: theme.colors.surfaceSecondary, padding: spacing.md,
    borderRadius: 12, flexDirection: 'row', marginBottom: spacing.xl, gap: 8, alignItems: 'flex-start',
  },
  infoText: { flex: 1, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 18 },

  actionButton: {
    backgroundColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', padding: spacing.md, borderRadius: 12, gap: 8,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  // ── Before/After stats ───────────────────────────────────────────────────
  statsBar: {
    flexDirection: 'row', alignItems: 'center',
    margin: spacing.lg, marginBottom: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: 16, padding: spacing.lg,
    borderWidth: 1, borderColor: theme.colors.border,
    gap: spacing.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { color: theme.colors.textSecondary, fontSize: 11, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  statArrow: { paddingHorizontal: 4 },
  statBadge: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  statBadgeText: { fontSize: 14, fontWeight: 'bold' },
});

export default CompressPdfScreen;
