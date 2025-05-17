"use client"

import { PageHeader } from "@/components/page-header"
import { useEffect, useState } from "react"

// Loading component
function ProfileLoading() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
      <div className="space-y-4">
        <div>
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

export default function AdminProfilePage() {
  const [section, setSection] = useState("personal")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get the section from URL on client side after mount
    const params = new URLSearchParams(window.location.search)
    const sectionParam = params.get("section")
    if (sectionParam) {
      setSection(sectionParam)
    }

    // Listen for URL changes (back/forward navigation)
    const handleRouteChange = () => {
      const newParams = new URLSearchParams(window.location.search)
      const newSection = newParams.get("section") || "personal"
      setSection(newSection)
    }

    window.addEventListener("popstate", handleRouteChange)
    setIsLoading(false)

    return () => {
      window.removeEventListener("popstate", handleRouteChange)
    }
  }, [])

  if (isLoading) {
    return <ProfileLoading />
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader heading="Admin Profile" subheading="View and update your admin profile information" />
      <div className="mt-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Admin Profile</h2>
          <p className="mb-4">Current section: {section}</p>
          {/* Profile content would go here */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Personal Information</h3>
              <p className="text-muted-foreground">Your admin details would appear here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
