import { useEffect, useRef } from 'react'

/**
 * Custom hook that debounces the execution of an effect
 * @param {Function} callback - The function to be debounced
 * @param {number} delay - The delay in milliseconds
 * @param {Array} dependencies - The dependencies array for the effect
 */
export function useDebouncedEffect(callback, delay, dependencies = []) {
    const timeoutRef = useRef(null)
    const callbackRef = useRef(callback)

    // Update callback ref when callback changes
    useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    useEffect(() => {
        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
            callbackRef.current()
        }, delay)

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [...dependencies, delay])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])
}

export default useDebouncedEffect 