import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@ConexaoTerapeutica:';

/**
 * Storage Utility (Akita Mode — TypeScript)
 * Type-safe wrapper for AsyncStorage with JSON parsing and error handling.
 */
export const storage = {
  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(`${PREFIX}${key}`, jsonValue);
      return true;
    } catch (e) {
      // Intentionally silent for callers — service layer handles fallback
      return false;
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(`${PREFIX}${key}`);
      return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
    } catch {
      return null;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(`${PREFIX}${key}`);
      return true;
    } catch {
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter((k) => k.startsWith(PREFIX));
      await AsyncStorage.multiRemove(appKeys as string[]);
      return true;
    } catch {
      return false;
    }
  },
};
