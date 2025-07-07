import { useTripProgressStore } from '../store/tripStore'
import { useLocalStorage } from './useLocalStorage'
import type { TripProgress } from '../types/trip'

/**
 * Console commands hook - provides all console API functionality
 * CRITICAL for streaming compatibility and manual control
 */
export function useConsoleCommands() {
  const tripStore = useTripProgressStore()
  const [, setStoredData] = useLocalStorage<TripProgress>('tripProgress', {
    totalDistanceTraveled: 0,
    todayDistanceTraveled: 0,
    lastActiveDate: new Date().toDateString()
  })

  // Console command implementations with feedback
  const consoleCommands = {
    addDistance: (km: number): string => {
      tripStore.addDistance(km)
      setStoredData(prev => ({ ...prev, lastUpdate: Date.now() }))
      const action = km >= 0 ? 'Added' : 'Adjusted'
      return `${action} ${Math.abs(km).toFixed(1)}km`
    },

    setDistance: (km: number): string => {
      tripStore.setDistance(km)
      setStoredData(prev => ({ ...prev, lastUpdate: Date.now() }))
      return `Set to ${km.toFixed(1)}km`
    },

    jumpToProgress: (percent: number): string => {
      tripStore.jumpToProgress(percent)
      setStoredData(prev => ({ ...prev, lastUpdate: Date.now() }))
      const targetDistance = (percent / 100) * tripStore.totalDistance
      return `${percent}% progress (${targetDistance.toFixed(1)}km)`
    },

    setTotalDistance: (km: number): string => {
      tripStore.setTotalDistance(km)
      return `Trip distance: ${km.toFixed(1)}km`
    },

    convertToMiles: (): string => {
      if (!tripStore.useImperialUnits) {
        tripStore.convertToMiles()
        return 'Units: Kilometers → Miles'
      }
      return 'Already using miles'
    },

    convertToKilometers: (): string => {
      if (tripStore.useImperialUnits) {
        tripStore.convertToKilometers()
        return 'Units: Miles → Kilometers'
      }
      return 'Already using kilometers'
    },

    resetTripProgress: (): string => {
      tripStore.resetTrip()
      setStoredData({
        totalDistanceTraveled: 0,
        todayDistanceTraveled: 0,
        lastActiveDate: new Date().toDateString()
      })
      console.log('CONSOLE: Reset all trip progress')
      return 'Trip progress reset'
    },

    resetTodayDistance: (): string => {
      tripStore.resetToday()
      setStoredData(prev => ({ ...prev, todayDistance: 0, lastUpdate: Date.now() }))
      console.log('CONSOLE: Reset today\'s distance')
      return 'Today\'s distance reset'
    },

    exportTripData: (): string => {
      const data = {
        totalDistanceTraveled: tripStore.traveledDistance,
        todayDistanceTraveled: tripStore.todayDistance,
        useImperialUnits: tripStore.useImperialUnits,
        totalDistance: tripStore.totalDistance,
        exportDate: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trip-overlay-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('CONSOLE: Trip data exported')
      return 'Trip data downloaded'
    },

    importTripData: (jsonString: string): string => {
      try {
        const data = JSON.parse(jsonString)
        if (data.totalDistanceTraveled !== undefined) {
          tripStore.setTotalTraveled(data.totalDistanceTraveled)
        }
        if (data.todayDistanceTraveled !== undefined) {
          tripStore.setTodayDistance(data.todayDistanceTraveled)
        }
        if (data.useImperialUnits !== undefined) {
          data.useImperialUnits ? tripStore.convertToMiles() : tripStore.convertToKilometers()
        }
        if (data.totalDistance !== undefined) {
          tripStore.setTotalDistance(data.totalDistance)
        }
        setStoredData(data)
        console.log('CONSOLE: Trip data imported successfully')
        return 'Trip data imported'
      } catch (error) {
        console.error('CONSOLE: Failed to import trip data:', error)
        return 'Import failed - invalid JSON'
      }
    },

    setTodayDistance: (km: number): string => {
      tripStore.setTodayDistance(km)
      return `Today's distance: ${km.toFixed(1)}km`
    },

    setTotalTraveled: (km: number): string => {
      tripStore.setTotalTraveled(km)
      return `Total traveled: ${km.toFixed(1)}km`
    },

    showConsoleCommands: (): string => {
      const help = `
--- Trip Overlay Console Commands ---

// --- Distance Manipulation ---
TripOverlay.controls.addDistance(km)       - Adds/subtracts distance. Ex: TripOverlay.controls.addDistance(10.5)
TripOverlay.controls.setDistance(km)       - Sets the total distance traveled. Ex: TripOverlay.controls.setDistance(100)
TripOverlay.controls.jumpToProgress(%)     - Jumps to a specific percentage of the trip. Ex: TripOverlay.controls.jumpToProgress(50)

// --- Trip Configuration ---
TripOverlay.controls.setTotalDistance(km)  - Changes the total trip distance target. Ex: TripOverlay.controls.setTotalDistance(500)

// --- Unit Conversion ---
TripOverlay.controls.convertToMiles()      - Switches display to Imperial units (miles).
TripOverlay.controls.convertToKilometers() - Switches display to Metric units (kilometers).

// --- Reset Functions ---
TripOverlay.controls.resetTripProgress()   - Resets all trip data to zero.
TripOverlay.controls.resetTodayDistance()  - Resets only the 'today' distance counter.

// --- Data Management ---
TripOverlay.controls.exportTripData()      - Downloads a backup file of current trip progress.
TripOverlay.controls.importTripData(json)  - Restores trip progress from a JSON string.

// --- Additional Commands ---
TripOverlay.controls.setTodayDistance(km)  - Sets today's distance to specific value.
TripOverlay.controls.setTotalTraveled(km)  - Sets total traveled distance to specific value.

// --- Debugging ---
TripOverlay.getStatus()           - Shows the current status of the overlay.

// --- URL Parameters (can be added to the overlay URL) ---
?controls=true        - Shows the control panel on load.
?reset=trip           - Resets all trip data on load.
?reset=today          - Resets today's distance on load.
?resets=trip,today    - Resets multiple items on load (comma-separated).
?export=true          - Downloads trip data backup on load.
?import=<json_string> - Imports trip data from a URL-encoded JSON string on load.
?units=miles          - Sets units to miles on load.
?units=km             - Sets units to kilometers on load.
?totalDistance=<km>   - Sets the total trip distance on load.
?addDistance=<km>     - Adds distance to total and today's distance on load.
?setDistance=<km>     - Sets total and today's distance on load.
?jumpTo=<percent>     - Jumps to a specific progress percentage on load.
?stream=true          - Enables stream mode (hotkey hints).
?setTodayDistance=<km>- Sets today's distance on load.
?setTotalTraveled=<km>- Sets total traveled distance on load.

------------------------------------
      `
      console.log(help)
      return 'Console commands displayed'
    },

    getStatus: () => {
      const state = tripStore
      return {
        traveledDistance: state.traveledDistance,
        todayDistance: state.todayDistance,
        totalDistance: state.totalDistance,
        progressPercent: (state.traveledDistance / state.totalDistance) * 100,
        currentMode: state.currentMode,
        useImperialUnits: state.useImperialUnits
      }
    }
  }

  return consoleCommands
} 