"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Enhanced Auto-Save Hook
 * Generic auto-save functionality that can be used for any form data
 * Supports both localStorage and API saving
 */
const useAutoSave = (formData, options = {}) => {
  const {
    storageKey = "form_autosave",
    delay = 2000,
    saveToAPI = null, // Function to save to API
    saveToLocalStorage = true,
    onSave = null, // Callback after successful save
    onError = null, // Callback on save error
    enabled = true
  } = options

  const [lastSaved, setLastSaved] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveCount, setSaveCount] = useState(0)
  const timerRef = useRef(null)
  const lastDataRef = useRef(null)

  // Check if data has meaningful changes
  const hasChanges = useCallback((currentData, lastData) => {
    if (!lastData) return true

    // Simple deep comparison for basic objects
    const currentStr = JSON.stringify(currentData)
    const lastStr = JSON.stringify(lastData)
    return currentStr !== lastStr
  }, [])

  // Save data to localStorage
  const saveToLocal = useCallback(() => {
    try {
      // Filter out any File objects or complex data that can't be serialized
      const sanitizedData = Object.entries(formData).reduce((acc, [key, value]) => {
        // Skip File objects and functions
        if (value instanceof File || typeof value === "function") {
          return acc
        }

        // Handle Date objects
        if (value instanceof Date) {
          acc[key] = value.toISOString()
          return acc
        }

        // Include all other serializable data
        acc[key] = value
        return acc
      }, {})

      localStorage.setItem(storageKey, JSON.stringify(sanitizedData))
      return true
    } catch (error) {
      console.error("Local storage save error:", error)
      return false
    }
  }, [formData, storageKey])

  // Save data to API
  const saveToAPIAsync = useCallback(async () => {
    if (!saveToAPI || typeof saveToAPI !== 'function') {
      return true
    }

    try {
      await saveToAPI(formData)
      return true
    } catch (error) {
      console.error("API save error:", error)
      throw error
    }
  }, [formData, saveToAPI])

  // Main save function
  const saveData = useCallback(async () => {
    if (!enabled || !formData) return

    setIsSaving(true)
    setSaveError(null)

    try {
      let success = true

      // Save to localStorage if enabled
      if (saveToLocalStorage) {
        success = saveToLocal()
      }

      // Save to API if provided
      if (success && saveToAPI) {
        await saveToAPIAsync()
      }

      if (success) {
        const now = new Date()
        setLastSaved(now)
        setSaveCount(prev => prev + 1)
        lastDataRef.current = JSON.parse(JSON.stringify(formData)) // Deep copy

        // Call success callback
        if (onSave) {
          onSave(formData, now)
        }
      }
    } catch (error) {
      console.error("Auto-save error:", error)
      setSaveError(error.message)

      // Call error callback
      if (onError) {
        onError(error, formData)
      }
    } finally {
      setIsSaving(false)
    }
  }, [formData, enabled, saveToLocalStorage, saveToAPI, saveToLocal, saveToAPIAsync, onSave, onError])

  // Load data from localStorage
  const loadData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(storageKey)
      if (savedData) {
        return JSON.parse(savedData)
      }
      return null
    } catch (error) {
      console.error("Auto-load error:", error)
      return null
    }
  }, [storageKey])

  // Clear saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      setLastSaved(null)
      setSaveCount(0)
      lastDataRef.current = null
    } catch (error) {
      console.error("Error clearing saved data:", error)
    }
  }, [storageKey])

  // Manual save function
  const saveNow = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    await saveData()
  }, [saveData])

  // Auto-save effect
  useEffect(() => {
    if (!enabled || !formData) return

    // Check if data has meaningful changes
    if (!hasChanges(formData, lastDataRef.current)) {
      return
    }

    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Set new timer
    timerRef.current = setTimeout(() => {
      saveData()
    }, delay)

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [formData, delay, enabled, saveData, hasChanges])

  return {
    lastSaved,
    isSaving,
    saveError,
    saveCount,
    saveData: saveNow,
    loadData,
    clearSavedData,
    hasChanges: () => hasChanges(formData, lastDataRef.current)
  }
}

export default useAutoSave
