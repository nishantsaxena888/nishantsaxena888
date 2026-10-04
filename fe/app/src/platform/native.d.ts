// Ambient declarations for React Native host modules. The RN packages are
// provided by the NATIVE app (peer deps of this shared src tree) — they are
// intentionally NOT installed for the web build. These minimal decls keep
// `tsc` green on *.native.* files; Metro resolves the real modules.
declare module "react-native" {
  import React from "react";
  export const View: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const Pressable: React.ComponentType<any>;
  export const Image: React.ComponentType<any>;
  export const TextInput: React.ComponentType<any>;
  export const ScrollView: React.ComponentType<any>;
  export const SafeAreaView: React.ComponentType<any>;
  export const Linking: { openURL(url: string): Promise<any> };
  export const DeviceEventEmitter: {
    emit(name: string, data?: any): void;
    addListener(name: string, cb: (data?: any) => void): { remove(): void };
  };
  export const DevSettings: { reload(): void };
  export const StyleSheet: { create<T>(s: T): T };
  export const Platform: { OS: string; select<T>(m: Record<string, T>): T };
}

declare module "@react-navigation/native" {
  export function useNavigation<T = any>(): T;
  export function useRoute<T = { name: string; params?: any }>(): T;
  export function useFocusEffect(cb: () => void): void;
  export const NavigationContainer: any;
}

declare module "@react-native-async-storage/async-storage" {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    getAllKeys(): Promise<string[]>;
    multiGet(keys: string[]): Promise<[string, string | null][]>;
    multiSet?(pairs: [string, string][]): Promise<void>;
    clear?(): Promise<void>;
  };
  export default AsyncStorage;
}
