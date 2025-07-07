import { useCallback, useEffect, useRef } from 'react';
import { useTripProgressStore } from '../store/tripStore';
import { useLocalStorage } from './useLocalStorage';
import type { TripProgress } from '../types/trip';

/**
 * Custom hook for managing trip progress with localStorage persistence
 */
export function useTripProgress() {
  const {
    totalDistanceKm,
    currentDistanceKm,
    todayDistanceKm,
    totalTraveledKm,
    units,
    isMoving,
    currentSpeed,
    addDistance,
    setDistance,
    jumpToProgress,
    setTotalDistance,
    setTodayDistance,
    setTotalTraveled,
    setUnits,
    resetProgress,
    resetTodayDistance,
  } = useTripProgressStore();

  const [persistedData, setPersistentData] = useLocalStorage<TripProgress>(
    'tripProgress',
    {
      totalDistanceTraveled: 0,
      todayDistanceTraveled: 0,
      lastActiveDate: new Date().toDateString(),
    }
  );

  // Track if we've loaded initial data to prevent infinite loops
  const hasLoadedInitialData = useRef(false);

  // Load persisted data on mount (only once)
  useEffect(() => {
    if (hasLoadedInitialData.current) {
      return;
    }

    // Only load if there's actual persisted data
    const hasPersistedData =
      persistedData.totalDistanceTraveled > 0 ||
      persistedData.todayDistanceTraveled > 0 ||
      persistedData.useImperialUnits !== undefined ||
      (persistedData.totalDistance && persistedData.totalDistance > 0);

    if (hasPersistedData) {
      if (persistedData.totalDistanceTraveled > 0) {
        setTotalTraveled(persistedData.totalDistanceTraveled);
      }
      if (persistedData.todayDistanceTraveled > 0) {
        setTodayDistance(persistedData.todayDistanceTraveled);
      }
      if (persistedData.useImperialUnits !== undefined) {
        if (persistedData.useImperialUnits) {
          setUnits('miles');
        } else {
          setUnits('km');
        }
      }
      if (persistedData.totalDistance && persistedData.totalDistance > 0) {
        setTotalDistance(persistedData.totalDistance);
      }
    }

    hasLoadedInitialData.current = true;
  }, [
    persistedData,
    setTotalTraveled,
    setTodayDistance,
    setUnits,
    setTotalDistance,
  ]);

  // Save progress to localStorage when state changes
  const saveProgress = useCallback(() => {
    const currentDate = new Date().toDateString();
    setPersistentData({
      totalDistanceTraveled: totalTraveledKm,
      todayDistanceTraveled: todayDistanceKm,
      lastActiveDate: currentDate,
      useImperialUnits: units === 'miles',
      totalDistance: totalDistanceKm,
      lastUpdate: Date.now(),
    });
  }, [
    totalTraveledKm,
    todayDistanceKm,
    units,
    totalDistanceKm,
    setPersistentData,
  ]);

  // Auto-save when values change
  useEffect(() => {
    const timeoutId = setTimeout(saveProgress, 500); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [saveProgress]);

  // Calculate progress percentage
  const progressPercent =
    totalDistanceKm > 0 ? (currentDistanceKm / totalDistanceKm) * 100 : 0;

  // Calculate remaining distance
  const remainingDistance = Math.max(0, totalDistanceKm - currentDistanceKm);

  // Unit conversion helpers
  const toDisplayUnit = useCallback(
    (km: number) => {
      return units === 'miles' ? km * 0.621371 : km;
    },
    [units]
  );

  const getUnitLabel = useCallback(() => {
    return units === 'miles' ? 'mi' : 'km';
  }, [units]);

  return {
    // State values
    totalDistance: toDisplayUnit(totalDistanceKm),
    traveledDistance: toDisplayUnit(currentDistanceKm),
    todayDistance: toDisplayUnit(todayDistanceKm),
    remainingDistance: toDisplayUnit(remainingDistance),
    progressPercent,
    currentMode: isMoving ? 'CYCLING' : 'STATIONARY', // Simple mode mapping
    useImperialUnits: units === 'miles',

    // Display helpers
    toDisplayUnit,
    getUnitLabel,

    // Actions
    updateDistance: addDistance,
    resetTrip: resetProgress,
    resetToday: resetTodayDistance,
    setMode: () => {}, // Not implemented in store yet
    toggleUnits: () => setUnits(units === 'km' ? 'miles' : 'km'),
    saveProgress,

    // Raw values (for calculations)
    rawTotalDistance: totalDistanceKm,
    rawTraveledDistance: currentDistanceKm,
    rawTodayDistance: todayDistanceKm,
  };
}
