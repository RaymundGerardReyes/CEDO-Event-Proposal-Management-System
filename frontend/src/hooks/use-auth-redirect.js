"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function useAuthRedirect(options = {}) {
  const { requireAuth = true, redirectTo = requireAuth ? "/sign-in" : "/" } = options
  const { user, isLoading, isInitialized } = useAuth()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    if (isInitialized && !isLoading) {
      const isAuthenticated = !!user

      if (requireAuth && !isAuthenticated) {
        // Redirect to login if authentication is required but user is not authenticated
        router.push(redirectTo)
      } else if (!requireAuth && isAuthenticated) {
        // Redirect to dashboard if authentication is not required but user is authenticated
        router.push(redirectTo)
      }
    }
  }, [user, isLoading, isInitialized, isMounted, requireAuth, redirectTo, router])

  return {
    user,
    isLoading: isLoading || !isInitialized || !isMounted,
    isAuthenticated: !!user,
  }
}
