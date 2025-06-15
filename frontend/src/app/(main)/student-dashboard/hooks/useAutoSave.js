// frontend/src/app/(main)/student-dashboard/hooks/useAutoSave.js

"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Custom hook for auto-saving form data
 * @param {Object} formData - The form data to save
 * @param {string} storageKey - The key to use for localStorage
 * @param {number} delay - Delay in milliseconds before saving
 * @returns {Object} Auto-save state and utilities
 */
const useAutoSave = (formData, storageKey = "form_autosave", delay = 2000) => {
  const [lastSaved, setLastSaved] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const timerRef = useRef(null)

  // Save data to localStorage
  const saveData = () => {
    try {
      setIsSaving(true)
      setSaveError(null)

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
      const now = new Date()
      setLastSaved(now)
      setIsSaving(false)
    } catch (error) {
      console.error("Auto-save error:", error)
      setSaveError(error.message)
      setIsSaving(false)
    }
  }

  // Load data from localStorage
  const loadData = () => {
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
  }

  // Clear saved data
  const clearSavedData = () => {
    try {
      localStorage.removeItem(storageKey)
      setLastSaved(null)
    } catch (error) {
      console.error("Error clearing saved data:", error)
    }
  }

  // Auto-save effect
  useEffect(() => {
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
  }, [formData, delay])

  return {
    lastSaved,
    isSaving,
    saveError,
    saveData,
    loadData,
    clearSavedData,
  }
}

export default useAutoSave
