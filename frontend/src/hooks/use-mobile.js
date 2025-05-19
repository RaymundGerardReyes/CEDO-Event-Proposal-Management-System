"use client"

import { useEffect, useState } from "react"

/**
 * Custom hook to detect if the current viewport is mobile-sized
 * @param {number} breakpoint - The width in pixels below which we consider a device to be mobile
 * @returns {boolean} Whether the current viewport is mobile-sized
 */
export function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        // Function to check if the window width is below the breakpoint
        const checkMobile = () => {
            setIsMobile(window.innerWidth < breakpoint)
        }

        // Initial check
        checkMobile()

        // Listen for window resize events
        window.addEventListener("resize", checkMobile)

        // Clean up
        return () => window.removeEventListener("resize", checkMobile)
    }, [breakpoint])

    return isMobile
}

// Also export as useMobile for backward compatibility
export const useMobile = (breakpoint = 768) => {
    const isMobile = useIsMobile(breakpoint)
    // Return in the same format as the old hook might have used
    return { isMobile }
}
