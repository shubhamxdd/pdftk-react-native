import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import PdfViewerScreen from '../screens/PdfViewerScreen';
import MergePdfScreen from '../screens/tools/MergePdfScreen';
import SplitPdfScreen from '../screens/tools/SplitPdfScreen';
import RotatePdfScreen from '../screens/tools/RotatePdfScreen';
import CompressPdfScreen from '../screens/tools/CompressPdfScreen';
import ImageToPdfScreen from '../screens/tools/ImageToPdfScreen';
import PdfToImgScreen from '../screens/tools/PdfToImgScreen';
import ReorderPdfScreen from '../screens/tools/ReorderPdfScreen';
import LockPdfScreen from '../screens/tools/LockPdfScreen';
import UnlockPdfScreen from '../screens/tools/UnlockPdfScreen';
import TalkWithPdfScreen from '../screens/tools/TalkWithPdfScreen';
import { useAppTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { theme } = useAppTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
        }}
      >
        <Stack.Screen name="MainTabs" component={BottomTabs} />
        <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
        <Stack.Screen 
          name="MergePdf" 
          component={MergePdfScreen} 
          options={{ headerShown: true, title: 'Merge PDF' }} 
        />
        <Stack.Screen 
          name="SplitPdf" 
          component={SplitPdfScreen} 
          options={{ headerShown: true, title: 'Split PDF' }} 
        />
        <Stack.Screen 
          name="RotatePdf" 
          component={RotatePdfScreen} 
          options={{ headerShown: true, title: 'Rotate PDF' }} 
        />
        <Stack.Screen 
          name="CompressPdf" 
          component={CompressPdfScreen} 
          options={{ headerShown: true, title: 'Compress PDF' }} 
        />
        <Stack.Screen 
          name="ImageToPdf" 
          component={ImageToPdfScreen} 
          options={{ headerShown: true, title: 'Image to PDF' }} 
        />
        <Stack.Screen 
          name="PdfToImg" 
          component={PdfToImgScreen} 
          options={{ headerShown: true, title: 'PDF to Images' }} 
        />
        <Stack.Screen 
          name="ReorderPdf" 
          component={ReorderPdfScreen} 
          options={{ headerShown: true, title: 'Reorder Pages' }} 
        />
        <Stack.Screen 
          name="LockPdf" 
          component={LockPdfScreen} 
          options={{ headerShown: true, title: 'Lock PDF' }} 
        />
        <Stack.Screen 
          name="UnlockPdf" 
          component={UnlockPdfScreen} 
          options={{ headerShown: true, title: 'Unlock PDF' }} 
        />
        <Stack.Screen 
          name="TalkWithPdf" 
          component={TalkWithPdfScreen} 
          options={{ headerShown: true, title: 'Talk with PDF' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
