import React, { createContext, useContext, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from '../services/syncService';

type SyncContextType = {
  triggerSync: () => Promise<void>;
  pendingCount: number;
};

const SyncContext = createContext<SyncContextType | undefined>(undefined);

/**
 * SyncProvider (TypeScript)
 * Orchestrates background sync: on mount, on foreground resume, and every 5 min.
 */
export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingCount, setPendingCount] = React.useState(0);
  const pendingCountRef = useRef(0);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const checkQueue = async () => {
    const queue = await syncService.getQueue();
    setPendingCount(queue.length);
    pendingCountRef.current = queue.length;
  };

  useEffect(() => {
    const initialSync = async () => {
      await checkQueue();
      await syncService.processQueue();
      await checkQueue();
    };
    initialSync();

    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        await syncService.processQueue();
        await checkQueue();
      }
      appState.current = nextAppState;
    });

    const interval = setInterval(async () => {
      await checkQueue();
      if (pendingCountRef.current > 0) {
        // We do a smart check inside syncService so we don't need logic here
        await syncService.processQueue();
        await checkQueue();
      }
    }, 5 * 60 * 1000);

    // Akita Mode: Smart network listener
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (state.isConnected && pendingCountRef.current > 0) {
        syncService.processQueue().finally(checkQueue);
      }
    });

    return () => {
      subscription.remove();
      clearInterval(interval);
      unsubscribeNetInfo();
    };
  }, []);

  const triggerSync = async () => {
    await syncService.processQueue();
    await checkQueue();
  };

  return (
    <SyncContext.Provider value={{ triggerSync, pendingCount }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used within a SyncProvider');
  return context;
};
