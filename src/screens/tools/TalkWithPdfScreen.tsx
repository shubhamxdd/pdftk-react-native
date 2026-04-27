import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView,
  TextInput, KeyboardAvoidingView, Platform,
  FlatList, Keyboard
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/spacing';
import { pickPdf } from '../../services/fileService';
import { aiService, ChatMessage } from '../../services/aiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const TalkWithPdfScreen = () => {
  const { theme } = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const [file, setFile] = useState<any>(null);
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handlePickFile = async () => {
    const picked = await pickPdf();
    if (picked) {
      setFile(picked);
      setMessages([]);
      preparePdf(picked.uri);
    }
  };

  const preparePdf = async (uri: string) => {
    setIsProcessing(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      setPdfBase64(base64);
      
      // Add an initial greeting from the AI
      const greeting: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: `I've analyzed "${file?.name || 'the PDF'}". I can now answer questions about its content. What would you like to know?`,
        timestamp: Date.now(),
      };
      setMessages([greeting]);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to read PDF file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isSending || !pdfBase64) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    Keyboard.dismiss();

    try {
      // Filter out initial local greeting if it's the first message
      // Gemini requires history to start with a 'user' role
      const history: ChatMessage[] = messages
        .filter((m, index) => !(index === 0 && m.role === 'model'))
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const responseText = await aiService.askQuestionWithPdf(pdfBase64, userMessage.text, history);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      Alert.alert('AI Error', error.message);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.aiMessage,
      { backgroundColor: item.role === 'user' ? theme.primary : theme.surfaceSecondary }
    ]}>
      <Text style={[
        styles.messageText,
        { color: item.role === 'user' ? 'white' : theme.text }
      ]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? tabBarHeight + 60 : tabBarHeight + 20}
    >
      {/* File Selection Header */}
      <View style={[styles.fileHeader, { borderBottomColor: theme.border }]}>
        {!file ? (
          <TouchableOpacity style={[styles.pickBtn, { backgroundColor: theme.primary }]} onPress={handlePickFile}>
            <MaterialCommunityIcons name="file-pdf-box" size={20} color="white" />
            <Text style={styles.pickBtnText}>Select PDF to Talk</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fileInfo}>
            <MaterialCommunityIcons name="file-pdf-box" size={24} color={theme.primary} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>{file.name}</Text>
              {isProcessing ? (
                <Text style={[styles.status, { color: theme.primary }]}>Analyzing document...</Text>
              ) : (
                <Text style={[styles.status, { color: theme.success }]}>Ready to chat</Text>
              )}
            </View>
            <TouchableOpacity onPress={handlePickFile}>
              <Text style={{ color: theme.primary, fontWeight: '600' }}>Change</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Chat Area */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          !file ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="robot" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Talk with your PDF</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Select a PDF file and I'll help you summarize it, find information, or answer questions about it.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Input Area */}
      <View style={[styles.inputContainer, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
        <TextInput
          style={[styles.textInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
          placeholder="Ask a question..."
          placeholderTextColor={theme.textSecondary}
          value={input}
          onChangeText={setInput}
          multiline
          editable={!!pdfBase64 && !isSending}
        />
        <TouchableOpacity 
          style={[
            styles.sendBtn, 
            { backgroundColor: (!input.trim() || !pdfBase64 || isSending) ? theme.border : theme.primary }
          ]} 
          onPress={sendMessage}
          disabled={!input.trim() || !pdfBase64 || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <MaterialCommunityIcons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  fileHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  pickBtnText: { color: 'white', fontWeight: 'bold' },
  fileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: { fontSize: 14, fontWeight: '600' },
  status: { fontSize: 12, marginTop: 2 },
  chatContent: { padding: spacing.md, paddingBottom: spacing.xl },
  messageContainer: {
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TalkWithPdfScreen;
