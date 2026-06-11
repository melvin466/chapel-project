import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@chapel_cache:';

export const cacheService = {
  /**
   * Retrieves data from the cache.
   */
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const data = await AsyncStorage.getItem(CACHE_PREFIX + key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn(`Error reading cache for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Saves data to the cache.
   */
  set: async (key: string, data: any): Promise<void> => {
    try {
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error writing cache for key "${key}":`, error);
    }
  },

  /**
   * Clears a specific cache entry.
   */
  remove: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
      console.error(`Error removing cache for key "${key}":`, error);
    }
  },

  /**
   * Clears all cache entries starting with the prefix.
   */
  clearAll: async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      for (const key of cacheKeys) {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }
};

export default cacheService;
