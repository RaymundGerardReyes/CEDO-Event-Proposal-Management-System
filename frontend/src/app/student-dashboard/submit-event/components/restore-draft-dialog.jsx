"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

export function RestoreDraftDialog({ onRestore, onDiscard }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    // Check if there's a draft to restore
    const checkForDraft = () => {
      try {
        const draftsJSON = localStorage.getItem("eventSubmissionDrafts")
        if (!draftsJSON) return

        const drafts = JSON.parse(draftsJSON)
        if (drafts.length === 0) return

        // Get the most recent draft
        const mostRecentDraft = drafts.sort((a, b) => {
          return new Date(b.lastEdited) - new Date(a.lastEdited)
        })[0]

        setDraft(mostRecentDraft)
        setOpen(true)
      } catch (error) {
        console.error("Error checking for drafts:", error)
      }
    }

    // Small delay to ensure the component is fully mounted
    const timer = setTimeout(checkForDraft, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleRestore = () => {
    if (draft && onRestore) {
      onRestore(draft)
    }
    setOpen(false)
  }

  const handleDiscard = () => {
    if (onDiscard) {
      onDiscard()
    }
    setOpen(false)
  }

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

  if (!draft) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resume your draft</DialogTitle>
          <DialogDescription>
            You have an incomplete event submission. Would you like to continue from where you left off?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted/50 p-4 rounded-md">
            <h3 className="font-medium">{draft.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>Last edited {formatDate(draft.lastEdited)}</span>
            </div>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-1">Progress</div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-[#0A2B70] rounded-full" style={{ width: `${draft.progress}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleDiscard}>
            Start New
          </Button>
          <Button onClick={handleRestore}>Continue Draft</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
