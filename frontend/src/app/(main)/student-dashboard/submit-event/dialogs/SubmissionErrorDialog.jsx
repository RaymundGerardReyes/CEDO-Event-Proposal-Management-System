"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"

export function SubmissionErrorDialog({ open, onOpenChange, onRetry, onEdit }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center">Submission Failed</DialogTitle>
          <DialogDescription className="text-center">
            There was an error submitting your event proposal. Please try again or go back to edit your form.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onEdit} className="w-full sm:w-auto">
            Back to Form
          </Button>
          <Button onClick={onRetry} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            Retry Submission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
