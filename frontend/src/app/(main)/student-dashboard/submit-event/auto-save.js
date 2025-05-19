"use client"

import { useEffect, useCallback } from "react"
import { debounce } from "lodash"

/**
 * Custom hook to handle auto-saving form data
 * @param {Object} formData - The current form data
 * @param {string} formStep - The current step in the form
 * @param {string} formId - Unique identifier for the form
 * @returns {Object} - Functions to handle auto-save functionality
 */
export function useAutoSave(formData, formStep, formId = "event-submission") {
  // Function to save form data to localStorage
  const saveFormData = useCallback(
    (data, step) => {
      if (typeof window === "undefined") return

      try {
        // Get existing drafts
        const existingDraftsJSON = localStorage.getItem("eventSubmissionDrafts")
        const existingDrafts = existingDraftsJSON ? JSON.parse(existingDraftsJSON) : []

        // Find if this form already has a draft
        const draftIndex = existingDrafts.findIndex((draft) => draft.id === formId)

        // Create new draft object
        const newDraft = {
          id: formId,
          name: data.eventTitle || "Untitled Draft",
          lastEdited: new Date().toISOString(),
          step: step,
          progress: calculateProgress(data, step),
          data: data,
        }

        // Update or add the draft
        if (draftIndex >= 0) {
          existingDrafts[draftIndex] = newDraft
        } else {
          existingDrafts.push(newDraft)
        }

        // Save back to localStorage
        localStorage.setItem("eventSubmissionDrafts", JSON.stringify(existingDrafts))

        console.log("Form data auto-saved", newDraft)
        return true
      } catch (error) {
        console.error("Error saving form data:", error)
        return false
      }
    },
    [formId],
  )

  // Debounced version of saveFormData to prevent too many saves
  const debouncedSave = useCallback(
    debounce((data, step) => saveFormData(data, step), 500),
    [saveFormData],
  )

  // Auto-save whenever formData or formStep changes
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      debouncedSave(formData, formStep)
    }
  }, [formData, formStep, debouncedSave])

  // Function to load saved form data
  const loadFormData = useCallback(() => {
    if (typeof window === "undefined") return null

    try {
      // Check if there's a current draft being edited
      const currentDraftJSON = localStorage.getItem("currentDraft")
      if (currentDraftJSON) {
        const currentDraft = JSON.parse(currentDraftJSON)
        // Clear the current draft marker
        localStorage.removeItem("currentDraft")
        return currentDraft.data
      }

      // Otherwise check for existing drafts
      const existingDraftsJSON = localStorage.getItem("eventSubmissionDrafts")
      if (!existingDraftsJSON) return null

      const existingDrafts = JSON.parse(existingDraftsJSON)
      const draft = existingDrafts.find((draft) => draft.id === formId)

      return draft ? draft.data : null
    } catch (error) {
      console.error("Error loading form data:", error)
      return null
    }
  }, [formId])

  // Function to check if there are any saved drafts
  const hasSavedDrafts = useCallback(() => {
    if (typeof window === "undefined") return false

    try {
      const existingDraftsJSON = localStorage.getItem("eventSubmissionDrafts")
      if (!existingDraftsJSON) return false

      const existingDrafts = JSON.parse(existingDraftsJSON)
      return existingDrafts.length > 0
    } catch (error) {
      console.error("Error checking for saved drafts:", error)
      return false
    }
  }, [])

  // Function to delete a draft
  const deleteDraft = useCallback((draftId) => {
    if (typeof window === "undefined") return false

    try {
      const existingDraftsJSON = localStorage.getItem("eventSubmissionDrafts")
      if (!existingDraftsJSON) return false

      const existingDrafts = JSON.parse(existingDraftsJSON)
      const updatedDrafts = existingDrafts.filter((draft) => draft.id !== draftId)

      localStorage.setItem("eventSubmissionDrafts", JSON.stringify(updatedDrafts))
      return true
    } catch (error) {
      console.error("Error deleting draft:", error)
      return false
    }
  }, [])

  return {
    saveFormData,
    loadFormData,
    hasSavedDrafts,
    deleteDraft,
  }
}

/**
 * Calculate the progress percentage based on form data and current step
 * @param {Object} data - The form data
 * @param {string} step - The current form step
 * @returns {number} - Progress percentage (0-100)
 */
function calculateProgress(data, step) {
  // Define the steps and their weights
  const steps = {
    overview: 10,
    orgInfo: 30,
    schoolEvent: 60,
    communityEvent: 60,
    reporting: 90,
  }

  // Base progress on the current step
  let progress = steps[step] || 0

  // Add additional progress based on filled fields
  const totalFields = Object.keys(data).length
  const filledFields = Object.values(data).filter((value) => {
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === "object" && value !== null) return Object.keys(value).length > 0
    return value !== undefined && value !== null && value !== ""
  }).length

  // Add up to 10% based on field completion
  if (totalFields > 0) {
    const fieldProgress = (filledFields / totalFields) * 10
    progress += fieldProgress
  }

  // Cap at 95% - only complete when actually submitted
  return Math.min(95, Math.max(5, progress))
}
