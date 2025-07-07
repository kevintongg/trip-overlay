// Trip state and related types
export type MovementMode = 'STATIONARY' | 'WALKING' | 'CYCLING'

export interface TripState {
  // State
  totalDistance: number
  traveledDistance: number
  todayDistance: number
  currentMode: MovementMode
  useImperialUnits: boolean
  
  // Actions
  updateDistance: (distance: number) => void
  setMode: (mode: MovementMode) => void
  resetTrip: () => void
  resetToday: () => void
  toggleUnits: () => void
  
  // Console command methods
  addDistance: (km: number) => void
  setDistance: (km: number) => void
  jumpToProgress: (percent: number) => void
  setTotalDistance: (km: number) => void
  setTodayDistance: (km: number) => void
  setTotalTraveled: (km: number) => void
  convertToMiles: () => void
  convertToKilometers: () => void
}

export interface TripProgress {
  totalDistanceTraveled: number
  todayDistanceTraveled: number
  lastActiveDate: string
  useImperialUnits?: boolean
  totalDistance?: number
  lastUpdate?: number
} 