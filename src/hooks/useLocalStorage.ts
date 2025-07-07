import { useState, useEffect } from 'react'
import { logger } from '../utils/logger'

/**
 * Custom hook for localStorage with React integration
 * Provides type-safe localStorage operations with automatic parsing/serialization
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item === null) {
        return initialValue
      }
      return JSON.parse(item)
    } catch (error) {
      logger.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Save state
      setStoredValue(valueToStore)
      
      // Save to local storage
             if (valueToStore === undefined || valueToStore === null) {
         window.localStorage.removeItem(key)
         logger.debug(`Removed localStorage key "${key}"`)
       } else {
         window.localStorage.setItem(key, JSON.stringify(valueToStore))
         logger.debug(`Saved to localStorage key "${key}"`)
       }
         } catch (error) {
       logger.error(`Error setting localStorage key "${key}":`, error)
     }
  }

  // Listen for changes to localStorage from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
                 try {
           setStoredValue(JSON.parse(e.newValue))
           logger.debug(`Updated from external change: "${key}"`)
         } catch (error) {
           logger.warn(`Error parsing localStorage change for key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue] as const
} 