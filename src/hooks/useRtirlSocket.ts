import { useEffect, useState, useRef } from 'react'
import { useConnectionStore } from '../store/connectionStore'
import { logger } from '../utils/logger'
import { CONFIG } from '../utils/config'
import type { Coordinates } from '../types/config'
import type { LocationData } from '../types/rtirl'

declare global {
  interface Window {
    RealtimeIRL?: {
      forStreamer: (platform: string, userId: string) => {
        addLocationListener: (callback: (data: any) => void) => () => void
      }
    }
  }
}

interface DemoState {
  updateCount: number
  lat: number
  lon: number
  speed: number
  mode: 'WALKING' | 'CYCLING' | 'STATIONARY'
}

// Check if demo mode is enabled
const isDemo = CONFIG.rtirl.demoMode || new URLSearchParams(window.location.search).get('demo') === 'true'

// Global flag to prevent duplicate RTIRL connections
let isRtirlInitialized = false

export function useRtirlSocket() {
  const { 
    setConnected, 
    setPosition, 
    setConnectionStatus, 
    incrementReconnectAttempts,
    resetReconnectAttempts,
    isConnected,
    lastPosition,
    connectionStatus,
    reconnectAttempts
  } = useConnectionStore()

  const [rtirl, setRtirl] = useState<any>(null)
  const intervalRef = useRef<number>()
  const initRef = useRef<boolean>(false)
  const demoStateRef = useRef<DemoState>({
    updateCount: 0,
    lat: 48.2082, // Vienna coordinates for demo
    lon: 16.3738,
    speed: 0,
    mode: 'STATIONARY'
  })

  // Handle location updates from RTIRL
  const handleLocationUpdate = (data: any) => {
    if (!data) {
      logger.warn('📍 Trip: Location is hidden or streamer is offline')
      setConnected(false)
      setConnectionStatus('disconnected')
      return
    }

    // Validate coordinates
    if (!data.latitude || !data.longitude || 
        typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
      logger.warn('⚠️ Trip: Invalid GPS coordinates received:', data)
      return
    }

    const coordinates: Coordinates = {
      lat: data.latitude,
      lon: data.longitude
    }

    const isFirstConnection = !isConnected
    if (isFirstConnection) {
      logger('✅ Trip: Streamer location is now live!')
    }

    if (isDemo) {
      const state = demoStateRef.current
      if (state.updateCount === 1 || state.updateCount % 5 === 0) {
        logger(`🎭 Demo update #${state.updateCount} - ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)} @ ${data.speed?.toFixed(1) || 0}km/h`)
      }
    } else {
      logger(`📡 Trip: Location received - ${data.latitude?.toFixed(4) || 'N/A'}, ${data.longitude?.toFixed(4) || 'N/A'}`)
    }

    setPosition(coordinates)
    setConnected(true)
    setConnectionStatus('connected')
    resetReconnectAttempts()

    // Dispatch custom event for location update with full data
    const locationData: LocationData = {
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy || 10,
      speed: data.speed || 0,
      timestamp: Date.now(),
      source: isDemo ? 'demo' : 'rtirl'
    }
    
    window.dispatchEvent(new CustomEvent('locationUpdate', { detail: locationData }))
  }

  // Demo mode implementation
  useEffect(() => {
    if (isDemo && !initRef.current) {
      initRef.current = true
      logger('🎭 Demo mode enabled, starting demo data')
      
      const generateDemoData = () => {
        const state = demoStateRef.current
        state.updateCount++
        
        // Simulate movement with varying speed
        const speedVariation = Math.sin(state.updateCount * 0.1) * 5 + 15
        state.speed = Math.max(0, speedVariation)
        
        // Move coordinates slightly (simulate cycling)
        const movement = 0.0001 // ~11 meters
        state.lat += (Math.random() - 0.5) * movement
        state.lon += (Math.random() - 0.5) * movement
        
        // Determine mode based on speed
        if (state.speed > 8) {
          state.mode = 'CYCLING'
        } else if (state.speed > 2) {
          state.mode = 'WALKING'
        } else {
          state.mode = 'STATIONARY'
        }

        handleLocationUpdate({
          latitude: state.lat,
          longitude: state.lon,
          accuracy: 5,
          speed: state.speed,
          source: 'demo'
        })
      }

      // Start demo data updates
      intervalRef.current = window.setInterval(generateDemoData, 1000) // Match original 1s interval
      generateDemoData() // Initial update

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [isDemo])

  // RTIRL connection setup
  useEffect(() => {
    if (isDemo) return
    
    // Prevent duplicate initialization in React StrictMode
    if (isRtirlInitialized || initRef.current) {
      return
    }
    
    initRef.current = true
    isRtirlInitialized = true

    // Check if RTIRL library is loaded
    if (!window.RealtimeIRL || typeof window.RealtimeIRL.forStreamer !== 'function') {
      logger.error('❌ RTIRL library not loaded!')
      setConnectionStatus('error')
      return
    }

    const initRtirl = async () => {
      try {
        logger('🔌 Connecting to RTIRL...')
        logger('📋 User ID:', CONFIG.rtirl.userId)
        
        setConnectionStatus('connecting')
        
        const streamer = window.RealtimeIRL!.forStreamer('twitch', CONFIG.rtirl.userId)
        const locationListener = streamer.addLocationListener((data: any) => {
          handleLocationUpdate(data)
        })
        
        setRtirl({ streamer, locationListener })
        resetReconnectAttempts()
        
        logger('✅ RTIRL listener attached successfully')
        
      } catch (error) {
        logger.error('❌ Failed to connect to RTIRL:', error)
        setConnectionStatus('error')
        incrementReconnectAttempts()
      }
    }

    initRtirl()

    return () => {
      if (rtirl && rtirl.locationListener) {
        rtirl.locationListener() // Remove listener
      }
      // Reset flags on cleanup for proper re-initialization if needed
      isRtirlInitialized = false
      initRef.current = false
    }
  }, [isDemo])

  return {
    isConnected,
    lastPosition,
    connectionStatus,
    reconnectAttempts,
    isDemo,
    reconnect: () => {
      if (!isDemo) {
        logger('🔌 Attempting to reconnect...')
        setConnectionStatus('connecting')
        incrementReconnectAttempts()
      }
    }
  }
} 