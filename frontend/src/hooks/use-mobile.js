"use client"

import { useEffect, useState } from "react"

export function useMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        // Check if window is defined (to avoid SSR issues)
        if (typeof window !== "undefined") {
            const checkMobile = () => {
                setIsMobile(window.innerWidth < breakpoint)
            }

            // Initial check
            checkMobile()

            // Add event listener for window resize
            window.addEventListener("resize", checkMobile)

            // Clean up event listener
            return () => {
                window.removeEventListener("resize", checkMobile)
            }
        }
    }, [breakpoint])

    return { isMobile }
}
