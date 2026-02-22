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
import { theme } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface SuccessCardProps {
  title: string;
  fileName: string;
  fileUri: string;
  onDismiss: () => void;
}

const SuccessCard = ({ title, fileName, fileUri, onDismiss }: SuccessCardProps) => {
  const [currentName, setCurrentName] = useState(fileName);
  const [currentUri, setCurrentUri] = useState(fileUri);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(fileName.replace(/\.pdf$/i, ''));

  // ── Read file size whenever URI changes ─────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const info = await FileSystem.getInfoAsync(currentUri);
        if (info.exists && (info as any).size !== undefined) {
          const kb = (info as any).size / 1024;
          setFileSize(kb >= 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`);
        }
      } catch {
        setFileSize(null);
      }
    })();
  }, [currentUri]);

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
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="check-circle" size={56} color={theme.colors.success} />
      </View>
      <Text style={styles.title}>{title}</Text>

      {/* File info pill */}
      <View style={styles.infoPill}>
        <MaterialCommunityIcons name="file-pdf-box" size={18} color={theme.colors.primary} />
        <View style={styles.pillText}>
          <Text style={styles.nameText} numberOfLines={1}>{currentName}</Text>
          {fileSize && <Text style={styles.sizeText}>{fileSize}</Text>}
        </View>
      </View>

      {/* Open in PDF Viewer CTA */}
      <TouchableOpacity style={styles.openCta} onPress={handleOpen}>
        <MaterialCommunityIcons name="eye-outline" size={20} color="white" />
        <Text style={styles.openCtaText}>Open in PDF Viewer</Text>
      </TouchableOpacity>

      {/* 4 quick actions */}
      <View style={styles.actions}>
        <ActionBtn icon="pencil-outline"        label="Rename"  color="#3B82F6" bg="#3B82F620" onPress={() => setRenaming(true)} />
        <ActionBtn icon="content-save-outline"  label="Save"    color="#10B981" bg="#10B98120" onPress={handleSave} />
        <ActionBtn icon="share-variant-outline" label="Share"   color="#F59E0B" bg="#F59E0B20" onPress={handleShare} />
        <ActionBtn icon="close-circle-outline"  label="Dismiss" color="#6B7280" bg="#6B728020" onPress={onDismiss} />
      </View>

      {/* Rename Modal */}
      <Modal visible={renaming} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rename File</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              selectTextOnFocus
              placeholder="Enter file name"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setRenaming(false)}>
                <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={confirmRename}>
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
  icon, label, color, bg, onPress,
}: { icon: string; label: string; color: string; bg: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon as any} size={24} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    margin: spacing.lg, marginTop: spacing.xxl,
    backgroundColor: theme.colors.surface,
    borderRadius: 24, padding: spacing.xl,
    borderWidth: 1, borderColor: theme.colors.border,
    alignItems: 'center',
  },
  iconWrap: { marginBottom: spacing.sm },
  title: {
    color: theme.colors.text, fontSize: 22, fontWeight: 'bold',
    marginBottom: spacing.lg, textAlign: 'center',
  },
  infoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    marginBottom: spacing.lg, width: '100%',
  },
  pillText: { flex: 1 },
  nameText: { color: theme.colors.text, fontSize: 14, fontWeight: '500' },
  sizeText: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  openCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: theme.colors.primary,
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
  actionLabel: { color: theme.colors.text, fontSize: 12, fontWeight: '500' },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.xl,
  },
  modalBox: {
    backgroundColor: theme.colors.surface, borderRadius: 20,
    padding: spacing.xl, width: '100%',
  },
  modalTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: spacing.lg },
  input: {
    backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text,
    borderRadius: 10, padding: spacing.md, fontSize: 16,
    borderWidth: 1, borderColor: theme.colors.border, marginBottom: spacing.lg,
  },
  modalRow: { flexDirection: 'row', gap: spacing.md },
  btnCancel: {
    flex: 1, padding: spacing.md, borderRadius: 10,
    alignItems: 'center', backgroundColor: theme.colors.surfaceSecondary,
  },
  btnConfirm: {
    flex: 1, padding: spacing.md, borderRadius: 10,
    alignItems: 'center', backgroundColor: theme.colors.primary,
  },
});

export default SuccessCard;
