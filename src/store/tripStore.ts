import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { logger } from '../utils/logger'

export interface TripState {
  // Core trip data
  currentDistanceKm: number
  totalDistanceKm: number
  todayDistanceKm: number
  totalTraveledKm: number
  units: 'km' | 'miles'
  isMoving: boolean
  currentSpeed: number
  
  // Settings
  useAutoStart: boolean
  autoStartLocation: { lat: number; lon: number } | null
  
  // Actions
  setCurrentDistance: (distance: number) => void
  addDistance: (distance: number) => void
  setDistance: (distance: number) => void
  jumpToProgress: (percentage: number) => void
  setTotalDistance: (distance: number) => void
  setTodayDistance: (distance: number) => void
  setTotalTraveled: (distance: number) => void
  setUnits: (units: 'km' | 'miles') => void
  setMoving: (moving: boolean) => void
  setCurrentSpeed: (speed: number) => void
  resetProgress: () => void
  resetTodayDistance: () => void
  exportTripData: () => void
  importTripData: (data: any) => void
}

export const useTripProgressStore = create<TripState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentDistanceKm: 0,
      totalDistanceKm: 100, // Default trip length
      todayDistanceKm: 0,
      totalTraveledKm: 0,
      units: 'km',
      isMoving: false,
      currentSpeed: 0,
      useAutoStart: true,
      autoStartLocation: null,

      // Actions
      setCurrentDistance: (distance: number) => {
        set({ currentDistanceKm: Math.max(0, distance) })
      },

      addDistance: (distance: number) => {
        const currentDistance = get().currentDistanceKm
        const newDistance = Math.max(0, currentDistance + distance)
        set({ currentDistanceKm: newDistance })
        logger(`CONSOLE: ${distance >= 0 ? 'Added' : 'Adjusted'} ${Math.abs(distance).toFixed(1)}km`)
      },

      setDistance: (distance: number) => {
        const clampedDistance = Math.max(0, distance)
        set({ currentDistanceKm: clampedDistance })
        logger(`CONSOLE: Set distance to ${distance.toFixed(1)}km`)
      },

      jumpToProgress: (percentage: number) => {
        const { totalDistanceKm } = get()
        const targetDistance = (percentage / 100) * totalDistanceKm
        set({ currentDistanceKm: targetDistance })
        logger(`CONSOLE: Jumped to ${percentage}% (${targetDistance.toFixed(1)}km)`)
      },

      setTotalDistance: (newTotal: number) => {
        const clampedTotal = Math.max(1, newTotal)
        set({ totalDistanceKm: clampedTotal })
        logger(`CONSOLE: Set total distance to ${newTotal.toFixed(1)}km`)
      },

      setTodayDistance: (distance: number) => {
        const clampedDistance = Math.max(0, distance)
        set({ todayDistanceKm: clampedDistance })
        logger(`CONSOLE: Set today's distance to ${distance.toFixed(1)}km`)
      },

      setTotalTraveled: (distance: number) => {
        const clampedDistance = Math.max(0, distance)
        set({ totalTraveledKm: clampedDistance })
        logger(`CONSOLE: Set total traveled distance to ${distance.toFixed(1)}km`)
      },

      setUnits: (units: 'km' | 'miles') => {
        set({ units })
        if (units === 'miles') {
          logger('CONSOLE: Switched to miles')
        } else {
          logger('CONSOLE: Switched to kilometers')
        }
      },

      setMoving: (moving: boolean) => {
        set({ isMoving: moving })
      },

      setCurrentSpeed: (speed: number) => {
        set({ currentSpeed: Math.max(0, speed) })
      },

      resetProgress: () => {
        set({
          currentDistanceKm: 0,
          todayDistanceKm: 0,
          isMoving: false,
          currentSpeed: 0
        })
        logger('CONSOLE: Reset all trip progress')
      },

      resetTodayDistance: () => {
        set({ todayDistanceKm: 0 })
        logger('CONSOLE: Reset today\'s distance')
      },

      exportTripData: () => {
        const state = get()
        const exportData = {
          currentDistanceKm: state.currentDistanceKm,
          totalDistanceKm: state.totalDistanceKm,
          todayDistanceKm: state.todayDistanceKm,
          totalTraveledKm: state.totalTraveledKm,
          units: state.units,
          useAutoStart: state.useAutoStart,
          autoStartLocation: state.autoStartLocation,
          exportTimestamp: new Date().toISOString()
        }
        
        // Copy to clipboard
        const dataStr = JSON.stringify(exportData, null, 2)
        navigator.clipboard.writeText(dataStr).then(() => {
          logger('CONSOLE: Trip data exported to clipboard')
        }).catch(() => {
          // Fallback for older browsers
          const textarea = document.createElement('textarea')
          textarea.value = dataStr
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
          logger('CONSOLE: Trip data exported')
        })
      },

      importTripData: (data: any) => {
        try {
          if (typeof data === 'string') {
            data = JSON.parse(data)
          }
          
          // Validate and import data
          const importState: Partial<TripState> = {}
          
          if (typeof data.currentDistanceKm === 'number') {
            importState.currentDistanceKm = Math.max(0, data.currentDistanceKm)
          }
          if (typeof data.totalDistanceKm === 'number') {
            importState.totalDistanceKm = Math.max(1, data.totalDistanceKm)
          }
          if (typeof data.todayDistanceKm === 'number') {
            importState.todayDistanceKm = Math.max(0, data.todayDistanceKm)
          }
          if (typeof data.totalTraveledKm === 'number') {
            importState.totalTraveledKm = Math.max(0, data.totalTraveledKm)
          }
          if (data.units === 'km' || data.units === 'miles') {
            importState.units = data.units
          }
          if (typeof data.useAutoStart === 'boolean') {
            importState.useAutoStart = data.useAutoStart
          }
          if (data.autoStartLocation && typeof data.autoStartLocation === 'object') {
            importState.autoStartLocation = data.autoStartLocation
          }

          set(importState)
          logger('CONSOLE: Trip data imported successfully')
        } catch (error) {
          logger.error('CONSOLE: Failed to import trip data:', error)
        }
      }
    }),
    {
      name: 'trip-progress-storage',
      version: 1
    }
  )
) 