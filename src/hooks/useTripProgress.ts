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
    currentSpeed: _currentSpeed,
    addDistance,
    setDistance: _setDistance,
    jumpToProgress: _jumpToProgress,
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

    // Support both setTodayDistance and setTodayTraveled URL params
    const urlParams = new URLSearchParams(window.location.search);
    const setTodayDistanceParam = urlParams.get('setTodayDistance');
    const setTodayTraveledParam = urlParams.get('setTodayTraveled');
    const todayDistanceValue = setTodayDistanceParam || setTodayTraveledParam;
    if (todayDistanceValue !== null) {
      const distance = parseFloat(todayDistanceValue);
      if (!isNaN(distance) && distance >= 0 && distance <= 1000) {
        setTodayDistance(distance);
      }
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

  // --- CONSOLE COMMANDS FOR TESTING ---
  function showConsoleCommands() {
    console.log(`
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
      TripOverlay.controls.resetAutoStartLocation() - Clears the auto-detected start location for re-detection.

      // --- Data Management ---
      TripOverlay.controls.exportTripData()      - Downloads a backup file of current trip progress.
      TripOverlay.controls.importTripData(json)  - Restores trip progress from a JSON string.

      // --- Debugging ---
      TripOverlay.getStatus()           - Shows the current status of the overlay.

      // --- URL Parameters (can be added to the overlay URL) ---
      ?controls=true        - Shows the control panel on load.
      ?reset=trip           - Resets all trip data on load.
      ?reset=today          - Resets today's distance on load.
      ?reset=location       - Resets auto-start location on load.
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
      ?setTodayDistance=<km> - Sets today's distance on load.
      ?setTodayTraveled=<km> - (alias) Also sets today's distance on load.
      ?setTotalTraveled=<km>- Sets total traveled distance on load.

      ------------------------------------
      `);
  }

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
