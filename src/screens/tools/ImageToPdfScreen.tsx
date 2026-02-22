import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView,
  Image, PanResponder,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useAppTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/spacing';
import { pickImages } from '../../services/fileService';
import { pdfService } from '../../services/pdfService';
import SuccessCard from '../../components/SuccessCard';
import ProgressBar from '../../components/ProgressBar';

const STEPS = ['Select Images', 'Building PDF', 'Saving Output'];
const ITEM_HEIGHT = 76;

interface ImageFile {
  key: string;
  uri: string;
  name: string;
  size: number;
}

const ImageToPdfScreen = () => {
  const { theme } = useAppTheme();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<{ uri: string; name: string; size: number } | null>(null);

  // ── Drag state ────────────────────────────────────────────────────────────
  const [dragging, setDragging] = useState(false);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragToIndex, setDragToIndex] = useState<number | null>(null);
  const listRef = useRef<View>(null);
  const listAbsoluteY = useRef(0);
  const dragStartIndex = useRef(0);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const measureList = useCallback(() => {
    listRef.current?.measure((_x, _y, _w, _h, _px, pageY) => {
      listAbsoluteY.current = pageY;
    });
  }, []);

  const buildPanResponder = (index: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        measureList();
        dragStartIndex.current = index;
        setDragFromIndex(index);
        setDragToIndex(index);
        setDragging(true);
      },
      onPanResponderMove: (e) => {
        const relY = e.nativeEvent.pageY - listAbsoluteY.current;
        const newIndex = Math.max(
          0,
          Math.min(imagesRef.current.length - 1, Math.round(relY / ITEM_HEIGHT)),
        );
        setDragToIndex(newIndex);
      },
      onPanResponderRelease: (e) => {
        const relY = e.nativeEvent.pageY - listAbsoluteY.current;
        const newIndex = Math.max(
          0,
          Math.min(imagesRef.current.length - 1, Math.round(relY / ITEM_HEIGHT)),
        );
        if (newIndex !== dragStartIndex.current) {
          setImages(prev => {
            const next = [...prev];
            const [moved] = next.splice(dragStartIndex.current, 1);
            next.splice(newIndex, 0, moved);
            return next;
          });
        }
        setDragging(false);
        setDragFromIndex(null);
        setDragToIndex(null);
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        setDragFromIndex(null);
        setDragToIndex(null);
      },
    });

  // ── Pick images ───────────────────────────────────────────────────────────
  const handlePickImages = async () => {
    const picked = await pickImages();
    if (picked && picked.length > 0) {
      setImages(prev => [
        ...prev,
        ...picked.map((img: any) => ({
          key: `${img.uri}-${Date.now()}-${Math.random()}`,
          uri: img.uri,
          name: img.fileName ?? `image_${Date.now()}.jpg`,
          size: img.fileSize ?? 0,
        })),
      ]);
    }
  };

  const removeImage = (key: string) =>
    setImages(prev => prev.filter(i => i.key !== key));

  // ── Convert ───────────────────────────────────────────────────────────────
  const handleCreatePdf = async () => {
    if (images.length === 0) {
      Alert.alert('Error', 'Please select at least one image.');
      return;
    }
    setIsProcessing(true);
    setProgressStep(1);
    try {
      const pdfBytes = await pdfService.imagesToPdf(images.map(i => i.uri));
      setProgressStep(2);
      const fileName = `images_${Date.now()}.pdf`;
      const dir = `${FileSystem.documentDirectory}PdfTools/`;
      if (!(await FileSystem.getInfoAsync(dir)).exists)
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const savedUri = `${dir}${fileName}`;
      let bin = '';
      pdfBytes.forEach((b: number) => { bin += String.fromCharCode(b); });
      await FileSystem.writeAsStringAsync(savedUri, btoa(bin), { encoding: 'base64' });
      setResult({ uri: savedUri, name: fileName, size: pdfBytes.length });
      setImages([]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to create PDF from images.');
    } finally {
      setIsProcessing(false);
      setProgressStep(0);
    }
  };

  // ── Success ────────────────────────────────────────────────────────────────
  if (result) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SuccessCard
          title="PDF Created!"
          fileName={result.name}
          fileUri={result.uri}
          fileSize={result.size}
          toolType="image_to_pdf"
          onDismiss={() => setResult(null)}
        />
      </View>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Image to PDF</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Select images · drag ⠿ to reorder · convert to PDF
        </Text>
      </View>

      {isProcessing && <ProgressBar steps={STEPS} currentStep={progressStep} theme={theme} />}

      {images.length === 0 ? (
        <TouchableOpacity
          style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={handlePickImages}
        >
          <MaterialCommunityIcons name="image-multiple-outline" size={56} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Add Images</Text>
          <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>
            Tap to select. Drag ⠿ to set page order.
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* Hint */}
          <View style={[styles.hintBanner, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}35` }]}>
            <MaterialCommunityIcons name="drag-vertical" size={15} color={theme.primary} />
            <Text style={[styles.hintText, { color: theme.primary }]}>
              Drag ⠿ handle to set the page order in the PDF
            </Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={!dragging}
          >
            <View ref={listRef} onLayout={measureList}>
              {images.map((item, index) => {
                const isBeingDragged = dragFromIndex === index;
                const isDragTarget = dragToIndex === index && dragFromIndex !== index;
                const pan = buildPanResponder(index);

                return (
                  <View
                    key={item.key}
                    style={[
                      styles.row,
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
                        opacity: isBeingDragged ? 0.85 : 1,
                        transform: [{ scale: isBeingDragged ? 1.02 : 1 }],
                      },
                    ]}
                  >
                    {/* Thumbnail */}
                    <Image source={{ uri: item.uri }} style={styles.thumb} />

                    {/* Page number overlay */}
                    <View style={[styles.pageBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.pageBadgeText}>p{index + 1}</Text>
                    </View>

                    {/* Name */}
                    <View style={styles.info}>
                      <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                        {item.name || `Image ${index + 1}`}
                      </Text>
                      <Text style={[styles.meta, { color: theme.textSecondary }]}>
                        Page {index + 1} of {images.length}
                      </Text>
                    </View>

                    {/* Remove */}
                    <TouchableOpacity
                      onPress={() => removeImage(item.key)}
                      style={styles.btn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialCommunityIcons name="close-circle" size={20} color={theme.error} />
                    </TouchableOpacity>

                    {/* Drag handle */}
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
          onPress={handlePickImages}
          disabled={isProcessing}
        >
          <MaterialCommunityIcons name="image-plus" size={22} color={theme.primary} />
          <Text style={[styles.addBtnLabel, { color: theme.primary }]}>Add Images</Text>
        </TouchableOpacity>

        {images.length > 0 && (
          <TouchableOpacity
            style={[styles.convertBtn, { backgroundColor: theme.primary }]}
            onPress={handleCreatePdf}
            disabled={isProcessing}
          >
            {isProcessing
              ? <ActivityIndicator color="white" />
              : <>
                  <MaterialCommunityIcons name="file-pdf-box" size={22} color="white" />
                  <Text style={styles.convertBtnLabel}>
                    Convert {images.length} Image{images.length !== 1 ? 's' : ''}
                  </Text>
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
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: 14, marginBottom: spacing.sm,
    borderWidth: 1.5, height: ITEM_HEIGHT,
    overflow: 'hidden',
  },
  thumb: {
    width: ITEM_HEIGHT, height: ITEM_HEIGHT,
    borderRadius: 0,
  },
  pageBadge: {
    position: 'absolute', top: 4, left: 4,
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2,
  },
  pageBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  info: { flex: 1, paddingLeft: 4 },
  name: { fontSize: 13, fontWeight: '600' },
  meta: { fontSize: 11, marginTop: 2 },
  btn: { padding: 4, marginRight: 4 },
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
  convertBtn: {
    flex: 1, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    padding: spacing.md, borderRadius: 12, gap: 8,
  },
  convertBtnLabel: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});

export default ImageToPdfScreen;
