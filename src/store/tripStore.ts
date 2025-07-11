import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TripProgressState {
  // Core distances
  totalDistanceKm: number;
  currentDistanceKm: number;
  todayDistanceKm: number;
  totalTraveledKm: number;

  // Display and settings
  units: 'km' | 'miles';
  isMoving: boolean;
  currentSpeed: number;
  currentMode: 'STATIONARY' | 'WALKING' | 'CYCLING';
  modeChangeCounter: number;

  // Actions for distance manipulation
  addDistance: (km: number) => void;
  setDistance: (km: number) => void;
  jumpToProgress: (percent: number) => void;
  setTotalDistance: (km: number) => void;
  setTodayDistance: (km: number) => void;
  setTotalTraveled: (km: number) => void;
  setUnits: (units: 'km' | 'miles') => void;
  resetProgress: () => void;
  resetTodayDistance: () => void;

  // Speed and movement
  updateSpeed: (speed: number) => void;
  setMoving: (moving: boolean) => void;
  setCurrentMode: (mode: 'STATIONARY' | 'WALKING' | 'CYCLING') => void;

  // Data import/export
  exportTripData: () => string;
  importTripData: (data: any) => string;
}

export const useTripProgressStore = create<TripProgressState>()(
  persist(
    (set, get) => ({
  // Initial state
  totalDistanceKm: 371, // Distance from Vienna to Zagreb (matches CONFIG)
  currentDistanceKm: 0,
  todayDistanceKm: 0,
  totalTraveledKm: 0,
  units: 'km',
  isMoving: false,
  currentSpeed: 0,
  currentMode: 'STATIONARY',
  modeChangeCounter: 0,

  // Distance manipulation actions
  addDistance: (km: number) =>
    set(state => ({
      currentDistanceKm: Math.max(0, state.currentDistanceKm + km),
      todayDistanceKm: Math.max(0, state.todayDistanceKm + km),
      totalTraveledKm: Math.max(0, state.totalTraveledKm + km),
    })),

  setDistance: (km: number) =>
    set(_state => ({
      currentDistanceKm: Math.max(0, km),
      todayDistanceKm: Math.max(0, km),
      totalTraveledKm: Math.max(0, km),
    })),

  jumpToProgress: (percent: number) =>
    set(state => {
      const targetDistance = (percent / 100) * state.totalDistanceKm;
      return {
        currentDistanceKm: Math.max(0, targetDistance),
        totalTraveledKm: Math.max(state.totalTraveledKm, targetDistance),
      };
    }),

  setTotalDistance: (km: number) =>
    set({
      totalDistanceKm: Math.max(0, km),
    }),

  setTodayDistance: (km: number) =>
    set({
      todayDistanceKm: Math.max(0, km),
    }),

  setTotalTraveled: (km: number) =>
    set({
      totalTraveledKm: Math.max(0, km),
      currentDistanceKm: Math.max(0, km),
    }),

  setUnits: (units: 'km' | 'miles') => set({ units }),

  resetProgress: () =>
    set({
      currentDistanceKm: 0,
      todayDistanceKm: 0,
      totalTraveledKm: 0,
    }),

  resetTodayDistance: () =>
    set({
      todayDistanceKm: 0,
    }),

  // Speed and movement actions
  updateSpeed: (speed: number) =>
    set({
      currentSpeed: speed,
      isMoving: speed > 0,
    }),

  setMoving: (moving: boolean) => set({ isMoving: moving }),

  setCurrentMode: (mode: 'STATIONARY' | 'WALKING' | 'CYCLING') => set({ currentMode: mode }),

  // Data import/export
  exportTripData: () => {
    const state = get();
    const data = {
      totalDistanceTraveled: state.totalTraveledKm,
      todayDistanceTraveled: state.todayDistanceKm,
      useImperialUnits: state.units === 'miles',
      totalDistance: state.totalDistanceKm,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-overlay-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return 'Trip data downloaded';
  },

  importTripData: (data: any) => {
    try {
      if (data.totalDistanceTraveled !== undefined) {
        get().setTotalTraveled(data.totalDistanceTraveled);
      }
      if (data.todayDistanceTraveled !== undefined) {
        get().setTodayDistance(data.todayDistanceTraveled);
      }
      if (data.useImperialUnits !== undefined) {
        get().setUnits(data.useImperialUnits ? 'miles' : 'km');
      }
      if (data.totalDistance !== undefined) {
        get().setTotalDistance(data.totalDistance);
      }
      return 'Trip data imported';
    } catch (error) {
      console.error('Failed to import trip data:', error);
      return 'Import failed - invalid data';
    }
  },
    }),
    {
      name: 'trip-overlay-storage', // localStorage key
      partialize: (state) => ({
        totalDistanceKm: state.totalDistanceKm,
        totalTraveledKm: state.totalTraveledKm,
        todayDistanceKm: state.todayDistanceKm,
        units: state.units,
      }),
    }
  )
);

// Keep the old export for backward compatibility with the new trip overlay
export const useTripStore = useTripProgressStore;
