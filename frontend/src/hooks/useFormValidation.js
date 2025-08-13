"use client"

import { isValidUUID } from "@/utils/uuid-migration"
import { useCallback, useState } from "react"

/**
 * Enhanced Form Validation Hook
 * Consolidates form validation and draft validation functionality
 * Replaces: draft-validation.js (merged functionality)
 */
const useFormValidation = (initialValues = {}, validationSchema = () => ({})) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form values
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target
      const fieldValue = type === "checkbox" ? checked : value

      setValues((prev) => ({
        ...prev,
        [name]: fieldValue,
      }))

      // Clear error when field is edited
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }))
      }
    },
    [errors],
  )

  // Set a specific field value programmatically
  const setFieldValue = useCallback(
    (name, value) => {
      setValues((prev) => ({
        ...prev,
        [name]: value,
      }))

      // Clear error when field is set
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }))
      }
    },
    [errors],
  )

  // Mark field as touched on blur
  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target

      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }))

      // Validate single field on blur
      const fieldErrors = validationSchema({ [name]: values[name] })
      if (fieldErrors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: fieldErrors[name],
        }))
      }
    },
    [values, validationSchema],
  )

  // Validate all fields
  const validateForm = useCallback(() => {
    const formErrors = validationSchema(values)
    setErrors(formErrors)
    return Object.keys(formErrors).length === 0
  }, [values, validationSchema])

  // Handle form submission
  const handleSubmit = useCallback(
    (onSubmit) => async (e) => {
      e.preventDefault()
      setIsSubmitting(true)

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true
        return acc
      }, {})
      setTouched(allTouched)

      const isValid = validateForm()

      if (isValid) {
        try {
          await onSubmit(values)
        } catch (error) {
          console.error("Form submission error:", error)
        }
      }

      setIsSubmitting(false)
    },
    [values, validateForm],
  )

  // Reset form to initial values
  const resetForm = useCallback(
    (newValues = initialValues) => {
      setValues(newValues)
      setErrors({})
      setTouched({})
      setIsSubmitting(false)
    },
    [initialValues],
  )

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    setFieldValue,
    validateForm,
    handleSubmit,
    resetForm,
    setValues,
    setErrors,
    setTouched,
  }
}

export default useFormValidation

// Draft validation utilities (merged from draft-validation.js)
export function isValidDraftId(draftId) {
  if (draftId === undefined || draftId === null) {
    return false
  }

  if (typeof draftId !== 'string') {
    return false
  }

  if (draftId.trim().length === 0) {
    return false
  }

  return true
}

export function validateDraftId(draftId, context = 'Layout') {
  if (!isValidDraftId(draftId)) {
    const errorMessage = `${context}: Invalid draftId parameter. Expected non-empty string, got: ${typeof draftId} (${draftId})`
    console.error('❌', errorMessage)
    throw new Error(errorMessage)
  }
}

export function isReviewDraft(draftId) {
  if (!isValidDraftId(draftId)) {
    return false
  }
  return draftId.startsWith('review-')
}

export function extractReviewInfo(draftId, searchParams = {}) {
  if (!isReviewDraft(draftId)) {
    return null
  }

  return {
    isReviewMode: true,
    draftId,
    mode: searchParams.mode || 'review',
    proposalId: searchParams.proposalId,
    source: searchParams.source,
    reviewDraftId: draftId
  }
}

export function createReviewDraft(reviewInfo) {
  if (!reviewInfo || !reviewInfo.isReviewMode) {
    throw new Error('Invalid review info provided')
  }

  return {
    id: reviewInfo.draftId,
    form_data: {
      id: reviewInfo.proposalId,
      source: reviewInfo.source,
      mode: reviewInfo.mode,
      status: 'rejected',
      isReviewMode: true,
      proposalId: reviewInfo.proposalId,
      currentSection: 'reporting'
    }
  }
}

export function sanitizeDraftId(draftId) {
  if (!isValidDraftId(draftId)) {
    return null
  }

  // Remove any dangerous characters
  return draftId.replace(/[^a-zA-Z0-9\-_]/g, '')
}

export function validateDraftIdFormat(draftId) {
  if (!isValidDraftId(draftId)) {
    return { isValid: false, reason: 'Invalid draft ID format' }
  }

  // Check if it's a UUID
  if (isValidUUID(draftId)) {
    return { isValid: true, format: 'uuid' }
  }

  // Check if it's a descriptive ID
  if (draftId.includes('-event') || draftId.includes('community') || draftId.includes('school')) {
    return { isValid: true, format: 'descriptive' }
  }

  // Check if it's a review draft
  if (isReviewDraft(draftId)) {
    return { isValid: true, format: 'review' }
  }

  return { isValid: false, reason: 'Unknown draft ID format' }
}

export function handleDraftIdValidation(draftId, options = {}) {
  const { context = 'Component', throwOnError = false } = options

  try {
    validateDraftId(draftId, context)
    const formatValidation = validateDraftIdFormat(draftId)

    if (!formatValidation.isValid) {
      const errorMessage = `${context}: ${formatValidation.reason}`
      console.error('❌', errorMessage)

      if (throwOnError) {
        throw new Error(errorMessage)
      }

      return { isValid: false, error: errorMessage }
    }

    return { isValid: true, format: formatValidation.format }
  } catch (error) {
    if (throwOnError) {
      throw error
    }

    return { isValid: false, error: error.message }
  }
}
