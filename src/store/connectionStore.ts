import { create } from 'zustand';
import type { ConnectionState } from '../types/rtirl';

export const useConnectionStore = create<ConnectionState>(set => ({
  // Initial state
  isConnected: false,
  lastPosition: null,
  connectionStatus: 'disconnected',
  reconnectAttempts: 0,

  // Actions
  setConnected: connected =>
    set({
      isConnected: connected,
      connectionStatus: connected ? 'connected' : 'disconnected',
    }),

  setPosition: position =>
    set({
      lastPosition: position,
      isConnected: true,
      connectionStatus: 'connected',
    }),

  setConnectionStatus: status =>
    set({
      connectionStatus: status,
      isConnected: status === 'connected',
    }),

  incrementReconnectAttempts: () =>
    set(state => ({
      reconnectAttempts: state.reconnectAttempts + 1,
    })),

  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
}));
