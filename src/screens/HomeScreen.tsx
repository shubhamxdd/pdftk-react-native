import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useAppTheme } from '../context/ThemeContext';
import ToolCard from '../components/ToolCard';

const HOME_TOOLS = [
  { id: 'merge', name: 'Merge PDF', icon: 'file-plus', description: 'Combine multiple PDFs into one', color: '#1E293B' },
  { id: 'split', name: 'Split PDF', icon: 'file-scissors', description: 'Extract pages from a PDF', color: '#1E293B' },
  { id: 'imageToPdf', name: 'Image to PDF', icon: 'image-plus', description: 'Convert images to PDF docs', color: '#1E293B' },
  { id: 'compress', name: 'Compress PDF', icon: 'file-restore', description: 'Reduce PDF file size', color: '#1E293B' },
];

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { theme } = useAppTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.textSecondary }]}>Welcome to</Text>
        <Text style={[styles.title, { color: theme.text }]}>PdfTools</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Tools</Text>
        {HOME_TOOLS.map((tool) => (
          <ToolCard
            key={tool.id}
            name={tool.name}
            icon={tool.icon as any}
            description={tool.description}
            onPress={() => {
              const routes: any = {
                'merge': 'MergePdf',
                'split': 'SplitPdf',
                'rotate': 'RotatePdf',
                'compress': 'CompressPdf',
                'imageToPdf': 'ImageToPdf',
              };
              if (routes[tool.id]) {
                navigation.navigate(routes[tool.id]);
              } else {
                console.log(`Navigating to ${tool.id} (Not implemented yet)`);
              }
            }}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Files</Text>
        <View style={[styles.emptyRecent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No recent files yet</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  greeting: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  emptyRecent: {
    padding: spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyText: {
    color: theme.colors.textSecondary,
  },
});

export default HomeScreen;
