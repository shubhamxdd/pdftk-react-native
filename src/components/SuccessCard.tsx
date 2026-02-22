import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, Alert, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { saveToOutputDir } from '../services/storageService';
import { addRecentFile, ToolType } from '../services/recentFilesService';
import { useAppTheme } from '../context/ThemeContext';
import { spacing } from '../theme/spacing';

interface SuccessCardProps {
  title: string;
  fileName: string;
  fileUri: string;
  fileSize?: number;   // optional — if not passed, read from disk
  toolType?: ToolType; // for recents tracking
  onDismiss: () => void;
}

const SuccessCard = ({ title, fileName, fileUri, fileSize, toolType = 'merge', onDismiss }: SuccessCardProps) => {
  const { theme: themeColors } = useAppTheme();
  const [currentName, setCurrentName] = useState(fileName);
  const [currentUri, setCurrentUri] = useState(fileUri);
  const [fileSizeStr, setFileSizeStr] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(fileName.replace(/\.pdf$/i, ''));

  // ── Read file size + record in recents ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const info = await FileSystem.getInfoAsync(currentUri);
        const size = fileSize ?? (info.exists ? (info as any).size ?? 0 : 0);
        if (size > 0) {
          const kb = size / 1024;
          setFileSizeStr(kb >= 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`);
        }
        // Record in recents (non-blocking)
        addRecentFile({ name: fileName, uri: fileUri, toolType, size: fileSize ?? (info as any).size ?? 0 });
      } catch {
        // ignore
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Open in native PDF app ───────────────────────────────────────────────
  const handleOpen = async () => {
    if (Platform.OS === 'android') {
      try {
        const contentUri = await FileSystem.getContentUriAsync(currentUri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          type: 'application/pdf',
        });
      } catch {
        await Sharing.shareAsync(currentUri, { mimeType: 'application/pdf' });
      }
    } else {
      await Sharing.shareAsync(currentUri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Open PDF with…',
      });
    }
  };

  // ── Share via system sheet ───────────────────────────────────────────────
  const handleShare = async () => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(currentUri, { mimeType: 'application/pdf' });
    } else {
      Alert.alert('Not available', 'Sharing is not supported on this device.');
    }
  };

  // ── Save to output directory (PdfToolkit folder) ───────────────────────────
  const handleSave = async () => {
    await saveToOutputDir(currentUri, currentName);
  };

  // ── Rename on disk ───────────────────────────────────────────────────────
  const confirmRename = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const finalName = trimmed.endsWith('.pdf') ? trimmed : `${trimmed}.pdf`;
    const dir = currentUri.substring(0, currentUri.lastIndexOf('/') + 1);
    const newUri = `${dir}${finalName}`;
    try {
      await FileSystem.moveAsync({ from: currentUri, to: newUri });
      setCurrentUri(newUri);
      setCurrentName(finalName);
      setRenaming(false);
    } catch {
      Alert.alert('Error', 'Failed to rename file.');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      {/* Header */}
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="check-circle" size={56} color={themeColors.success} />
      </View>
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>

      {/* File info pill */}
      <View style={[styles.infoPill, { backgroundColor: themeColors.surfaceSecondary }]}>
        <MaterialCommunityIcons name="file-pdf-box" size={18} color={themeColors.primary} />
        <View style={styles.pillText}>
          <Text style={[styles.nameText, { color: themeColors.text }]} numberOfLines={1}>{currentName}</Text>
          {fileSizeStr && <Text style={[styles.sizeText, { color: themeColors.textSecondary }]}>{fileSizeStr}</Text>}
        </View>
      </View>

      {/* Open in PDF Viewer CTA */}
      <TouchableOpacity style={[styles.openCta, { backgroundColor: themeColors.primary }]} onPress={handleOpen}>
        <MaterialCommunityIcons name="eye-outline" size={20} color="white" />
        <Text style={styles.openCtaText}>Open in PDF Viewer</Text>
      </TouchableOpacity>

      {/* 4 quick actions */}
      <View style={styles.actions}>
        <ActionBtn icon="pencil-outline"        label="Rename"  color="#3B82F6" bg="#3B82F620" labelColor={themeColors.text} onPress={() => setRenaming(true)} />
        <ActionBtn icon="content-save-outline"  label="Save"    color="#10B981" bg="#10B98120" labelColor={themeColors.text} onPress={handleSave} />
        <ActionBtn icon="share-variant-outline" label="Share"   color="#F59E0B" bg="#F59E0B20" labelColor={themeColors.text} onPress={handleShare} />
        <ActionBtn icon="close-circle-outline"  label="Dismiss" color="#6B7280" bg="#6B728020" labelColor={themeColors.text} onPress={onDismiss} />
      </View>

      {/* Rename Modal */}
      <Modal visible={renaming} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{currentName.replace(/\.pdf$/i,'')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.surfaceSecondary, color: themeColors.text, borderColor: themeColors.border }]}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              selectTextOnFocus
              placeholder="Enter file name"
              placeholderTextColor={themeColors.textSecondary}
            />
            <View style={styles.modalRow}>
              <TouchableOpacity style={[styles.btnCancel, { backgroundColor: themeColors.surfaceSecondary }]} onPress={() => setRenaming(false)}>
                <Text style={{ color: themeColors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnConfirm, { backgroundColor: themeColors.primary }]} onPress={confirmRename}>
                <Text style={{ color: 'white', fontWeight: '600' }}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ActionBtn = ({
  icon, label, color, bg, onPress, labelColor,
}: { icon: string; label: string; color: string; bg: string; onPress: () => void; labelColor: string }) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon as any} size={24} color={color} />
    </View>
    <Text style={[styles.actionLabel, { color: labelColor }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    margin: spacing.lg, marginTop: spacing.xxl,
    borderRadius: 24, padding: spacing.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconWrap: { marginBottom: spacing.sm },
  title: {
    color: '#F0F6FC', fontSize: 22, fontWeight: 'bold',
    marginBottom: spacing.lg, textAlign: 'center',
  },
  infoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    marginBottom: spacing.lg, width: '100%',
  },
  pillText: { flex: 1 },
  nameText: { color: '#F0F6FC', fontSize: 14, fontWeight: '500' },
  sizeText: { color: '#8B949E', fontSize: 12, marginTop: 2 },
  openCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    borderRadius: 12, paddingVertical: spacing.md,
    width: '100%', marginBottom: spacing.lg,
  },
  openCtaText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  actions: {
    flexDirection: 'row', width: '100%',
    justifyContent: 'space-between', gap: spacing.sm,
  },
  actionBtn: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: spacing.sm },
  actionIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { color: '#F0F6FC', fontSize: 12, fontWeight: '500' },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.xl,
  },
  modalBox: {
    borderRadius: 20,
    padding: spacing.xl, width: '100%',
  },
  modalTitle: { color: '#F0F6FC', fontSize: 18, fontWeight: 'bold', marginBottom: spacing.lg },
  input: {
    borderRadius: 10, padding: spacing.md, fontSize: 16,
    borderWidth: 1, marginBottom: spacing.lg,
  },
  modalRow: { flexDirection: 'row', gap: spacing.md },
  btnCancel: {
    flex: 1, padding: spacing.md, borderRadius: 10,
    alignItems: 'center',
  },
  btnConfirm: {
    flex: 1, padding: spacing.md, borderRadius: 10,
    alignItems: 'center',
  },
});

export default SuccessCard;
