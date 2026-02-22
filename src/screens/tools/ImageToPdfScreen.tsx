import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { theme } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { pickImages } from '../../services/fileService';
import { pdfService } from '../../services/pdfService';
import SuccessCard from '../../components/SuccessCard';

const ImageToPdfScreen = () => {
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ uri: string; name: string } | null>(null);

  const handlePickImages = async () => {
    const images = await pickImages();
    if (images && images.length > 0) setSelectedImages(prev => [...prev, ...images]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePdf = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('Error', 'Please select at least one image.');
      return;
    }

    setIsProcessing(true);
    try {
      const uris = selectedImages.map(img => img.uri);
      const pdfBytes = await pdfService.imagesToPdf(uris);
      const fileName = `images_${Date.now()}.pdf`;

      const dir = `${FileSystem.documentDirectory}PdfTools/`;
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const savedUri = `${dir}${fileName}`;
      let binary = '';
      pdfBytes.forEach(b => { binary += String.fromCharCode(b); });
      await FileSystem.writeAsStringAsync(savedUri, btoa(binary), { encoding: 'base64' });

      setResult({ uri: savedUri, name: fileName });
      setSelectedImages([]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while creating PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (result) {
    return (
      <View style={styles.container}>
        <SuccessCard
          title="PDF Created Successfully!"
          fileName={result.name}
          fileUri={result.uri}
          onDismiss={() => setResult(null)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Image to PDF</Text>
        <Text style={styles.subtitle}>Convert your photos and images into a PDF document.</Text>
      </View>

      <FlatList
        data={selectedImages}
        keyExtractor={(_, index) => index.toString()}
        numColumns={3}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: item.uri }} style={styles.image} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
              <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <TouchableOpacity style={styles.emptyState} onPress={handlePickImages}>
            <MaterialCommunityIcons name="image-multiple-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>Tap to select images</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addButton, selectedImages.length > 0 && styles.addButtonSmall]}
          onPress={handlePickImages}
          disabled={isProcessing}
        >
          <MaterialCommunityIcons name="image-plus" size={24} color="white" />
          <Text style={styles.buttonText}>Add Images</Text>
        </TouchableOpacity>

        {selectedImages.length > 0 && (
          <TouchableOpacity style={styles.convertButton} onPress={handleCreatePdf} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="white" /> : (
              <>
                <MaterialCommunityIcons name="file-pdf-box" size={24} color="white" />
                <Text style={styles.buttonText}>Convert to PDF</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 },
  list: { flex: 1 },
  listContent: { padding: spacing.md },
  imageWrapper: { flex: 1 / 3, aspectRatio: 1, padding: 4, position: 'relative' },
  image: { flex: 1, borderRadius: 8, backgroundColor: theme.colors.surface },
  removeBtn: { position: 'absolute', top: 0, right: 0, padding: 4 },
  emptyState: {
    padding: spacing.xxl, justifyContent: 'center', alignItems: 'center',
    backgroundColor: theme.colors.surface, borderRadius: 16,
    borderStyle: 'dashed', borderWidth: 1, borderColor: theme.colors.border,
    marginTop: spacing.xl, marginHorizontal: spacing.sm,
  },
  emptyText: { color: theme.colors.textSecondary, marginTop: spacing.sm },
  footer: { padding: spacing.lg, flexDirection: 'row', gap: spacing.md },
  addButton: {
    flex: 1, backgroundColor: theme.colors.secondary, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', padding: spacing.md, borderRadius: 12, gap: 8,
  },
  addButtonSmall: { flex: 0.4 },
  convertButton: {
    flex: 1, backgroundColor: theme.colors.primary, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', padding: spacing.md, borderRadius: 12, gap: 8,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default ImageToPdfScreen;
