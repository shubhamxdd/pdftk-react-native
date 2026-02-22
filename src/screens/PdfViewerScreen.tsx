import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import { theme } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PdfViewerScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { uri, title } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleShare = async () => {
    if (!uri) return;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } else {
      Alert.alert('Sharing not available', 'Cannot share on this device.');
    }
  };

  const handleOpenExternal = async () => {
    await handleShare();
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: title || 'PDF Viewer',
      headerShown: true,
      headerRight: () => (
        <TouchableOpacity onPress={handleShare} style={{ marginRight: spacing.md }}>
          <MaterialCommunityIcons name="share-variant" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, uri, title]);

  if (!uri) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="file-alert-outline" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>No PDF file specified</Text>
      </View>
    );
  }

  // Determine how to load the PDF
  const isLocalFile = uri.startsWith('file://') || uri.startsWith('/');
  const isRemote = uri.startsWith('http://') || uri.startsWith('https://');

  // For remote PDFs, use Google Docs viewer
  // For local files, we load directly in WebView (works on iOS) or prompt to open externally (Android fallback)
  const webViewUri = isRemote
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(uri)}`
    : uri;

  if (error && isLocalFile && Platform.OS === 'android') {
    // Android WebView can't reliably show local files — offer to open in system viewer
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="file-pdf-box" size={80} color={theme.colors.primary} />
        <Text style={styles.savedTitle}>PDF Saved Successfully!</Text>
        <Text style={styles.savedSubtitle}>
          Open the file in your device's PDF viewer for the best experience.
        </Text>
        <TouchableOpacity style={styles.openButton} onPress={handleOpenExternal}>
          <MaterialCommunityIcons name="open-in-app" size={20} color="white" />
          <Text style={styles.openButtonText}>Open with PDF Viewer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: webViewUri }}
        style={styles.webview}
        originWhitelist={['*', 'file://*']}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        onLoadStart={() => { setLoading(true); setError(false); }}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setError(true); setLoading(false); }}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading PDF…</Text>
          </View>
        )}
        startInLoadingState={true}
      />
      {error && !isLocalFile && (
        <View style={styles.errorOverlay}>
          <MaterialCommunityIcons name="wifi-off" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>Failed to load PDF</Text>
          <TouchableOpacity style={styles.openButton} onPress={handleShare}>
            <Text style={styles.openButtonText}>Share / Open Externally</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: theme.colors.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: spacing.md,
    fontSize: 16,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: spacing.xl,
  },
  savedTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  savedSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  openButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PdfViewerScreen;
