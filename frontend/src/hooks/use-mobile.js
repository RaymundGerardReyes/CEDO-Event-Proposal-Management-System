"use client"

import { useEffect, useState } from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Custom hook to detect if the current viewport is mobile-sized
 * @param {number} breakpoint - The width in pixels below which we consider a device to be mobile
 * @returns {boolean} Whether the current viewport is mobile-sized
 */
export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)

        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        }

        // Initial check
        checkIsMobile()

        // Listen for resize events
        window.addEventListener("resize", checkIsMobile)

        return () => {
            window.removeEventListener("resize", checkIsMobile)
        }
    }, [])

    // Return false during SSR to prevent hydration mismatches
    return isClient ? isMobile : false
}

// Enhanced responsive breakpoint hook
export function useBreakpoint() {
    const [breakpoint, setBreakpoint] = useState('lg') // Default to large screen
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)

        const getBreakpoint = () => {
            const width = window.innerWidth
            if (width < 640) return 'xs'
            if (width < 768) return 'sm'
            if (width < 1024) return 'md'
            if (width < 1280) return 'lg'
            return 'xl'
        }

        const handleResize = () => {
            setBreakpoint(getBreakpoint())
        }

        // Initial check
        handleResize()

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    return isClient ? breakpoint : 'lg'
}

// Enhanced screen size utilities
export function useScreenSize() {
    const [screenSize, setScreenSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        height: typeof window !== 'undefined' ? window.innerHeight : 768,
    })
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)

        const handleResize = () => {
            setScreenSize({
                width: window.innerWidth,
                height: window.innerHeight,
            })
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    return isClient ? screenSize : { width: 1024, height: 768 }
}

// Also export as useMobile for backward compatibility
export const useMobile = (breakpoint = 768) => {
    const isMobile = useIsMobile(breakpoint)
    // Return in the same format as the old hook might have used
    return { isMobile }
}
