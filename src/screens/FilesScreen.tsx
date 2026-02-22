import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';
import { spacing } from '../theme/spacing';
import {
  RecentFile, getRecentFiles, removeRecentFile, clearRecentFiles,
  TOOL_META, formatSize, formatRelativeDate,
} from '../services/recentFilesService';
import { saveToOutputDir } from '../services/storageService';
import * as Sharing from 'expo-sharing';

const FilesScreen = () => {
  const { theme } = useAppTheme();
  const [files, setFiles] = useState<RecentFile[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Reload list every time tab is focused
  useFocusEffect(
    useCallback(() => {
      loadFiles();
    }, []),
  );

  const loadFiles = async () => {
    const recents = await getRecentFiles();
    setFiles(recents);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };

  const handleShare = async (file: RecentFile) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf' });
    }
  };

  const handleSave = async (file: RecentFile) => {
    await saveToOutputDir(file.uri, file.name);
  };

  const handleDelete = (file: RecentFile) => {
    Alert.alert(
      'Remove from Recents',
      `Remove "${file.name}" from your recent files?\n\nThis only removes the entry — the actual file is not deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            await removeRecentFile(file.id);
            setFiles(prev => prev.filter(f => f.id !== file.id));
          },
        },
      ],
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Recents',
      'Remove all entries from your recent files list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All', style: 'destructive',
          onPress: async () => { await clearRecentFiles(); setFiles([]); },
        },
      ],
    );
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (files.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.emptyContainer}>
          <View style={[styles.iconCircle, { backgroundColor: theme.surfaceSecondary }]}>
            <MaterialCommunityIcons name="folder-open-outline" size={64} color={theme.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Recent Files</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Files you process with any tool will appear here for easy re-access.
          </Text>
        </View>
      </View>
    );
  }

  // ── File list ──────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header toolbar */}
      <View style={[styles.toolbar, { borderBottomColor: theme.border }]}>
        <Text style={[styles.toolbarCount, { color: theme.textSecondary }]}>
          {files.length} file{files.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={{ color: theme.error, fontSize: 14, fontWeight: '600' }}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={files}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        renderItem={({ item }) => {
          const meta = TOOL_META[item.toolType];
          return (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {/* Icon + info */}
              <View style={[styles.iconBox, { backgroundColor: `${meta.color}20` }]}>
                <MaterialCommunityIcons name={meta.icon as any} size={28} color={meta.color} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.badge, { color: meta.color, backgroundColor: `${meta.color}20` }]}>
                    {meta.label}
                  </Text>
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>{formatSize(item.size)}</Text>
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>
                    {formatRelativeDate(item.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleSave(item)}>
                  <MaterialCommunityIcons name="content-save-outline" size={20} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
                  <MaterialCommunityIcons name="share-variant-outline" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                  <MaterialCommunityIcons name="close" size={20} color={theme.error} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg,
  },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: spacing.sm },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  toolbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1,
  },
  toolbarCount: { fontSize: 14 },
  listContent: { padding: spacing.md, gap: spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, padding: spacing.md, gap: spacing.sm,
  },
  iconBox: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  badge: {
    fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  meta: { fontSize: 11 },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
});

export default FilesScreen;
