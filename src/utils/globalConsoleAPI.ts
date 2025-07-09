/**
 * Global Console API - Exposes trip overlay controls to browser console
 * This maintains compatibility with the original vanilla JS console commands
 * Updated to work with the new unified hook system
 */

// Store reference to the current trip overlay instance
let tripOverlayControls: any = null;

export const setupGlobalConsoleAPI = (controls: any) => {
  tripOverlayControls = controls;

  // Set up TripOverlay global object
  (window as any).TripOverlay = {
    controls: {
      addDistance: (km: number) => {
        if (tripOverlayControls) {
          tripOverlayControls.addDistance(km);
        }
      },
      setDistance: (km: number) => {
        if (tripOverlayControls) {
          tripOverlayControls.setDistance(km);
        }
      },
      jumpToProgress: (percent: number) => {
        if (tripOverlayControls) {
          tripOverlayControls.jumpToProgress(percent);
        }
      },
      setTotalDistance: (km: number) => {
        if (tripOverlayControls) {
          tripOverlayControls.setTotalDistance(km);
        }
      },
      convertToMiles: () => {
        if (tripOverlayControls) {
          tripOverlayControls.convertToMiles();
        }
      },
      convertToKilometers: () => {
        if (tripOverlayControls) {
          tripOverlayControls.convertToKilometers();
        }
      },
      resetTripProgress: () => {
        if (tripOverlayControls) {
          tripOverlayControls.resetTripProgress();
        }
      },
      resetTodayDistance: () => {
        if (tripOverlayControls) {
          tripOverlayControls.resetTodayDistance();
        }
      },
      resetAutoStartLocation: () => {
        try {
          const saved = localStorage.getItem('trip-overlay-data');
          if (saved) {
            const data = JSON.parse(saved);
            data.autoStartLocation = null;
            localStorage.setItem('trip-overlay-data', JSON.stringify(data));
            console.log('✅ Auto start location reset');
          } else {
            console.log('No trip data found to reset');
          }
        } catch (error) {
          console.error('Failed to reset auto start location:', error);
        }
      },
      exportTripData: () => {
        if (tripOverlayControls && tripOverlayControls.getStatus) {
          const status = tripOverlayControls.getStatus();
          const data = {
            totalDistanceTraveled: status.totalDistanceTraveled,
            todayDistanceTraveled: status.todayDistanceTraveled,
            useImperialUnits: status.useImperialUnits,
            totalDistance: status.originalTotalDistance,
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

          console.log('Trip data exported successfully');
        } else {
          console.log('exportTripData - controls not available');
        }
      },
      importTripData: (data: any) => {
        if (tripOverlayControls) {
          const jsonString =
            typeof data === 'string' ? data : JSON.stringify(data);
          tripOverlayControls.importTripData(jsonString);
        }
      },
    },
    getStatus: () => {
      if (tripOverlayControls) {
        return tripOverlayControls.getStatus();
      }
      return null;
    },
  };

  // Set up the global helper function
  (window as any).showConsoleCommands = () => {
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
  };

  // Backward compatibility - set up direct global functions
  if (tripOverlayControls) {
    (window as any).addDistance = tripOverlayControls.addDistance;
    (window as any).setDistance = tripOverlayControls.setDistance;
    (window as any).jumpToProgress = tripOverlayControls.jumpToProgress;
    (window as any).convertToMiles = tripOverlayControls.convertToMiles;
    (window as any).convertToKilometers =
      tripOverlayControls.convertToKilometers;
    (window as any).resetTripProgress = tripOverlayControls.resetTripProgress;
    (window as any).resetTodayDistance = tripOverlayControls.resetTodayDistance;
    (window as any).getStatus = tripOverlayControls.getStatus;
  }
};
