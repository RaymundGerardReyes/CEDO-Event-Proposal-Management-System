// frontend/src/app/student-dashboard/hooks/useFormValidation.js

"use client"

import { useState, useCallback } from "react"

/**
 * Custom hook for form validation
 * @param {Object} initialValues - Initial form values
 * @param {Function} validationSchema - Function that returns validation errors
 * @returns {Object} Form validation utilities
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
