// Weather API types based on OpenWeatherMap One Call API 3.0

export interface WeatherCondition {
  id: number
  main: string
  description: string
  icon: string
}

export interface CurrentWeather {
  temp: number
  feels_like: number
  humidity: number
  uvi: number
  weather: WeatherCondition[]
  wind_speed: number
  wind_deg: number
}

export interface DailyWeather {
  temp: {
    min: number
    max: number
  }
  weather: WeatherCondition[]
}

export interface HourlyWeather {
  dt: number
  temp: number
  weather: WeatherCondition[]
}

export interface WeatherResponse {
  current: CurrentWeather
  daily: DailyWeather[]
  hourly: HourlyWeather[]
  timezone: string // e.g., "Europe/Vienna"
  timezone_offset: number // UTC offset in seconds
}

export interface WeatherError {
  error: string
  message?: string
  status?: number
  statusText?: string
}

export interface WeatherState {
  data: WeatherResponse | null
  location: string
  isLoading: boolean
  error: string | null
  lastUpdate: number
  
  // Actions
  setWeatherData: (data: WeatherResponse) => void
  setLocation: (location: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearWeather: () => void
} 