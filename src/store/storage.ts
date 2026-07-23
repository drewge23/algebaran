import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/**
 * Shared persistence backend for all Zustand stores. AsyncStorage works in Expo
 * Go with no native build; if write throughput ever becomes a concern we can
 * swap this single adapter for MMKV behind a dev build.
 */
export const persistStorage = createJSONStorage(() => AsyncStorage);
