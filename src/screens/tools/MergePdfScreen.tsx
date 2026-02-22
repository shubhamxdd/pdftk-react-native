import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView,
  PanResponder, Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useAppTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/spacing';
import { pickMultiplePdfs } from '../../services/fileService';
import { pdfService } from '../../services/pdfService';
import SuccessCard from '../../components/SuccessCard';
import ProgressBar from '../../components/ProgressBar';

const STEPS = ['Select Files', 'Merging PDFs', 'Saving File'];
const ITEM_HEIGHT = 68; // must match fileItem style height

interface PdfFile {
  key: string;
  name: string;
  uri: string;
  size: number;
}

const MergePdfScreen = () => {
  const { theme } = useAppTheme();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<{ uri: string; name: string; size: number } | null>(null);

  // ── Drag state ────────────────────────────────────────────────────────────
  const [dragging, setDragging] = useState(false);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragToIndex, setDragToIndex] = useState<number | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const listRef = useRef<View>(null);
  const listAbsoluteY = useRef(0);
  const dragStartY = useRef(0);
  const dragStartIndex = useRef(0);
  const filesRef = useRef(files);
  filesRef.current = files;

  // Measure once the list mounts
  const measureList = useCallback(() => {
    listRef.current?.measure((_x, _y, _w, _h, _px, pageY) => {
      listAbsoluteY.current = pageY;
    });
  }, []);

  // ── PanResponder — attached to each drag handle via onLayout mapping ───────
  const buildPanResponder = (index: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        measureList();
        const startY = e.nativeEvent.pageY;
        dragStartY.current = startY;
        dragStartIndex.current = index;
        dragY.setValue(0);
        setDragFromIndex(index);
        setDragToIndex(index);
        setDragging(true);
      },
      onPanResponderMove: (e) => {
        const currentY = e.nativeEvent.pageY;
        dragY.setValue(currentY - dragStartY.current);
        // compute target slot
        const relY = currentY - listAbsoluteY.current;
        const newIndex = Math.max(
          0,
          Math.min(filesRef.current.length - 1, Math.round(relY / ITEM_HEIGHT)),
        );
        setDragToIndex(newIndex);
      },
      onPanResponderRelease: (e) => {
        const relY = e.nativeEvent.pageY - listAbsoluteY.current;
        const newIndex = Math.max(
          0,
          Math.min(filesRef.current.length - 1, Math.round(relY / ITEM_HEIGHT)),
        );
        if (newIndex !== dragStartIndex.current) {
          setFiles(prev => {
            const next = [...prev];
            const [moved] = next.splice(dragStartIndex.current, 1);
            next.splice(newIndex, 0, moved);
            return next;
          });
        }
        dragY.setValue(0);
        setDragging(false);
        setDragFromIndex(null);
        setDragToIndex(null);
      },
      onPanResponderTerminate: () => {
        dragY.setValue(0);
        setDragging(false);
        setDragFromIndex(null);
        setDragToIndex(null);
      },
    });

  // ── Add files ─────────────────────────────────────────────────────────────
  const handlePickFile = async () => {
    const picked = await pickMultiplePdfs();
    if (picked && picked.length > 0) {
      setFiles(prev => [
        ...prev,
        ...picked.map((f: any) => ({
          key: `${f.uri}-${Date.now()}-${Math.random()}`,
          name: f.name, uri: f.uri, size: f.size,
        })),
      ]);
    }
  };

  const removeFile = (key: string) =>
    setFiles(prev => prev.filter(f => f.key !== key));

  // ── Merge ─────────────────────────────────────────────────────────────────
  const handleMerge = async () => {
    if (files.length < 2) {
      Alert.alert('Merge PDF', 'Please select at least 2 PDF files.');
      return;
    }
    setIsProcessing(true);
    setProgressStep(1);
    try {
      const mergedBytes = await pdfService.mergePdfs(files.map(f => f.uri));
      setProgressStep(2);
      const fileName = `merged_${Date.now()}.pdf`;
      const dir = `${FileSystem.documentDirectory}PdfTools/`;
      if (!(await FileSystem.getInfoAsync(dir)).exists)
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const savedUri = `${dir}${fileName}`;
      let bin = '';
      mergedBytes.forEach((b: number) => { bin += String.fromCharCode(b); });
      await FileSystem.writeAsStringAsync(savedUri, btoa(bin), { encoding: 'base64' });
      setResult({ uri: savedUri, name: fileName, size: mergedBytes.length });
      setFiles([]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'An error occurred while merging PDFs.');
    } finally {
      setIsProcessing(false);
      setProgressStep(0);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (result) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SuccessCard
          title="Merged Successfully!"
          fileName={result.name}
          fileUri={result.uri}
          fileSize={result.size}
          toolType="merge"
          onDismiss={() => setResult(null)}
        />
      </View>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Merge PDFs</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Select files · drag ⠿ handle to reorder · tap Merge
        </Text>
      </View>

      {isProcessing && <ProgressBar steps={STEPS} currentStep={progressStep} theme={theme} />}

      {files.length === 0 ? (
        /* ── Empty state ── */
        <TouchableOpacity
          style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={handlePickFile}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={56} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Add PDFs to merge</Text>
          <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>
            Drag ⠿ to reorder after selecting
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* Hint banner */}
          <View style={[styles.hintBanner, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}35` }]}>
            <MaterialCommunityIcons name="drag-vertical" size={15} color={theme.primary} />
            <Text style={[styles.hintText, { color: theme.primary }]}>
              Press and drag ⠿ to change merge order
            </Text>
          </View>

          {/* List — measured for absolute Y */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={!dragging}
          >
            <View
              ref={listRef}
              onLayout={measureList}
            >
              {files.map((item, index) => {
                const isBeingDragged = dragFromIndex === index;
                const isDragTarget = dragToIndex === index && dragFromIndex !== index;
                const pan = buildPanResponder(index);

                return (
                  <View
                    key={item.key}
                    style={[
                      styles.fileItem,
                      {
                        backgroundColor: isBeingDragged
                          ? `${theme.primary}20`
                          : isDragTarget
                            ? `${theme.secondary}20`
                            : theme.surface,
                        borderColor: isBeingDragged
                          ? theme.primary
                          : isDragTarget
                            ? theme.secondary
                            : theme.border,
                        opacity: isBeingDragged ? 0.8 : 1,
                        transform: [{ scale: isBeingDragged ? 1.03 : 1 }],
                      },
                    ]}
                  >
                    {/* Order badge */}
                    <View style={[styles.badge, {
                      backgroundColor: isBeingDragged ? theme.primary : theme.surfaceSecondary,
                    }]}>
                      <Text style={[styles.badgeText, { color: isBeingDragged ? 'white' : theme.textSecondary }]}>
                        {index + 1}
                      </Text>
                    </View>

                    <MaterialCommunityIcons name="file-pdf-box" size={28} color={theme.primary} />

                    <View style={styles.info}>
                      <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.meta, { color: theme.textSecondary }]}>
                        {(item.size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    </View>

                    {/* Remove */}
                    <TouchableOpacity onPress={() => removeFile(item.key)} style={styles.btn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <MaterialCommunityIcons name="close-circle" size={20} color={theme.error} />
                    </TouchableOpacity>

                    {/* Drag handle — touch events go to PanResponder */}
                    <View style={styles.btn} {...pan.panHandlers}>
                      <MaterialCommunityIcons name="drag-vertical" size={26} color={theme.textSecondary} />
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </>
      )}

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
          onPress={handlePickFile}
          disabled={isProcessing}
        >
          <MaterialCommunityIcons name="plus" size={22} color={theme.primary} />
          <Text style={[styles.addBtnLabel, { color: theme.primary }]}>Add Files</Text>
        </TouchableOpacity>

        {files.length >= 2 && (
          <TouchableOpacity
            style={[styles.mergeBtn, { backgroundColor: theme.primary }]}
            onPress={handleMerge}
            disabled={isProcessing}
          >
            {isProcessing
              ? <ActivityIndicator color="white" />
              : <>
                  <MaterialCommunityIcons name="vector-combine" size={22} color="white" />
                  <Text style={styles.mergeBtnLabel}>Merge {files.length} Files</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 4 },
  hintBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
  },
  hintText: { fontSize: 12, fontWeight: '500' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  fileItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 14, marginBottom: spacing.sm,
    borderWidth: 1.5, height: ITEM_HEIGHT,
  },
  badge: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 11, marginTop: 2 },
  btn: { padding: 4 },
  emptyState: {
    flex: 1, margin: spacing.lg, borderRadius: 20,
    borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold' },
  emptyHint: { fontSize: 13 },
  footer: {
    flexDirection: 'row', gap: spacing.md,
    padding: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderRadius: 12, borderWidth: 1,
  },
  addBtnLabel: { fontSize: 15, fontWeight: '600' },
  mergeBtn: {
    flex: 1, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    padding: spacing.md, borderRadius: 12, gap: 8,
  },
  mergeBtnLabel: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});

export default MergePdfScreen;
