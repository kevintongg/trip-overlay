import { create } from 'zustand';

export interface Coordinates {
  lat: number;
  lon: number;
}

interface ConnectionState {
  isConnected: boolean;
  lastPosition: Coordinates | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  reconnectAttempts: number;
  isDashboardDemoActive: boolean; // Replace global window flag

  // Actions
  setConnected: (connected: boolean) => void;
  setPosition: (position: Coordinates) => void;
  setConnectionStatus: (
    status: 'disconnected' | 'connecting' | 'connected' | 'error'
  ) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  setDashboardDemoActive: (active: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>(set => ({
  isConnected: false,
  lastPosition: null,
  connectionStatus: 'disconnected',
  reconnectAttempts: 0,
  isDashboardDemoActive: false,

  setConnected: (_connected: boolean) => set({ isConnected: _connected }),
  setPosition: (_position: Coordinates) => set({ lastPosition: _position }),
  setConnectionStatus: (
    _status: 'disconnected' | 'connecting' | 'connected' | 'error'
  ) => set({ connectionStatus: _status }),
  incrementReconnectAttempts: () =>
    set(state => ({
      reconnectAttempts: state.reconnectAttempts + 1,
    })),
  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
  setDashboardDemoActive: (_active: boolean) =>
    set({ isDashboardDemoActive: _active }),
}));
