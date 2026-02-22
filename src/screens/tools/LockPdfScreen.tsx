import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAppTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/spacing';

const LockPdfScreen = () => {
  const { theme } = useAppTheme();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [processing, setProcessing] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleProcess = async () => {
    if (!selectedFile || !password) return;
    setProcessing(true);
    
    // NOTE: pdf-lib does not support encryption natively. 
    // This is a placeholder showing the UI flow.
    setTimeout(() => {
      setProcessing(false);
      Alert.alert('Note', 'Password protection is currently in development. Dynamic encryption requires additional native modules.');
    }, 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="shield-lock" size={64} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>Protect PDF</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Add a password to your document</Text>
      </View>

      {!selectedFile ? (
        <TouchableOpacity style={[styles.picker, { borderColor: theme.border, backgroundColor: theme.surface }]} onPress={pickDocument}>
          <MaterialCommunityIcons name="file-pdf-box" size={48} color={theme.textSecondary} />
          <Text style={[styles.pickerText, { color: theme.textSecondary }]}>Select PDF File</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.selectedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="file-check" size={24} color={theme.success} />
          <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>{selectedFile.name}</Text>
          <TouchableOpacity onPress={() => setSelectedFile(null)}>
            <MaterialCommunityIcons name="close-circle" size={24} color={theme.error} />
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
        placeholder="Enter Password"
        placeholderTextColor={theme.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.primary, opacity: (!selectedFile || !password) ? 0.5 : 1 }]} 
        onPress={handleProcess}
        disabled={!selectedFile || !password || processing}
      >
        {processing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Encrypt & Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  picker: {
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pickerText: {
    marginTop: spacing.sm,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  fileName: {
    flex: 1,
    fontSize: 16,
  },
  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    marginBottom: spacing.xl,
  },
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LockPdfScreen;
