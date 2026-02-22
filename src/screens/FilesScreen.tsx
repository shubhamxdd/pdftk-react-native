import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { spacing } from '../theme/spacing';

const FilesScreen = () => {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.emptyContainer}>
        <View style={[styles.iconCircle, { backgroundColor: theme.surfaceSecondary }]}>
          <MaterialCommunityIcons name="folder-open-outline" size={64} color={theme.textSecondary} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Empty Warehouse</Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Processed files will appear here for easy access.</Text>
        
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Explore Tools</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FilesScreen;
