// TypeScript interfaces for configuration
export interface MovementMode {
  maxSpeed: number
  minMovementM: number
  gpsThrottle: number
  avatar: string
}

export interface ConfigType {
  rtirl: {
    userId: string
    demoMode: boolean
  }
  trip: {
    totalDistanceKm: number
    useAutoStart: boolean
    manualStartLocation: { lat: number; lon: number }
  }
  weather: {
    updateInterval: number
    useMetric: boolean
  }
  time: {
    use24Hour: boolean
    showSeconds: boolean
    updateInterval: number
  }
  movement: {
    modes: {
      STATIONARY: MovementMode
      WALKING: MovementMode
      CYCLING: MovementMode
    }
    modeSwitchDelay: number
  }
  performance: {
    uiUpdateDebounce: number
    saveDebounceDelay: number
  }
}

export interface WeatherIcons {
  [key: number]: string
}

export interface Coordinates {
  lat: number
  lon: number
} 