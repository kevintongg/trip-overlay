// GPS Utilities - TypeScript Version
// Used by both trip-progress and dashboard overlays

import type { Coordinates } from '../types/config'

// Calculate distance between two GPS coordinates using Haversine formula
export const calculateDistance = (pos1: Coordinates | null, pos2: Coordinates | null): number => {
  if (!pos1 || !pos2 || !pos1.lat || !pos1.lon || !pos2.lat || !pos2.lon) {
    return 0
  }

  const R = 6371 // Earth's radius in kilometers
  const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180
  const dLon = ((pos2.lon - pos1.lon) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pos1.lat * Math.PI) / 180) *
      Math.cos((pos2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.max(0, R * c) // Ensure non-negative distance
}

// Validate GPS coordinates
export const isValidGPS = (lat: number, lon: number): boolean => {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    isFinite(lat) &&
    isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  )
}

// Validate coordinates object
export const isValidCoordinates = (coords: Coordinates | null): coords is Coordinates => {
  return coords !== null && isValidGPS(coords.lat, coords.lon)
} 