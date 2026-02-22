import { View, Text, StyleSheet, ScrollView, SectionList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';
import { spacing } from '../theme/spacing';
import ToolCard from '../components/ToolCard';

const ALL_TOOLS = [
  {
    title: 'Organize',
    data: [
      { id: 'merge', name: 'Merge PDF', icon: 'file-plus', description: 'Combine multiple PDFs into one' },
      { id: 'split', name: 'Split PDF', icon: 'content-cut', description: 'Extract pages from a PDF' },
      { id: 'reorder', name: 'Reorder Pages', icon: 'format-list-numbered', description: 'Drag and drop to reorder pages' },
    ],
  },
  {
    title: 'Convert',
    data: [
      { id: 'imageToPdf', name: 'Image to PDF', icon: 'image-plus', description: 'Convert images to PDF docs' },
      { id: 'pdfToImg', name: 'PDF to Images', icon: 'file-image', description: 'Extract each page as an image' },
    ],
  },
  {
    title: 'Optimize',
    data: [
      { id: 'compress', name: 'Compress PDF', icon: 'file-restore', description: 'Reduce PDF file size' },
      { id: 'rotate', name: 'Rotate PDF', icon: 'rotate-right', description: 'Rotate pages in a PDF' },
    ],
  },
  {
    title: 'Security',
    data: [
      { id: 'lock', name: 'Lock PDF', icon: 'lock', description: 'Add password protection' },
      { id: 'unlock', name: 'Unlock PDF', icon: 'lock-open', description: 'Remove password protection' },
    ],
  },
];

const ToolsScreen = () => {
  const navigation = useNavigation<any>();
  const { theme } = useAppTheme();

  return (
    <SectionList
      sections={ALL_TOOLS}
      keyExtractor={(item) => item.id}
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <ToolCard
          name={item.name}
          icon={item.icon as any}
          description={item.description}
          onPress={() => {
            const routes: any = {
              'merge': 'MergePdf',
              'split': 'SplitPdf',
              'rotate': 'RotatePdf',
              'compress': 'CompressPdf',
              'imageToPdf': 'ImageToPdf',
              'pdfToImg': 'PdfToImg',
              'reorder': 'ReorderPdf',
              'lock': 'LockPdf',
              'unlock': 'UnlockPdf',
            };
            if (routes[item.id]) {
              navigation.navigate(routes[item.id]);
            } else {
              console.log(`Navigating to ${item.id} (Not implemented yet)`);
            }
          }}
        />
      )}
      renderSectionHeader={({ section: { title } }) => (
        <Text style={[styles.sectionHeader, { color: theme.primary }]}>{title}</Text>
      )}
      stickySectionHeadersEnabled={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
});

export default ToolsScreen;
