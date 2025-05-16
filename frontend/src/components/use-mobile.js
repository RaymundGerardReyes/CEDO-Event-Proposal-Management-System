"use client"

import { useEffect, useState } from "react"

export function useMobile() {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        // Function to check if viewport width is mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768) // Consider < 768px as mobile
        }

        // Initial check
        checkMobile()

        // Add event listener for window resize
        window.addEventListener("resize", checkMobile)

        // Clean up event listener
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    return { isMobile }
}
