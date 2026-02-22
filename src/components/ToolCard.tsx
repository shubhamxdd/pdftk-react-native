import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { theme as defaultTheme } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface ToolCardProps {
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  description?: string;
  color?: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ name, icon, onPress, description, color }) => {
  const { theme } = useAppTheme();

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color || theme.surfaceSecondary }]}>
        <MaterialCommunityIcons name={icon} size={32} color={theme.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
        {description && <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>{description}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderBottomWidth: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
  },
});

export default ToolCard;
