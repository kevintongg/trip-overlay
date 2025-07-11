import { create } from 'zustand';
import type { WeatherState } from '../types/weather';

export const useWeatherStore = create<WeatherState>(set => ({
  // Initial state
  data: null,
  location: '',
  isLoading: false,
  error: null,
  lastUpdate: 0,

  // Actions
  setWeatherData: data =>
    set({
      data,
      error: null,
      isLoading: false,
      lastUpdate: Date.now(),
    }),

  setLocation: location => set({ location }),

  setLoading: loading => set({ isLoading: loading }),

  setError: error =>
    set({
      error,
      isLoading: false,
    }),

  clearWeather: () =>
    set({
      data: null,
      location: '',
      error: null,
      isLoading: false,
      lastUpdate: 0,
    }),
}));
