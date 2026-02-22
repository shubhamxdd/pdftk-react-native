import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { spacing } from '../theme/spacing';
import { getOutputDirUri, changeOutputDir, clearOutputDir } from '../services/storageService';

const SettingsItem = ({ icon, label, value, onValueChange, type = 'switch', onPress, theme, subtitle }: any) => {
  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.surfaceSecondary }]}>
          <MaterialCommunityIcons name={icon} size={22} color={theme.text} />
        </View>
        <View>
          <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
        </View>
      </View>
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={theme.text}
        />
      ) : (
        <TouchableOpacity onPress={onPress}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const SettingsScreen = () => {
  const { theme, isDark, toggleTheme } = useAppTheme();
  const [notifications, setNotifications] = React.useState(true);
  const [outputDirSet, setOutputDirSet] = useState(false);

  useEffect(() => {
    getOutputDirUri().then(uri => setOutputDirSet(!!uri));
  }, []);

  const handleChangeOutputFolder = async () => {
    await changeOutputDir();
    // Re-check after user picks
    setTimeout(async () => {
      const uri = await getOutputDirUri();
      setOutputDirSet(!!uri);
    }, 2000);
  };

  const handleResetOutputFolder = () => {
    Alert.alert(
      'Reset Output Folder',
      'This will clear your saved output folder. You will be prompted to choose again on next save.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: async () => { await clearOutputDir(); setOutputDirSet(false); },
        },
      ],
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingsItem
            icon="weather-night" label="Dark Mode"
            value={isDark} onValueChange={toggleTheme} theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="bell-outline" label="Notifications"
            value={notifications} onValueChange={setNotifications} theme={theme}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Storage</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingsItem
            icon="folder-outline"
            label="Output Folder"
            subtitle={outputDirSet ? 'Folder selected ✓' : 'Not set — tap Save in any tool to set'}
            type="chevron"
            onPress={handleChangeOutputFolder}
            theme={theme}
          />
          {outputDirSet && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <SettingsItem
                icon="folder-remove-outline"
                label="Reset Output Folder"
                subtitle="Choose a different folder next save"
                type="chevron"
                onPress={handleResetOutputFolder}
                theme={theme}
              />
            </>
          )}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="delete-outline" label="Clear Recent Files" type="chevron"
            onPress={() => Alert.alert('Clear Recents', 'This will clear your recent file history.')}
            theme={theme}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>About</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingsItem
            icon="information-outline" label="Version" type="chevron"
            onPress={() => Alert.alert('PdfTools', 'Version 1.0.0')} theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="shield-check-outline" label="Privacy Policy" type="chevron"
            onPress={() => Alert.alert('Privacy', 'Your files stay on your device.')} theme={theme}
          />
        </View>
      </View>

      <Text style={[styles.footerText, { color: theme.textSecondary }]}>Made with ❤️ for PDF lovers</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  label: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginLeft: spacing.md + 36 + spacing.md,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
});

export default SettingsScreen;
