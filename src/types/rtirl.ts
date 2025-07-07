// RTIRL API and connection types
import type { Coordinates } from './config'

export interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  speed: number
  timestamp: number
  source: 'rtirl' | 'demo'
}

export interface ConnectionState {
  isConnected: boolean
  lastPosition: Coordinates | null
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  reconnectAttempts: number
  
  // Actions
  setConnected: (connected: boolean) => void
  setPosition: (position: Coordinates) => void
  setConnectionStatus: (status: ConnectionState['connectionStatus']) => void
  incrementReconnectAttempts: () => void
  resetReconnectAttempts: () => void
}

export interface RTIRLMessage {
  event: string
  data: LocationData
} 