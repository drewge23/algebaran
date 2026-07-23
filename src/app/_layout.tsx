import '@/i18n';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Keep the native splash up until the loading screen takes over.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = { initialRouteName: 'index' };

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false, headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lesson/[id]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen
            name="hints"
            options={{ presentation: 'modal', headerShown: true, title: '' }}
          />
          <Stack.Screen name="achievements" options={{ headerShown: true, title: '' }} />
        </Stack>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
