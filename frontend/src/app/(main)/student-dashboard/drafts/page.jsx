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
import { useState } from "react"

export default function DraftsPage() {
  const router = useRouter()
  const [drafts, setDrafts] = useState([
    {
      id: "draft-1",
      name: "Community Clean-up Event",
      lastEdited: "2025-04-02T14:30:00Z",
      step: "orgInfo",
      progress: 40,
      data: {
        eventTitle: "Community Clean-up Event",
        organizationName: "Green Earth Initiative",
        organizationTypes: ["community-based"],
        // Additional form data would be stored here
      },
    },
    {
      id: "draft-2",
      name: "Untitled Draft",
      lastEdited: "2025-04-01T09:15:00Z",
      step: "overview",
      progress: 15,
      data: {
        organizationTypes: ["school-based"],
        // Additional form data would be stored here
      },
    },
    {
      id: "draft-3",
      name: "Leadership Workshop",
      lastEdited: "2025-03-28T16:45:00Z",
      step: "schoolEvent",
      progress: 65,
      data: {
        eventTitle: "Leadership Workshop",
        organizationName: "Student Council",
        organizationTypes: ["school-based"],
        // Additional form data would be stored here
      },
    },
  ])

  const [draftToDelete, setDraftToDelete] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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
    // In a real app, we would store the draft data in a global state or context
    // and then navigate to the form with the data pre-populated
    localStorage.setItem("currentDraft", JSON.stringify(draft))
    router.push("/student-dashboard/submit-event")
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Resume Drafts</h1>
        <p className="text-muted-foreground">Continue working on your incomplete event submissions</p>
      </div>

      {drafts.length > 0 ? (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Auto-save enabled</AlertTitle>
            <AlertDescription>
              Your form progress is automatically saved as you type. You can safely navigate away and return later.
            </AlertDescription>
          </Alert>

          {drafts.map((draft) => (
            <Card key={draft.id} className="shadow-sm">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-6">
                  <div className="space-y-1">
                    <h3 className="font-medium text-lg">{draft.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <span>Last edited {formatDate(draft.lastEdited)}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <FileEdit className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Stopped at: {getStepName(draft.step)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="mr-4">
                      <div className="text-xs text-muted-foreground mb-1">Progress</div>
                      <div className="w-32 h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-[#0A2B70] rounded-full" style={{ width: `${draft.progress}%` }}></div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-9" onClick={() => confirmDelete(draft)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                    <Button variant="default" size="sm" className="h-9" onClick={() => handleContinueDraft(draft)}>
                      Continue
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No drafts found</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              You don't have any incomplete event submissions. Start a new submission to create one.
            </p>
            <Button onClick={() => router.push("/submit-event")}>Submit New Event</Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Draft</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => draftToDelete && handleDeleteDraft(draftToDelete.id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
