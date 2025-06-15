// frontend/src/app/(main)/student-dashboard/drafts/page.jsx

"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, Clock, FileEdit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Suspense, useCallback, useEffect, useState } from "react"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

// Loading component for the drafts page with responsive design
function DraftsPageLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse p-4 sm:p-6 lg:p-8">
      <div>
        <div className="h-6 sm:h-8 w-36 sm:w-48 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 sm:h-4 w-64 sm:w-96 bg-gray-200 rounded"></div>
      </div>
      <div className="space-y-3 sm:space-y-4">
        <div className="h-16 sm:h-20 w-full bg-gray-200 rounded-lg"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 sm:h-24 w-full bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}

// Main content component with enhanced responsive design
function DraftsContent() {
  const router = useRouter()
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [draftToDelete, setDraftToDelete] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Helper wrapped in useCallback so we can reuse in timers / events
  const fetchDrafts = useCallback(async () => {
    try {
      setLoading(true)
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

      const email = localStorage.getItem('cedo_user_email') || ''
      if (!email) {
        setDrafts([])
        setLoading(false)
        return
      }

      const res = await fetch(`${backend}/api/mongodb-proposals/proposals/drafts/${encodeURIComponent(email)}`)
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`)
      }
      const { drafts = [] } = await res.json()
      setDrafts(drafts)
    } catch (err) {
      console.error('Failed to fetch drafts', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-load on mount
  useEffect(() => {
    fetchDrafts()
  }, [fetchDrafts])

  // Refresh whenever tab becomes visible (user returns from /submit-event)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDrafts()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchDrafts])

  // Lightweight polling every 30 s so updates appear even if user keeps page open
  useEffect(() => {
    const interval = setInterval(fetchDrafts, 30000)
    return () => clearInterval(interval)
  }, [fetchDrafts])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date)
  }

  const getStepName = (step) => {
    const steps = {
      overview: "Overview",
      orgInfo: "Organization Info",
      schoolEvent: "School Event Details",
      communityEvent: "Community Event Details",
      reporting: "Reporting",
    }
    return steps[step] || "Unknown Step"
  }

  const handleContinueDraft = (draft) => {
    // Persist minimal info; Section 2 / 3 components will fetch full data by ID
    localStorage.setItem('currentDraft', JSON.stringify({
      id: draft.id,
      organizationName: draft.data.organizationName,
      organizationTypes: draft.data.organizationTypes,
      contactEmail: draft.data.contactEmail
    }))
    router.push('/student-dashboard/submit-event')
  }

  const handleDeleteDraft = (draftId) => {
    setDrafts(drafts.filter((draft) => draft.id !== draftId))
    setShowDeleteDialog(false)
  }

  const confirmDelete = (draft) => {
    setDraftToDelete(draft)
    setShowDeleteDialog(true)
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header Section - Responsive Typography */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Resume Drafts</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Continue working on your incomplete event submissions</p>
      </div>

      {loading ? (
        <DraftsPageLoading />
      ) : error ? (
        <Alert variant="destructive" className="p-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load drafts</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : drafts.length > 0 ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Alert with Responsive Design */}
          <Alert className="p-4 sm:p-6">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            <AlertTitle className="text-sm sm:text-base font-medium">Auto-save enabled</AlertTitle>
            <AlertDescription className="text-xs sm:text-sm mt-1 sm:mt-2">
              Your form progress is automatically saved as you type. You can safely navigate away and return later.
            </AlertDescription>
          </Alert>

          {/* Draft Cards with Mobile-First Responsive Layout */}
          {drafts.map((draft) => (
            <Card key={draft.id} className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-0">
                {/* Mobile: Stacked Layout, Desktop: Side-by-side */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 sm:p-6 space-y-4 lg:space-y-0">
                  {/* Draft Information */}
                  <div className="space-y-2 sm:space-y-3 flex-1">
                    <h3 className="font-medium text-base sm:text-lg lg:text-xl break-words">{draft.name}</h3>

                    {/* Meta Information - Responsive Stack */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">Last edited {formatDate(draft.lastEdited)}</span>
                      </div>
                      <div className="flex items-center">
                        <FileEdit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground truncate">
                          Stopped at: {getStepName(draft.step)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions and Progress - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:ml-6">
                    {/* Progress Bar - Responsive Width */}
                    <div className="order-1 sm:order-none">
                      <div className="text-xs text-muted-foreground mb-1">Progress</div>
                      <div className="w-full sm:w-24 lg:w-32 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-[#0A2B70] rounded-full transition-all duration-300"
                          style={{ width: `${draft.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{draft.progress}% complete</div>
                    </div>

                    {/* Action Buttons - Touch Friendly */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-[44px] sm:min-h-[40px] px-3 sm:px-4 text-xs sm:text-sm"
                        onClick={() => confirmDelete(draft)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500 sm:mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="min-h-[44px] sm:min-h-[40px] px-4 sm:px-6 text-xs sm:text-sm font-medium"
                        onClick={() => handleContinueDraft(draft)}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Empty State with Responsive Design
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16 text-center px-4 sm:px-6">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-muted-foreground/50 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg lg:text-xl font-medium mb-1 sm:mb-2">No drafts found</h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-sm sm:max-w-md mb-4 sm:mb-6">
              You don't have any incomplete event submissions. Start a new submission to create one.
            </p>
            <Button
              className="min-h-[44px] px-6 text-sm sm:text-base"
              onClick={() => router.push("/student-dashboard/submit-event")}
            >
              Submit New Event
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Responsive Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-lg mx-auto">
          <DialogHeader className="space-y-2 sm:space-y-3">
            <DialogTitle className="text-lg sm:text-xl">Delete Draft</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete "{draftToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Button
              variant="outline"
              className="min-h-[44px] w-full sm:w-auto order-2 sm:order-1"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px] w-full sm:w-auto order-1 sm:order-2"
              onClick={() => draftToDelete && handleDeleteDraft(draftToDelete.id)}
            >
              Delete Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Main export with Suspense wrapper
export default function DraftsPage() {
  return (
    <Suspense fallback={<DraftsPageLoading />}>
      <DraftsContent />
    </Suspense>
  );
}
