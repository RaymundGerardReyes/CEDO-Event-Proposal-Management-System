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
import { AlertTriangle } from "lucide-react"

export function SubmissionErrorDialog({ open, onOpenChange, onRetry, onEdit }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center text-xl text-red-700">Submission Failed</DialogTitle>
          <DialogDescription className="text-center">
            There was an error submitting your event proposal. Please try again or go back to edit your form.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-red-50 p-4 rounded-md my-4 border border-red-200">
          <h4 className="text-sm font-medium text-red-700 mb-2">Possible reasons:</h4>
          <ul className="text-sm text-red-600 space-y-1 list-disc pl-5">
            <li>Network connection issue</li>
            <li>Server is temporarily unavailable</li>
            <li>There might be an issue with your form data</li>
          </ul>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onEdit}
            className="w-full sm:w-auto border-cedo-blue text-cedo-blue hover:bg-cedo-blue/10"
          >
            Back to Form
          </Button>
          <Button onClick={onRetry} className="w-full sm:w-auto bg-cedo-blue hover:bg-cedo-blue/90 text-white">
            Retry Submission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
